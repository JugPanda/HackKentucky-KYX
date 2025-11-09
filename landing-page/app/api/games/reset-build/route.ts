import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
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

    // Update any pending/processing builds to failed
    await supabase
      .from("build_queue")
      .update({ 
        status: "failed",
        error_message: "Build timeout - manually reset",
        completed_at: new Date().toISOString()
      })
      .eq("game_id", gameId)
      .in("status", ["pending", "processing"]);

    // Reset game status to draft
    await supabase
      .from("games")
      .update({ status: "draft" })
      .eq("id", gameId);

    return NextResponse.json({ 
      message: "Build reset successfully. You can now try building again.",
      gameId 
    });
  } catch (error) {
    console.error("Error resetting build:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

