import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { gameId } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { error: "gameId is required" },
        { status: 400 }
      );
    }

    // Verify game ownership and fetch game data
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .eq("user_id", user.id)
      .single();

    if (gameError || !game) {
      console.error("Game not found:", gameError);
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Check if game has generated code
    if (!game.generated_code) {
      return NextResponse.json(
        { error: "Game must have generated code before building" },
        { status: 400 }
      );
    }

    // Update game status to building
    const { error: updateError } = await supabase
      .from("games")
      .update({ status: "building" })
      .eq("id", gameId);

    if (updateError) {
      console.error("Failed to update game status:", updateError);
      return NextResponse.json(
        { error: "Failed to update game status" },
        { status: 500 }
      );
    }

    // Create build queue entry
    const { data: buildJob, error: buildError } = await supabase
      .from("build_queue")
      .insert({
        game_id: game.id,
        user_id: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (buildError || !buildJob) {
      console.error("Failed to create build job:", buildError);
      
      // Rollback game status
      await supabase
        .from("games")
        .update({ status: "draft" })
        .eq("id", gameId);
      
      return NextResponse.json(
        { error: "Failed to queue build" },
        { status: 500 }
      );
    }

    // Trigger build service
    const buildServiceUrl = process.env.BUILD_SERVICE_URL;
    const buildServiceSecret = process.env.BUILD_SERVICE_SECRET;

    if (!buildServiceUrl || !buildServiceSecret) {
      console.error("Build service not configured");
      
      // Update build job to failed
      await supabase
        .from("build_queue")
        .update({ 
          status: "failed",
          error_message: "Build service not configured"
        })
        .eq("id", buildJob.id);
      
      // Rollback game status
      await supabase
        .from("games")
        .update({ status: "draft" })
        .eq("id", gameId);
      
      return NextResponse.json(
        { error: "Build service not configured" },
        { status: 500 }
      );
    }

    // Call build service asynchronously
    try {
      const buildResponse = await fetch(`${buildServiceUrl}/build`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Build-Secret": buildServiceSecret,
        },
        body: JSON.stringify({
          buildId: buildJob.id,
          gameId: game.id,
          config: game.config,
          generatedCode: game.generated_code,
          language: game.language || "python",
        }),
      });

      if (!buildResponse.ok) {
        const errorText = await buildResponse.text();
        console.error("Build service error:", errorText);
        
        // Update build job to failed
        await supabase
          .from("build_queue")
          .update({ 
            status: "failed",
            error_message: `Build service error: ${errorText}`
          })
          .eq("id", buildJob.id);
        
        // Update game status to failed
        await supabase
          .from("games")
          .update({ status: "failed" })
          .eq("id", gameId);
        
        return NextResponse.json(
          { error: "Build service returned an error" },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      console.error("Failed to call build service:", fetchError);
      
      // Update build job to failed
      await supabase
        .from("build_queue")
        .update({ 
          status: "failed",
          error_message: `Failed to call build service: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
        })
        .eq("id", buildJob.id);
      
      // Update game status to failed
      await supabase
        .from("games")
        .update({ status: "failed" })
        .eq("id", gameId);
      
      return NextResponse.json(
        { error: "Failed to contact build service" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      game_id: game.id,
      build_id: buildJob.id,
      message: "Build started successfully"
    });

  } catch (error) {
    console.error("Build error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
