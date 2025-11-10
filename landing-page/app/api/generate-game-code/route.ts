import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildGameGenerationPrompt, type GameGenerationRequest } from "@/lib/game-generator";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for AI generation

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        { error: "AI game generation not configured. Please set OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const body: GameGenerationRequest = await request.json();
    
    // Validate input
    if (!body.heroName || !body.enemyName || !body.goal) {
      return NextResponse.json(
        { error: "Missing required fields: heroName, enemyName, goal" },
        { status: 400 }
      );
    }

    // Build the prompt
    const prompt = buildGameGenerationPrompt(body);

    console.log("Generating game code with AI...");
    console.log("Hero:", body.heroName, "Enemy:", body.enemyName);
    if (body.description) {
      console.log("User Description:", body.description.substring(0, 100) + (body.description.length > 100 ? "..." : ""));
    }

    // Call OpenAI to generate the game code
    // Using gpt-4o-mini: faster, cheaper, and works within Vercel's timeout
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast model
      messages: [
        {
          role: "system",
          content: `You are an expert game developer specializing in Pygame. 
You create polished, fun, and well-structured games with excellent "game feel".
You always include:
- Particle effects for visual feedback
- Screen shake on impacts
- Smooth animations and movement
- Clear UI and health displays
- Proper game states (playing, win, lose)
- Invincibility frames after damage
- Balanced, fun gameplay

Your code is clean, well-organized with classes, and always works perfectly with pygbag (asyncio-compatible).
You write complete, production-ready games that feel satisfying to play.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7, // Slightly higher for more creative, varied games
      max_tokens: 3000, // Increased for more detailed, polished games (300-400 lines)
    });

    const generatedCode = completion.choices[0]?.message?.content;

    if (!generatedCode) {
      throw new Error("AI did not generate any code");
    }

    // Extract Python code from markdown code blocks if present
    let mainPy = generatedCode;
    const codeBlockMatch = generatedCode.match(/```python\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      mainPy = codeBlockMatch[1];
    }

    // Basic validation - check for required imports and async main
    const hasAsyncio = mainPy.includes("import asyncio");
    const hasPygame = mainPy.includes("import pygame");
    const hasAsyncMain = mainPy.includes("async def main");

    if (!hasAsyncio || !hasPygame || !hasAsyncMain) {
      console.warn("Generated code may not be pygbag-compatible");
      // Try to fix common issues
      if (!hasAsyncio) {
        mainPy = "import asyncio\n" + mainPy;
      }
    }

    // Generate a simple config alongside the code
    const config = {
      story: {
        title: body.heroName,
        leadName: body.heroName,
        codename: "Player",
        rivalName: body.enemyName,
        hubName: "Starting Zone",
        hubDescription: `The adventure of ${body.heroName} begins here.`,
        goal: body.goal,
        tone: body.tone,
        difficulty: body.difficulty,
        gameOverTitle: "Game Over",
        gameOverMessage: "Try again!",
      },
      tuning: {
        playerMaxHealth: body.difficulty === "rookie" ? 5 : body.difficulty === "veteran" ? 3 : 2,
        runMultiplier: 1.5,
        dashSpeed: 15,
        enemyBaseSpeed: body.difficulty === "rookie" ? 1 : body.difficulty === "veteran" ? 1.5 : 2,
      },
      colors: {
        accent: body.tone === "hopeful" ? "#10b981" : body.tone === "gritty" ? "#6b7280" : "#f59e0b",
        hud: "#ffffff",
        backgroundTop: "#1e293b",
        backgroundBottom: "#0f172a",
      },
      metadata: {
        generatedBy: "AI",
        model: "gpt-4o-mini",
        generatedAt: new Date().toISOString(),
      },
    };

    console.log("Successfully generated game code");

    return NextResponse.json({
      success: true,
      mainPy,
      config,
      assets: [], // No additional assets for now
      codeLength: mainPy.length,
      model: "gpt-4o-mini",
    });
  } catch (error) {
    console.error("Error generating game code:", error);
    
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "OpenAI API key is invalid or missing" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate game code", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

