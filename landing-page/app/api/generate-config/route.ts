import { NextRequest, NextResponse } from "next/server";

import { generateConfigFromPrompt } from "@/lib/promptToConfig";

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

    const config = generateConfigFromPrompt(prompt);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error("/api/generate-config error", error);
    return NextResponse.json(
      { ok: false, message: (error as Error).message },
      { status: 500 },
    );
  }
}
