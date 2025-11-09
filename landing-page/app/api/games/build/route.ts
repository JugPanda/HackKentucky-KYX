import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Route segment config
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(request: Request) {
  console.log("BUILD ROUTE: Request received");
  
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId } = await request.json();

    // Verify game ownership
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .eq("user_id", user.id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if there's already a pending/processing build
    const { data: existingBuild } = await supabase
      .from("build_queue")
      .select("*")
      .eq("game_id", gameId)
      .in("status", ["pending", "processing"])
      .single();

    if (existingBuild) {
      return NextResponse.json(
        { error: "A build is already in progress for this game" },
        { status: 409 }
      );
    }

    // Update game status
    await supabase
      .from("games")
      .update({ status: "building" })
      .eq("id", gameId);

    // Add to build queue
    const { data: buildJob, error: buildError } = await supabase
      .from("build_queue")
      .insert({
        game_id: gameId,
        user_id: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (buildError) {
      console.error("Error creating build job:", buildError);
      return NextResponse.json({ error: "Failed to queue build" }, { status: 500 });
    }

    // Call external build service
    const buildServiceUrl = process.env.BUILD_SERVICE_URL;
    const buildServiceSecret = process.env.BUILD_SERVICE_SECRET;

    console.log("BUILD_SERVICE_URL configured:", !!buildServiceUrl);
    console.log("BUILD_SERVICE_SECRET configured:", !!buildServiceSecret);

    if (!buildServiceUrl || !buildServiceSecret) {
      console.error("BUILD_SERVICE_URL or BUILD_SERVICE_SECRET not configured");
      return NextResponse.json(
        { error: "Build service not configured. Please contact administrator." },
        { status: 503 }
      );
    }

    console.log("Calling build service at:", buildServiceUrl);

    // Trigger async build (non-blocking)
    fetch(`${buildServiceUrl}/build`, {
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
      }),
    }).catch((err) => console.error("Failed to trigger build service:", err));

    return NextResponse.json(
      {
        message: "Build queued successfully",
        buildId: buildJob.id,
        gameId,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error in build game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Check build status
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    if (!gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }

    const { data: buildJob } = await supabase
      .from("build_queue")
      .select("*")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!buildJob) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    return NextResponse.json({ build: buildJob });
  } catch (error) {
    console.error("Error checking build status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

