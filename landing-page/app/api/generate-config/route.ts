import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt ?? "").trim();

    if (!prompt) {
      return NextResponse.json(
        { ok: false, message: "Prompt is required" },
        { status: 400 },
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured, using fallback");
      // Fallback to simple generation if no API key
      const { generateConfigFromPrompt } = await import("@/lib/promptToConfig");
      const config = generateConfigFromPrompt(prompt);
      return NextResponse.json({ ok: true, config });
    }

    console.log("Using AI to generate game config from prompt...");

    // Use OpenAI to intelligently parse the prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a game design assistant. Extract game details from the user's description.
          
Return a JSON object with this structure:
{
  "story": {
    "leadName": "hero name (extract from prompt or create one that fits)",
    "rivalName": "enemy/villain name (extract or create)",
    "goal": "main objective (extract or create)",
    "tone": "hopeful OR gritty OR heroic (based on mood)",
    "difficulty": "rookie OR veteran OR nightmare (based on challenge level)"
  }
}

Guidelines:
- Extract names if mentioned, otherwise create fitting names
- Detect tone: hopeful=bright/optimistic, gritty=dark/harsh, heroic=epic/legendary
- Detect difficulty: rookie=easy/casual, veteran=medium/balanced, nightmare=hard/brutal
- Keep names concise (2-3 words max)
- Make goal specific and actionable
- ALWAYS return valid JSON`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const generatedContent = completion.choices[0]?.message?.content;
    
    if (!generatedContent) {
      throw new Error("AI did not generate config");
    }

    const parsedConfig = JSON.parse(generatedContent);
    
    // Validate and ensure required fields
    const config = {
      story: {
        leadName: parsedConfig.story?.leadName || "Hero",
        codename: parsedConfig.story?.leadName || "Hero",
        rivalName: parsedConfig.story?.rivalName || "Enemy",
        hubName: "Safe Zone",
        hubDescription: parsedConfig.story?.hubDescription || `${parsedConfig.story?.leadName}'s adventure begins here.`,
        goal: parsedConfig.story?.goal || "Complete the mission",
        tone: parsedConfig.story?.tone || "hopeful",
        difficulty: parsedConfig.story?.difficulty || "veteran",
      },
    };

    console.log("Successfully generated AI config:", config.story.leadName);

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error("/api/generate-config error", error);
    
    // Fallback to simple generation on error
    try {
      const body = await req.json();
      const prompt = String(body?.prompt ?? "").trim();
      const { generateConfigFromPrompt } = await import("@/lib/promptToConfig");
      const config = generateConfigFromPrompt(prompt);
      return NextResponse.json({ ok: true, config });
    } catch (fallbackError) {
      return NextResponse.json(
        { ok: false, message: (error as Error).message },
        { status: 500 },
      );
    }
  }
}
