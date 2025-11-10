import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let gameId: string = "";
    let filename: string = "";
    let storagePath: string | undefined;
    
    // Handle different path patterns:
    // - [gameId] -> serves index.html
    // - [gameId, filename] -> serves specific file
    // - [filename.apk] -> search for .apk file across all games
    
    if (pathSegments.length === 1 && pathSegments[0].endsWith('.apk')) {
      // Special case: .apk file requested directly (e.g., /api/play/kyx-build-xxx.apk)
      const apkFilename = pathSegments[0];
      
      // List all game directories
      const { data: gameDirs, error: listError } = await supabase.storage
        .from("game-bundles")
        .list("games");
      
      if (listError || !gameDirs) {
        console.error("Failed to list game directories:", listError);
        return new NextResponse("File not found", { status: 404 });
      }
      
      // Search for the .apk file in each game directory
      for (const dir of gameDirs) {
        if (!dir.name) continue;
        const testPath = `games/${dir.name}/${apkFilename}`;
        const { data: testData, error: testError } = await supabase.storage
          .from("game-bundles")
          .download(testPath);
        
        if (!testError && testData) {
          // Found it!
          gameId = dir.name;
          filename = apkFilename;
          storagePath = testPath;
          break;
        }
      }
      
      if (!storagePath) {
        console.error(`APK file ${apkFilename} not found in any game directory`);
        return new NextResponse("File not found", { status: 404 });
      }
    } else {
      // Normal case: gameId and optional filename
      gameId = pathSegments[0];
      filename = pathSegments[1] || 'index.html';
      storagePath = `games/${gameId}/${filename}`;
    }

    // Download the file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("game-bundles")
      .download(storagePath);

    if (fileError || !fileData) {
      console.error(`File not found: ${storagePath}`, fileError);
      return new NextResponse("File not found", { status: 404 });
    }

    // Determine content type based on file extension
    let contentType = "text/html";
    if (filename.endsWith(".js")) {
      contentType = "application/javascript";
    } else if (filename.endsWith(".wasm")) {
      contentType = "application/wasm";
    } else if (filename.endsWith(".png")) {
      contentType = "image/png";
    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (filename.endsWith(".apk")) {
      contentType = "application/vnd.android.package-archive";
    } else if (filename.endsWith(".data")) {
      contentType = "application/octet-stream";
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

    // For HTML files, inject a <base> tag to fix relative paths
    if (contentType === "text/html") {
      let html = new TextDecoder().decode(arrayBuffer);
      const baseUrl = `/api/play/${gameId}/`;
      
      // Inject base tag right after <head>
      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>\n    <base href="${baseUrl}">`);
      } else if (html.includes("<!DOCTYPE html>")) {
        html = html.replace("<!DOCTYPE html>", `<!DOCTYPE html>\n<html><head><base href="${baseUrl}"></head>`);
      }
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
      });
    }

    // Return with correct content type
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

