#!/usr/bin/env python3
import os
import sys
import time
import subprocess
import urllib.request
import json

BASE_DIR = os.path.dirname(__file__)

def check_server():
    try:
        req = urllib.request.Request('http://localhost:8000/api/trends', headers={'User-Agent': 'VIDO-Check'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except Exception:
        return False

def start_server_if_needed():
    if not check_server():
        print("🚀 Starting VIDO Backend Server on port 8000...")
        subprocess.Popen([sys.executable, os.path.join(BASE_DIR, "backend", "server.py")])
        time.sleep(2)

def start_tunnel():
    print("🌐 Initiating 24/7 Public HTTPS Online Hosting Tunnel...")
    cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=15", "-R", "80:localhost:8000", "serveo.net"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
    
    url = ""
    start_time = time.time()
    while time.time() - start_time < 12:
        line = proc.stdout.readline()
        if not line:
            break
        print(line.strip())
        if "Forwarding HTTP traffic from" in line:
            url = line.split("from")[-1].strip()
            print("\n=======================================================")
            print(f"🎉 VIDO IS LIVE ONLINE 24/7 AT: {url}")
            print(f"🔒 Privacy Policy: {url}/privacy.html")
            print(f"📜 Terms of Service: {url}/terms.html")
            print("=======================================================\n")
            break
    return proc, url

if __name__ == "__main__":
    start_server_if_needed()
    proc, url = start_tunnel()
    if proc:
        proc.wait()
