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
    
    // Path can be:
    // - [gameId] -> serves index.html
    // - [gameId, filename] -> serves specific file
    const gameId = pathSegments[0];
    const filename = pathSegments[1] || 'index.html';

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Construct storage path
    const storagePath = `games/${gameId}/${filename}`;

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

