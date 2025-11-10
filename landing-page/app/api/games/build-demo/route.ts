import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
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

    // Create a demo game entry
    const { data: game, error: createError } = await supabase
      .from("games")
      .insert({
        user_id: user.id,
        title: "Test Demo Game",
        slug: `test-demo-${Date.now()}`,
        description: "A simple test game to verify the platform works",
        config: {
          story: {
            tone: "hopeful",
            difficulty: "rookie"
          }
        },
        generated_code: null, // Signal to use test game
        status: "draft",
        visibility: "private",
      })
      .select()
      .single();

    if (createError || !game) {
      console.error("Failed to create demo game:", createError);
      return NextResponse.json(
        { error: "Failed to create demo game" },
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
      return NextResponse.json(
        { error: "Failed to queue build" },
        { status: 500 }
      );
    }

    // Trigger build with special flag
    const buildServiceUrl = process.env.BUILD_SERVICE_URL;
    const buildServiceSecret = process.env.BUILD_SERVICE_SECRET;

    if (!buildServiceUrl || !buildServiceSecret) {
      return NextResponse.json(
        { error: "Build service not configured" },
        { status: 500 }
      );
    }

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
        generatedCode: null, // Not used for test game
        use_test_game: true, // Special flag to use test-game.py
      }),
    });

    if (!buildResponse.ok) {
      console.error("Build service error:", await buildResponse.text());
      return NextResponse.json(
        { error: "Build failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      game_id: game.id,
      message: "Demo game build started!"
    });

  } catch (error) {
    console.error("Demo build error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

