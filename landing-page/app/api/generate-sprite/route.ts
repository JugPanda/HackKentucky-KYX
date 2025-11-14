import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, type, style } = body;

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["player", "enemy", "item", "background"];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Build a detailed prompt for sprite generation
    const spriteType = type || "character";
    const artStyle = style || "pixel art";
    
    const detailedPrompt = `Create a ${artStyle} game sprite of a ${description} for use as a ${spriteType} in a 2D video game. 
The sprite should be:
- Simple and clear design
- Suitable for a 32x32 or 64x64 pixel game sprite
- On a transparent or white background
- ${spriteType === "player" ? "Facing forward, ready for action" : ""}
- ${spriteType === "enemy" ? "Menacing or threatening appearance" : ""}
- High contrast colors
- Easily recognizable at small sizes

Style: ${artStyle}, video game sprite, game asset, ${description}`;

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: detailedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    return NextResponse.json({
      ok: true,
      imageUrl,
      revisedPrompt: response.data?.[0]?.revised_prompt,
    });
  } catch (error) {
    console.error("Sprite generation error:", error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes("content_policy_violation")) {
        return NextResponse.json(
          { error: "The description violates content policy. Please try a different description." },
          { status: 400 }
        );
      }
      
      if (error.message.includes("rate_limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a moment." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate sprite. Please try again." },
      { status: 500 }
    );
  }
}

