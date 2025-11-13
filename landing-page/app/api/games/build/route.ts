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
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Verify the game belongs to the user
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .eq("user_id", user.id)
      .single();

    if (gameError || !game) {
      console.error("Game not found or unauthorized:", gameError);
      return NextResponse.json(
        { error: "Game not found or unauthorized" },
        { status: 404 }
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
      return NextResponse.json(
        { error: "Failed to queue build" },
        { status: 500 }
      );
    }

    // Trigger build service
    const buildServiceUrl = process.env.BUILD_SERVICE_URL;
    const buildServiceSecret = process.env.BUILD_SERVICE_SECRET;

    if (!buildServiceUrl || !buildServiceSecret) {
      console.error("Build service not configured:", {
        hasUrl: !!buildServiceUrl,
        hasSecret: !!buildServiceSecret
      });
      return NextResponse.json(
        { error: "Build service not configured" },
        { status: 500 }
      );
    }

    console.log(`Triggering build for game ${game.id} at ${buildServiceUrl}/build`);

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
        language: game.language || "python", // Default to python for existing games
        use_test_game: false,
      }),
    });

    if (!buildResponse.ok) {
      const errorText = await buildResponse.text();
      console.error("Build service error:", errorText);
      return NextResponse.json(
        { error: "Build service failed", details: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      game_id: game.id,
      build_id: buildJob.id,
      message: "Build started successfully!"
    });

  } catch (error) {
    console.error("Build API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
