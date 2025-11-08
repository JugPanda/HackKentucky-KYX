import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { checkContent, sanitizeText } from "@/lib/content-filter";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    if (!rateLimit(`comment:${user.id}`, RATE_LIMITS.COMMENT)) {
      return NextResponse.json(
        { error: "Too many comments. Please slow down." },
        { status: 429 }
      );
    }

    const { gameId, content } = await request.json();

    if (!gameId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Sanitize and validate content
    const sanitizedContent = sanitizeText(content, 1000);

    if (sanitizedContent.length < 1 || sanitizedContent.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be between 1 and 1000 characters" },
        { status: 400 }
      );
    }

    // Content filter
    const contentCheck = checkContent(sanitizedContent);
    if (!contentCheck.isClean) {
      return NextResponse.json(
        { error: contentCheck.reason || "Comment contains inappropriate content" },
        { status: 400 }
      );
    }

    // Verify game exists and is public
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("id", gameId)
      .eq("visibility", "public")
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        user_id: user.id,
        game_id: gameId,
        content: sanitizedContent,
      })
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .single();

    if (commentError) {
      console.error("Error creating comment:", commentError);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error in create comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

