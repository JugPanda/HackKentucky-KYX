import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId } = await request.json();

    if (!gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }

    // Check if like already exists
    const { data: existingLike, error: likeCheckError } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("game_id", gameId)
      .single();

    // If error is not "not found", it's a real error
    if (likeCheckError && likeCheckError.code !== "PGRST116") {
      console.error("Error checking like:", likeCheckError);
      return NextResponse.json({ error: "Failed to check like status" }, { status: 500 });
    }

    if (existingLike) {
      // Unlike: delete the like
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        console.error("Error removing like:", deleteError);
        return NextResponse.json({ error: "Failed to remove like" }, { status: 500 });
      }

      return NextResponse.json({ liked: false });
    } else {
      // Like: create the like
      const { error: likeError } = await supabase
        .from("likes")
        .insert({
          user_id: user.id,
          game_id: gameId,
        });

      if (likeError) {
        console.error("Error creating like:", likeError);
        return NextResponse.json({ error: "Failed to like game" }, { status: 500 });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error in like game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
