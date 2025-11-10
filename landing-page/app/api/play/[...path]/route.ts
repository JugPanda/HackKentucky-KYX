import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path;
    console.log('[PLAY API] Request path segments:', pathSegments);
    
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
      console.log('[PLAY API] Resolved storage path:', storagePath);
    }

    // Download the file from storage
    console.log('[PLAY API] Attempting to download from:', storagePath);
    const { data: fileData, error: fileError } = await supabase.storage
      .from("game-bundles")
      .download(storagePath);

    if (fileError || !fileData) {
      console.error(`[PLAY API] File not found: ${storagePath}`, fileError);
      console.error('[PLAY API] Error details:', JSON.stringify(fileError, null, 2));
      
      // Return a helpful error page instead of plain text
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Game Not Found</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              background: #0d1117;
              color: #c9d1d9;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .error-box {
              background: #161b22;
              border: 1px solid #30363d;
              border-radius: 8px;
              padding: 32px;
              max-width: 500px;
              text-align: center;
            }
            h1 { color: #f85149; margin-top: 0; }
            .details {
              background: #0d1117;
              border: 1px solid #21262d;
              border-radius: 4px;
              padding: 16px;
              margin-top: 20px;
              text-align: left;
              font-family: monospace;
              font-size: 12px;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          <div class="error-box">
            <h1>🎮 Game Not Found</h1>
            <p>The game files could not be loaded.</p>
            <div class="details">
              <strong>Storage Path:</strong> ${storagePath}<br>
              <strong>Error:</strong> ${fileError?.message || 'Unknown error'}<br>
              <br>
              <strong>Possible causes:</strong><br>
              • Game hasn't been built yet<br>
              • Build failed during processing<br>
              • Files weren't uploaded to storage<br>
            </div>
            <p style="margin-top: 24px; font-size: 14px; color: #8b949e;">
              Try rebuilding the game from your dashboard.
            </p>
          </div>
        </body>
        </html>
      `;
      
      return new NextResponse(errorHtml, {
        status: 404,
        headers: { "Content-Type": "text/html" }
      });
    }
    
    console.log('[PLAY API] File downloaded successfully, size:', fileData.size);

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
    
    // Common headers for all responses
    const commonHeaders = {
      "Content-Type": contentType,
      "Content-Length": arrayBuffer.byteLength.toString(),
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "unsafe-none", 
      "Cross-Origin-Resource-Policy": "cross-origin",
    };

    // For HTML files, inject a <base> tag to fix relative paths and hide debug console
    if (contentType === "text/html") {
      let html = new TextDecoder().decode(arrayBuffer);
      const baseUrl = `/api/play/${gameId}/`;
      
      // Inject base tag and CSS to hide debug console
      const injectedHead = `<head>
    <base href="${baseUrl}">
    <style>
      /* Hide Pygbag debug console for production */
      #pyconsole, #system, #transfer, #info, #box { display: none !important; }
    </style>`;
      
      if (html.includes("<head>")) {
        html = html.replace("<head>", injectedHead);
      } else if (html.includes("<!DOCTYPE html>")) {
        html = html.replace("<!DOCTYPE html>", `<!DOCTYPE html>\n<html>${injectedHead}</head>`);
      }
      
      return new NextResponse(html, {
        status: 200,
        headers: commonHeaders,
      });
    }

    // For other files, return with proper CORS/COOP headers for all assets
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        ...commonHeaders,
        "Cache-Control": "public, max-age=31536000", // 1 year for assets
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

