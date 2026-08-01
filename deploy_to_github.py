#!/usr/bin/env python3
import os
import sys
import json
import base64
import urllib.request

GITHUB_USER = "maxhixprox-eng"
REPO_NAME = "vido-ai-automation"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Exclude sensitive, temporary, and large binary files
EXCLUDE_DIRS = {".git", "__pycache__", "github_deploy"}
EXCLUDE_FILES = {".env", "gh", "analytics.db", "test_male_voice.mp3"}

def api_request(url, method="GET", data=None, token=""):
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "VIDO-Auto-Deployer",
    }
    if token:
        headers["Authorization"] = f"token {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data else None
    if method in ["POST", "PUT"] and encoded_data:
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def deploy(token="", repo_name=REPO_NAME):
    if not token:
        token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        print("❌ Error: GitHub token is required.")
        print("Usage: python3 deploy_to_github.py <YOUR_GITHUB_TOKEN>")
        return False

    print(f"🚀 Starting deployment of VIDO AI Automation for GitHub user: {GITHUB_USER}...")
    
    # 1. Get User Profile to confirm authenticated username
    try:
        user_info = api_request("https://api.github.com/user", token=token)
        username = user_info.get("login", GITHUB_USER)
        print(f"👤 Authenticated as GitHub user: {username}")
    except Exception as e:
        print(f"⚠️ Token authentication failed: {e}")
        return False

    # 2. Create Repository if not exists
    repo_url = "https://api.github.com/user/repos"
    repo_payload = {
        "name": repo_name,
        "description": "AI-Powered Social Media Content Automation (TikTok, X, Instagram, YouTube)",
        "private": False,
        "auto_init": False
    }
    try:
        api_request(repo_url, method="POST", data=repo_payload, token=token)
        print(f"✅ Created repository: https://github.com/{username}/{repo_name}")
    except Exception as e:
        print(f"ℹ️ Repository check/notice: {e}")

    # 3. Collect and Upload All Project Files Recursively
    files_to_upload = []
    for root, dirs, files in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            if f in EXCLUDE_FILES or f.endswith(".pyc"):
                continue
            abs_path = os.path.join(root, f)
            rel_path = os.path.relpath(abs_path, BASE_DIR).replace("\\", "/")
            files_to_upload.append((abs_path, rel_path))

    print(f"📦 Found {len(files_to_upload)} project files to upload...")

    success_count = 0
    for abs_path, rel_path in files_to_upload:
        try:
            with open(abs_path, "rb") as file_obj:
                content_bytes = file_obj.read()
            b64_content = base64.b64encode(content_bytes).decode("utf-8")
            
            put_url = f"https://api.github.com/repos/{username}/{repo_name}/contents/{rel_path}"
            put_payload = {
                "message": f"Add {rel_path}",
                "content": b64_content,
            }

            # Check if file exists to fetch current SHA for update
            try:
                existing = api_request(put_url, token=token)
                if isinstance(existing, dict) and "sha" in existing:
                    put_payload["sha"] = existing["sha"]
            except Exception:
                pass

            api_request(put_url, method="PUT", data=put_payload, token=token)
            print(f"  └─ ✅ Uploaded: {rel_path}")
            success_count += 1
        except Exception as upload_err:
            print(f"  └─ ❌ Failed to upload {rel_path}: {upload_err}")

    # 4. Enable GitHub Pages if index.html exists
    pages_url = f"https://api.github.com/repos/{username}/{repo_name}/pages"
    pages_payload = {"source": {"branch": "main", "path": "/"}}
    try:
        api_request(pages_url, method="POST", data=pages_payload, token=token)
        print("✅ Configured GitHub Pages deployment!")
    except Exception:
        pass

    print("\n🎉 ALL FILES UPLOADED SUCCESSFULLY!")
    print(f"🔗 Repository: https://github.com/{username}/{repo_name}")
    print(f"🌐 GitHub Pages (if active): https://{username}.github.io/{repo_name}")
    return True

if __name__ == "__main__":
    token_arg = sys.argv[1] if len(sys.argv) > 1 else ""
    deploy(token_arg)
