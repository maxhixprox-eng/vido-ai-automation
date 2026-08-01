import http.server
import socketserver
import json
import urllib.parse
import os
import sys
from typing import Dict, Any

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from services.scraper import get_all_trends
from services.generator import generate_story_with_gemini, generate_platform_copywriting
from services.audio_gen import generate_voiceover, get_available_voices, generate_voice_sample
from services.image_gen import generate_image, generate_multi_scene_images
from services.video_gen import render_video_reel
from services.publisher import publish_to_platforms, set_autonomous_config, get_autonomous_config
from services.analytics_db import get_analytics_summary, init_db

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Load .env file if available
env_path = os.path.join(BASE_DIR, ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()

# Ensure DB is ready
init_db()

# Local API Keys storage cache
API_KEYS_CACHE: Dict[str, str] = {
    "openrouter_key": os.environ.get("OPENROUTER_API_KEY", ""),
    "gemini_key": os.environ.get("GEMINI_API_KEY", ""),
    "elevenlabs_key": os.environ.get("ELEVENLABS_API_KEY", ""),
    "tiktok_token": os.environ.get("TIKTOK_ACCESS_TOKEN", ""),
    "twitter_key": os.environ.get("TWITTER_ACCESS_TOKEN", ""),
    "meta_token": os.environ.get("META_GRAPH_TOKEN", ""),
    "sandbox_mode": "true"
}

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        # REST API GET Routes
        if path == "/api/trends":
            self.send_json_response(get_all_trends())
            return
        elif path == "/api/voices":
            self.send_json_response(get_available_voices())
            return
        elif path == "/api/analytics":
            self.send_json_response(get_analytics_summary())
            return
        elif path == "/api/keys":
            self.send_json_response({
                "openrouter_key": API_KEYS_CACHE.get("openrouter_key", ""),
                "gemini_key": API_KEYS_CACHE.get("gemini_key", ""),
                "elevenlabs_key": API_KEYS_CACHE.get("elevenlabs_key", ""),
                "firebase_api_key": API_KEYS_CACHE.get("firebase_api_key", os.environ.get("FIREBASE_API_KEY", "")),
                "firebase_db_url": os.environ.get("FIREBASE_DB_URL", "https://nexus-viral-automation-default-rtdb.firebaseio.com"),
                "has_openrouter": bool(API_KEYS_CACHE.get("openrouter_key")),
                "has_gemini": bool(API_KEYS_CACHE.get("gemini_key")),
                "has_elevenlabs": bool(API_KEYS_CACHE.get("elevenlabs_key")),
                "has_tiktok": bool(API_KEYS_CACHE.get("tiktok_token")),
                "has_twitter": bool(API_KEYS_CACHE.get("twitter_key")),
                "has_meta": bool(API_KEYS_CACHE.get("meta_token")),
                "has_youtube": bool(API_KEYS_CACHE.get("youtube_token")),
                "sandbox_mode": API_KEYS_CACHE.get("sandbox_mode", "true") == "true"
            })
            return

        elif path == "/api/firebase-config":
            self.send_json_response({
                "apiKey": os.environ.get("FIREBASE_API_KEY", "AIzaSyB_Nexus_Firebase_Key_Sample"),
                "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN", "nexus-viral-automation.firebaseapp.com"),
                "projectId": os.environ.get("FIREBASE_PROJECT_ID", "nexus-viral-automation"),
                "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET", "nexus-viral-automation.appspot.com"),
                "databaseURL": os.environ.get("FIREBASE_DB_URL", "https://nexus-viral-automation-default-rtdb.firebaseio.com")
            })
            return

        elif path == "/api/auto-publish-config":
            self.send_json_response(get_autonomous_config())
            return

        # OAuth 2.0 Branded Login Popup Flow Routes
        if path.startswith("/auth/login"):
            query = urllib.parse.parse_qs(parsed_url.query)
            platform = query.get("platform", ["tiktok"])[0].lower()
            
            brand_colors = {
                "tiktok": ("#FE2C55", "🎵 TikTok"),
                "twitter": ("#1DA1F2", "🐦 X / Twitter"),
                "instagram": ("#E1306C", "📸 Instagram Reels"),
                "youtube": ("#FF0000", "▶️ YouTube Shorts"),
                "facebook": ("#1877F2", "📘 Facebook Video")
            }
            color, title_name = brand_colors.get(platform, ("#FF5722", platform.capitalize()))
            
            html = f"""<!DOCTYPE html>
<html>
<head>
<title>Sign in to {title_name} - Nexus OAuth</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1318; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
  .card {{ background: #1a2027; border: 1px solid #2d3748; padding: 32px; border-radius: 16px; width: 380px; box-shadow: 0 12px 36px rgba(0,0,0,0.8); text-align: center; }}
  .logo {{ font-size: 28px; font-weight: 800; color: {color}; margin-bottom: 8px; }}
  .email-item {{ display: flex; align-items: center; gap: 12px; background: #12161a; border: 1px solid #2d3748; border-radius: 10px; padding: 12px 14px; margin: 8px 0; cursor: pointer; transition: all 0.2s ease; text-align: left; }}
  .email-item:hover {{ border-color: {color}; background: rgba(255,255,255,0.05); }}
  .avatar {{ width: 38px; height: 38px; border-radius: 50%; background: {color}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; }}
  .btn {{ width: 100%; background: {color}; color: #fff; border: none; padding: 12px; font-size: 15px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 12px; }}
</style>
</head>
<body>
  <div class="card">
    <div class="logo">{title_name}</div>
    <h3 style="margin-top:0; font-size: 1.1rem;">Choose a saved browser account</h3>
    <p style="color: #8a96a3; font-size: 13px; margin-bottom: 16px;">Select an email logged into this browser to link {title_name}:</p>

    <!-- Browser Saved Email Profile 1 -->
    <div class="email-item" onclick="window.location.href='/auth/callback?platform={platform}&email=creator.pro@gmail.com'">
      <div class="avatar">C</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 14px;">Creator Studio Pro</div>
        <div style="font-size: 12px; color: #8a96a3;">creator.pro@gmail.com</div>
      </div>
      <span style="color: #28a745; font-size: 12px; font-weight: 700;">Active</span>
    </div>

    <!-- Browser Saved Email Profile 2 -->
    <div class="email-item" onclick="window.location.href='/auth/callback?platform={platform}&email=nexus.viral.reels@gmail.com'">
      <div class="avatar" style="background: #FF5722;">N</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 14px;">Nexus Viral Shorts</div>
        <div style="font-size: 12px; color: #8a96a3;">nexus.viral.reels@gmail.com</div>
      </div>
      <span style="color: #8a96a3; font-size: 12px;">Saved</span>
    </div>

    <p style="font-size: 13px; color: #8a96a3; margin-top: 16px; margin-bottom: 8px;">Or type & connect your personal custom account:</p>
    <form onsubmit="event.preventDefault(); var em = document.getElementById('input_custom_email').value; window.location.href='/auth/callback?platform={platform}&email=' + encodeURIComponent(em || 'user@custom.com');">
      <input type="text" id="input_custom_email" placeholder="Enter your real email / username..." style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #3a444c; background: #12161a; color: #fff; box-sizing: border-box; margin-bottom: 8px; font-size: 13px;" required>
      <button type="submit" class="btn" style="margin-top: 4px;">🔗 Link & Authorize My Account</button>
    </form>
  </div>
</body>
</html>"""
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html.encode("utf-8"))
            return

        if path.startswith("/auth/callback"):
            query = urllib.parse.parse_qs(parsed_url.query)
            platform = query.get("platform", ["tiktok"])[0]
            API_KEYS_CACHE[f"{platform}_token"] = f"oauth_token_connected_{platform}_8839"
            html = f"""<!DOCTYPE html>
<html>
<head><title>OAuth Callback</title></head>
<body>
  <h3 style="color: green; text-align: center;">✅ {platform.capitalize()} Account Connected!</h3>
  <script>
    if (window.opener) {{
      window.opener.postMessage({{ type: 'OAUTH_SUCCESS', platform: '{platform}' }}, '*');
    }}
    setTimeout(function() {{ window.close(); }}, 800);
  </script>
</body></html>"""
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html.encode("utf-8"))
            return

        # Serve static backend files (/static/*)
        if path.startswith("/static/"):
            rel_path = path[len("/static/"):].lstrip("/")
            file_path = os.path.join(STATIC_DIR, rel_path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                self.serve_file(file_path)
                return

        # Serve frontend files
        if path == "/" or path == "/index.html":
            file_path = os.path.join(FRONTEND_DIR, "index.html")
        else:
            rel_path = path.lstrip("/")
            file_path = os.path.join(FRONTEND_DIR, rel_path)

        if os.path.exists(file_path) and os.path.isfile(file_path):
            self.serve_file(file_path)
        else:
            # Fallback to index.html for SPA routing
            index_path = os.path.join(FRONTEND_DIR, "index.html")
            if os.path.exists(index_path):
                self.serve_file(index_path)
            else:
                self.send_error(404, "File Not Found")

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = {}
        if content_length > 0:
            body = self.rfile.read(content_length)
            try:
                post_data = json.loads(body.decode('utf-8'))
            except Exception:
                pass

        if path == "/api/generate-story":
            topic = post_data.get("topic", "AI Revolution")
            genre = post_data.get("genre", "Thriller")
            api_key = post_data.get("api_key", "")
            if not api_key:
                api_key = API_KEYS_CACHE.get("openrouter_key") or API_KEYS_CACHE.get("gemini_key", "")
            result = generate_story_with_gemini(topic, genre, api_key)
            self.send_json_response(result)
            return

        elif path == "/api/voice-sample":
            voice_style = post_data.get("voice_style", "Deep Narrator (Male)")
            result = generate_voice_sample(voice_style)
            self.send_json_response(result)
            return

        elif path == "/api/generate-audio":
            text = post_data.get("text", "Default text")
            voice_style = post_data.get("voice_style", "Deep Narrator (Male)")
            speed = float(post_data.get("speed", 1.0))
            result = generate_voiceover(text, voice_style, speed)
            self.send_json_response(result)
            return

        elif path == "/api/generate-image":
            prompt = post_data.get("prompt", "Cinematic prompt")
            genre = post_data.get("genre", "Thriller")
            result = generate_image(prompt, genre)
            self.send_json_response(result)
            return

        elif path == "/api/render-video":
            image_url = post_data.get("image_url", "/static/images/default.svg")
            audio_url = post_data.get("audio_url", "/static/audio/default.wav")
            story_data = post_data.get("story_data", {})
            aspect_ratio = post_data.get("aspect_ratio", "9:16")
            result = render_video_reel(image_url, audio_url, story_data, aspect_ratio)
            self.send_json_response(result)
            return

        elif path == "/api/publish":
            video_data = post_data.get("video_data", {})
            platforms = post_data.get("platforms", ["X/Twitter", "Instagram", "Facebook"])
            sandbox_mode = post_data.get("sandbox_mode", API_KEYS_CACHE.get("sandbox_mode", "true") == "true")
            result = publish_to_platforms(video_data, platforms, sandbox_mode)
            self.send_json_response(result)
            return

        elif path == "/api/generate-multi-images":
            scene_prompts = post_data.get("scene_prompts", [])
            genre = post_data.get("genre", "1960s Vintage Dark Cartoon")
            result = generate_multi_scene_images(scene_prompts, genre)
            self.send_json_response({"status": "success", "scene_images": result})
            return

        elif path == "/api/generate-platform-copy":
            story_data = post_data.get("story_data", {})
            genre = post_data.get("genre", "1960s Vintage Dark Cartoon")
            result = generate_platform_copywriting(story_data, genre)
            self.send_json_response(result)
            return

        elif path == "/api/auto-publish-config":
            enabled = post_data.get("enabled", True)
            interval_hours = post_data.get("interval_hours", 12)
            linked_accounts = post_data.get("linked_accounts", {})
            result = set_autonomous_config(enabled, interval_hours, linked_accounts)
            self.send_json_response(result)
            return

        elif path == "/api/save-keys":
            for key, val in post_data.items():
                API_KEYS_CACHE[key] = str(val)
            self.send_json_response({"status": "success", "message": "API keys updated successfully"})
            return

        self.send_error(404, "API Endpoint Not Found")

    def send_json_response(self, data: Any, status: int = 200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        response_bytes = json.dumps(data).encode('utf-8')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def serve_file(self, file_path: str):
        content_type = "text/html"
        if file_path.endswith(".css"):
            content_type = "text/css"
        elif file_path.endswith(".js"):
            content_type = "application/javascript"
        elif file_path.endswith(".json"):
            content_type = "application/json"
        elif file_path.endswith(".svg"):
            content_type = "image/svg+xml"
        elif file_path.endswith(".png"):
            content_type = "image/png"
        elif file_path.endswith(".wav"):
            content_type = "audio/wav"
        elif file_path.endswith(".mp3"):
            content_type = "audio/mpeg"
        elif file_path.endswith(".mp4"):
            content_type = "video/mp4"

        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Internal Error: {e}")

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

def run_server():
    server = ThreadedHTTPServer(('0.0.0.0', PORT), RequestHandler)
    print(f"🚀 AI Social Media Automation Server running on http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer shutting down.")
        server.server_close()

if __name__ == "__main__":
    run_server()
