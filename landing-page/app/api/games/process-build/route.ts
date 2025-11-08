import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { existsSync } from "fs";

const execAsync = promisify(exec);

// Use service role key for server-side operations
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  let tempDir: string | null = null;
  let buildId: string | null = null;

  try {
    const body = await request.json();
    buildId = body.buildId;

    // Get build job
    const { data: buildJob, error: buildError } = await supabase
      .from("build_queue")
      .select("*, games(*)")
      .eq("id", buildId)
      .single();

    if (buildError || !buildJob) {
      return NextResponse.json({ error: "Build job not found" }, { status: 404 });
    }

    // Update status to processing
    await supabase
      .from("build_queue")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", buildId);

    const game = buildJob.games;
    const config = game.config;

    // Create temp directory
    tempDir = join(tmpdir(), `kyx-build-${buildId}`);
    await mkdir(tempDir, { recursive: true });

    // Write config file
    const configPath = join(tempDir, "game_config.json");
    await writeFile(configPath, JSON.stringify(config, null, 2));

    // Check if game has AI-generated code
    const mainPyPath = join(tempDir, "main.py");
    
    if (game.generated_code) {
      // Use AI-generated code
      console.log("Using AI-generated game code");
      await writeFile(mainPyPath, game.generated_code);
    } else {
      // Fallback: Copy main.py from demo-game template
      console.log("Using demo-game template");
      const repoRoot = process.cwd().replace(/landing-page$/, "");
      const mainPySource = join(repoRoot, "demo-game", "main.py");

      if (!existsSync(mainPySource)) {
        throw new Error("main.py not found");
      }

      // Copy main.py to temp directory
      await execAsync(
        process.platform === "win32"
          ? `copy "${mainPySource}" "${join(tempDir, "main.py")}"`
          : `cp "${mainPySource}" "${join(tempDir, "main.py")}"`
      );
    }

    // Run pygbag build
    const pythonCmd = process.env.KYX_PYTHON || "python3";
    const { stdout: buildStdout } = await execAsync(
      `cd "${tempDir}" && ${pythonCmd} -m pygbag --build main.py`,
      { timeout: 120000 } // 2 minute timeout
    );

    console.log("Pygbag build output:", buildStdout);

    // Check if build was successful
    const buildOutputDir = join(tempDir, "build", "web");
    if (!existsSync(buildOutputDir)) {
      throw new Error("Build output not found");
    }

    // Upload to Supabase Storage
    const storageKey = `${game.user_id}/${game.slug}/index.html`;
    
    // Read and upload main files
    const fs = await import("fs/promises");
    const indexHtml = await fs.readFile(join(buildOutputDir, "index.html"));
    
    const { error: uploadError } = await supabase.storage
      .from("game-bundles")
      .upload(storageKey, indexHtml, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("game-bundles")
      .getPublicUrl(storageKey);

    const bundleUrl = publicUrlData.publicUrl;

    // Update game record
    await supabase
      .from("games")
      .update({
        status: "built",
        bundle_url: bundleUrl,
        bundle_size: indexHtml.length,
      })
      .eq("id", game.id);

    // Update build job as completed
    await supabase
      .from("build_queue")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", buildId);

    // Cleanup temp directory
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }

    return NextResponse.json({
      message: "Build completed successfully",
      bundleUrl,
    });
  } catch (error: unknown) {
    console.error("Build processing error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update build job as failed
    if (buildId) {
      await supabase
        .from("build_queue")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", buildId)
        .then(async ({ data: failedBuild }: { data: unknown }) => {
          if (failedBuild && typeof failedBuild === 'object' && 'game_id' in failedBuild) {
            await supabase
              .from("games")
              .update({ status: "failed" })
              .eq("id", (failedBuild as { game_id: string }).game_id);
          }
        });
    }

    // Cleanup temp directory on error
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

