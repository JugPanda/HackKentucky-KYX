"""
KYX Game Build Service
A standalone Python service that builds pygame games using pygbag and uploads to Supabase.
"""

import os
import sys
import json
import shutil
import logging
import tempfile
import subprocess
from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify
from supabase import create_client, Client
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js app

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUILD_SERVICE_SECRET = os.getenv("BUILD_SERVICE_SECRET", "change-me-in-production")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def verify_secret(request_secret: str) -> bool:
    """Verify the request secret to prevent unauthorized builds."""
    return request_secret == BUILD_SERVICE_SECRET


def update_build_status(build_id: str, status: str, error_message: str = None):
    """Update the build queue status in the database."""
    try:
        data = {
            "status": status,
            "completed_at": datetime.utcnow().isoformat() if status in ["completed", "failed"] else None
        }
        if error_message:
            data["error_message"] = error_message
        
        supabase.table("build_queue").update(data).eq("id", build_id).execute()
        logger.info(f"Updated build {build_id} status to {status}")
    except Exception as e:
        logger.error(f"Failed to update build status: {e}")


def update_game_status(game_id: str, status: str, bundle_url: str = None):
    """Update the game status in the database."""
    try:
        data = {"status": status}
        if bundle_url:
            data["bundle_url"] = bundle_url
        
        supabase.table("games").update(data).eq("id", game_id).execute()
        logger.info(f"Updated game {game_id} status to {status}")
    except Exception as e:
        logger.error(f"Failed to update game status: {e}")


def build_game(build_id: str, game_id: str, config: dict, generated_code: str = None) -> str:
    """
    Build a game using pygbag and upload to Supabase Storage.
    Returns the bundle URL.
    """
    temp_dir = None
    
    try:
        # Create temporary directory
        temp_dir = tempfile.mkdtemp(prefix="kyx-build-")
        logger.info(f"Created temp directory: {temp_dir}")
        
        # Write game_config.json
        config_path = Path(temp_dir) / "game_config.json"
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)
        logger.info("Wrote game_config.json")
        
        # Write main.py
        main_py_path = Path(temp_dir) / "main.py"
        if generated_code:
            logger.info("Using AI-generated game code")
            with open(main_py_path, "w") as f:
                f.write(generated_code)
        else:
            # Use demo game template (you'll need to mount this or include it)
            logger.info("Using demo game template")
            demo_main = Path(__file__).parent / "demo-game" / "main.py"
            if demo_main.exists():
                shutil.copy(demo_main, main_py_path)
            else:
                raise FileNotFoundError("Demo game template not found")
        
        logger.info("Wrote main.py")
        
        # Run pygbag build
        logger.info("Starting pygbag build...")
        result = subprocess.run(
            [sys.executable, "-m", "pygbag", "--build", "main.py"],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )
        
        if result.returncode != 0:
            logger.error(f"Pygbag build failed: {result.stderr}")
            raise Exception(f"Pygbag build failed: {result.stderr}")
        
        logger.info(f"Pygbag build output: {result.stdout}")
        
        # Check for build output
        build_output = Path(temp_dir) / "build" / "web"
        if not build_output.exists():
            raise FileNotFoundError("Build output directory not found")
        
        # Upload all files from build/web directory to Supabase Storage
        logger.info("Uploading build files to Supabase Storage...")
        storage_base = f"games/{game_id}"
        
        # List all files found in build directory
        all_files = list(build_output.rglob("*"))
        file_list = [str(f.relative_to(build_output)) for f in all_files if f.is_file()]
        logger.info(f"Found {len(file_list)} files to upload: {file_list}")
        
        # Upload each file individually
        for file_path in all_files:
            if file_path.is_file():
                # Get relative path from build_output
                relative_path = file_path.relative_to(build_output)
                storage_path = f"{storage_base}/{relative_path}".replace("\\", "/")
                
                # Determine content type
                file_ext = str(file_path).lower()
                if file_ext.endswith(".html") or file_ext.endswith(".htm"):
                    content_type = "text/html"
                elif file_ext.endswith(".js"):
                    content_type = "application/javascript"
                elif file_ext.endswith(".wasm"):
                    content_type = "application/wasm"
                elif file_ext.endswith(".data"):
                    content_type = "application/octet-stream"
                elif file_ext.endswith(".json"):
                    content_type = "application/json"
                elif file_ext.endswith(".png"):
                    content_type = "image/png"
                elif file_ext.endswith((".jpg", ".jpeg")):
                    content_type = "image/jpeg"
                elif file_ext.endswith(".apk"):
                    content_type = "application/vnd.android.package-archive"
                else:
                    content_type = "application/octet-stream"
                
                logger.info(f"Uploading: {storage_path} with Content-Type: {content_type}")
                with open(file_path, "rb") as f:
                    file_data = f.read()
                
                # Use direct HTTP request with proper headers
                import httpx
                upload_url = f"{SUPABASE_URL}/storage/v1/object/game-bundles/{storage_path}"
                
                # Upload with multipart form data to set content-type correctly
                files = {
                    'file': (storage_path.split('/')[-1], file_data, content_type)
                }
                upload_params = {
                    "upsert": "true"
                }
                upload_headers_minimal = {
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
                
                response = httpx.post(
                    upload_url, 
                    files=files,
                    params=upload_params,
                    headers=upload_headers_minimal, 
                    timeout=30.0
                )
                response.raise_for_status()
                logger.info(f"Upload successful with multipart: {response.status_code}")
                
                # FORCE update the Content-Type metadata via Supabase's object update API
                # This is a workaround for Supabase Storage ignoring multipart Content-Type
                update_url = f"{SUPABASE_URL}/storage/v1/object/game-bundles/{storage_path}"
                update_payload = {
                    "contentType": content_type,
                    "cacheControl": "no-cache, no-store, must-revalidate"
                }
                update_headers = {
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                }
                
                update_response = httpx.put(
                    update_url,
                    json=update_payload,
                    headers=update_headers,
                    timeout=30.0
                )
                if update_response.status_code == 200:
                    logger.info(f"✅ Metadata updated: {storage_path} -> {content_type}")
                else:
                    logger.warning(f"⚠️ Metadata update failed ({update_response.status_code}): {update_response.text}")
        
        # Get public URL for index.html
        bundle_url = supabase.storage.from_("game-bundles").get_public_url(f"{storage_base}/index.html")
        logger.info(f"Bundle URL: {bundle_url}")
        
        return bundle_url
        
    finally:
        # Cleanup
        if temp_dir and Path(temp_dir).exists():
            shutil.rmtree(temp_dir, ignore_errors=True)
            logger.info("Cleaned up temp directory")


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "kyx-build-service",
        "version": "1.0.0"
    })


