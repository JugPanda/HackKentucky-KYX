import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildGameGenerationPrompt, buildJavaScriptGamePrompt, type GameGenerationRequest } from "@/lib/game-generator";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max for Vercel Hobby plan (use 300 for Pro)

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

    // Build the prompt based on language
    const language = body.language || "python";
    const prompt = language === "javascript" 
      ? buildJavaScriptGamePrompt(body)
      : buildGameGenerationPrompt(body);

    console.log("Generating game code with AI...");
    console.log("Language:", language, "Hero:", body.heroName, "Enemy:", body.enemyName);
    if (body.description) {
      console.log("User Description:", body.description.substring(0, 100) + (body.description.length > 100 ? "..." : ""));
    }

    // Call OpenAI to generate the game code
    // Using gpt-4o-mini: faster, cheaper, and works within Vercel's timeout
    const systemPrompt = language === "javascript"
      ? `You are an expert game developer specializing in HTML5 Canvas and JavaScript game development.
You create polished, fun, and well-structured games with excellent "game feel".
You always include:
- Particle effects for visual feedback
- Screen shake on impacts
- Smooth animations and movement
- Clear UI and health displays
- Proper game states (intro, playing, level complete, win, lose)
- Invincibility frames after damage
- Balanced, fun gameplay with multiple levels

Your code is clean, well-organized with ES6 classes, and runs flawlessly in modern browsers.
You write complete, production-ready HTML5 games that feel satisfying to play.`
      : `You are an expert game developer specializing in Pygame. 
You create polished, fun, and well-structured games with excellent "game feel".
You always include:
- Particle effects for visual feedback
- Screen shake on impacts
- Smooth animations and movement
- Clear UI and health displays
- Proper game states (intro, playing, level complete, win, lose)
- Invincibility frames after damage
- Balanced, fun gameplay with multiple levels

Your code is clean, well-organized with classes, and always works perfectly with pygbag (asyncio-compatible).
You write complete, production-ready games that feel satisfying to play.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast model
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7, // Slightly higher for more creative, varied games
      max_tokens: language === "javascript" ? 3500 : 3000, // Reduced for faster generation
    }, {
      timeout: 50000, // 50 second timeout for OpenAI API
    });

    const generatedCode = completion.choices[0]?.message?.content;

    if (!generatedCode) {
      throw new Error("AI did not generate any code");
    }

    // Extract code from markdown code blocks if present
    let mainPy = generatedCode;
    
    if (language === "javascript") {
      // Extract HTML from markdown code blocks
      const htmlBlockMatch = generatedCode.match(/```html\n([\s\S]*?)\n```/);
      if (htmlBlockMatch) {
        mainPy = htmlBlockMatch[1];
      }
      
      // Basic validation for HTML
      if (!mainPy.includes("<!DOCTYPE html>") && !mainPy.includes("<html")) {
        console.warn("Generated code may not be valid HTML");
      }
    } else {
      // Extract Python code from markdown code blocks
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

    // Handle timeout errors
    if (error instanceof Error && (error.message.includes("timeout") || error.message.includes("timed out"))) {
      return NextResponse.json(
        { error: "Game generation timed out. Try again or simplify your game description." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate game code", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

