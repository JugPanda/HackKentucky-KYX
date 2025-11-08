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

    const { gameId, visibility } = await request.json();

    if (!["private", "unlisted", "public"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility value" }, { status: 400 });
    }

    // Verify game ownership
    const { data: game } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .eq("user_id", user.id)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if game is built
    if (game.status !== "built" && game.status !== "published" && visibility === "public") {
      return NextResponse.json(
        { error: "Game must be built before publishing" },
        { status: 400 }
      );
    }

    // Update game visibility
    const updateData: {
      visibility: string;
      status?: string;
      published_at?: string;
    } = { visibility };

    if (visibility === "public" && game.status === "built") {
      updateData.status = "published";
      updateData.published_at = new Date().toISOString();
    } else if (visibility !== "public" && game.status === "published") {
      updateData.status = "built";
    }

    const { data: updatedGame, error: updateError } = await supabase
      .from("games")
      .update(updateData)
      .eq("id", gameId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating game:", updateError);
      return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
    }

    return NextResponse.json({ game: updatedGame });
  } catch (error) {
    console.error("Error in publish game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