@app.route("/build", methods=["POST"])
def process_build():
    """Process a build request."""
    try:
        data = request.json
        
        # Verify secret
        secret = request.headers.get("X-Build-Secret")
        if not verify_secret(secret):
            logger.warning("Unauthorized build request")
            return jsonify({"error": "Unauthorized"}), 401
        
        # Extract data
        build_id = data.get("buildId")
        game_id = data.get("gameId")
        config = data.get("config")
        generated_code = data.get("generatedCode")
        
        if not all([build_id, game_id, config]):
            return jsonify({"error": "Missing required fields"}), 400
        
        logger.info(f"Processing build request: build_id={build_id}, game_id={game_id}")
        
        # Update status to processing
        update_build_status(build_id, "processing")
        update_game_status(game_id, "building")
        
        # Build the game
        bundle_url = build_game(build_id, game_id, config, generated_code)
        
        # Update status to completed
        update_build_status(build_id, "completed")
        update_game_status(game_id, "published", bundle_url)
        
        return jsonify({
            "success": True,
            "bundleUrl": bundle_url,
            "message": "Build completed successfully"
        })
        
    except Exception as e:
        logger.error(f"Build failed: {e}", exc_info=True)
        
        # Update status to failed
        if "build_id" in locals():
            update_build_status(build_id, "failed", str(e))
        if "game_id" in locals():
            update_game_status(game_id, "failed")
        
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    # Check environment variables
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        sys.exit(1)
    
    port = int(os.getenv("PORT", 8080))
    logger.info(f"Starting KYX Build Service on port {port}")
    app.run(host="0.0.0.0", port=port)

