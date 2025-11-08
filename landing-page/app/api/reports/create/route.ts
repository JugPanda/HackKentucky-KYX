import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { checkContent } from "@/lib/content-filter";

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
    if (!rateLimit(`report:${user.id}`, RATE_LIMITS.REPORT)) {
      return NextResponse.json(
        { error: "Too many reports. Please try again later." },
        { status: 429 }
      );
    }

    const { targetType, targetId, reason } = await request.json();

    if (!["user", "game", "comment"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
    }

    if (!targetId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Content filter
    const contentCheck = checkContent(reason);
    if (!contentCheck.isClean) {
      return NextResponse.json(
        { error: "Report reason contains inappropriate content" },
        { status: 400 }
      );
    }

    // Create report
    const reportData: {
      reporter_id: string;
      reason: string;
      reported_user_id?: string;
      game_id?: string;
      comment_id?: string;
    } = {
      reporter_id: user.id,
      reason: reason.slice(0, 500),
    };

    if (targetType === "user") {
      reportData.reported_user_id = targetId;
    } else if (targetType === "game") {
      reportData.game_id = targetId;
    } else if (targetType === "comment") {
      reportData.comment_id = targetId;
    }

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert(reportData)
      .select()
      .single();

    if (reportError) {
      console.error("Error creating report:", reportError);
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error in create report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

