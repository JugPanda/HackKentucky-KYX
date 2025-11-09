import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { gameConfigSchema } from "@/lib/schemas";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId, title, description, config, generatedCode } = await request.json();

    if (!gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }

    // Verify game ownership
    const { data: existingGame, error: fetchError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Validate config if provided
    let validatedConfig = existingGame.config;
    if (config) {
      const validation = gameConfigSchema.safeParse(config);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid config", issues: validation.error.issues },
          { status: 400 }
        );
      }
      validatedConfig = validation.data;
    }

    // Update game
    const updateData: {
      title?: string;
      description?: string;
      config?: typeof validatedConfig;
      generated_code?: string | null;
      status?: string;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (config !== undefined) updateData.config = validatedConfig;
    if (generatedCode !== undefined) updateData.generated_code = generatedCode || null;
    
    // Reset status to draft if config or code changed
    if (config !== undefined || generatedCode !== undefined) {
      updateData.status = "draft";
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
    console.error("Error in update game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

