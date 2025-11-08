import { createClient } from "@/lib/supabase/server";
import { gameConfigSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, title, description, config } = body;

    // Validate config
    const validation = gameConfigSchema.safeParse(config);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid game configuration", issues: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if slug is unique for this user
    const { data: existingGame } = await supabase
      .from("games")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .single();

    if (existingGame) {
      return NextResponse.json(
        { error: "A game with this slug already exists" },
        { status: 409 }
      );
    }

    // Create game record
    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        user_id: user.id,
        slug,
        title,
        description,
        config: validation.data,
        status: "draft",
        visibility: "private",
      })
      .select()
      .single();

    if (gameError) {
      console.error("Error creating game:", gameError);
      return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
    }

    return NextResponse.json({ game }, { status: 201 });
  } catch (error) {
    console.error("Error in create game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

