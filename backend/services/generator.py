import json
import urllib.request
import os
from typing import Dict, Any

def generate_story_with_gemini(topic: str, genre: str, api_key: str = "") -> Dict[str, Any]:
    """Generates engaging social story script using Gemini REST API or intelligent fallback engine."""
    
    # Custom prompt engineered system instruction for high viral conversion & multi-scene image sequence
    prompt_template = f"""You are a master story teller and viral content creator for TikTok/Reels/Shorts.
Create a short viral script based on topic: '{topic}' with genre: '{genre}'.

Format output strictly as JSON with keys:
- "title": Catchy title
- "hook": Attention-grabbing first line (0-3s)
- "story_text": Engaging story body (60-90 words max)
- "call_to_action": Final engaging question/CTA
- "hashtags": Array of 5 trending hashtags
- "visual_prompt": Detailed image generation prompt for main artwork
- "scene_prompts": Array of exactly 4 sequential image prompts matching story chronological beats (Scene 1: Introduction, Scene 2: Incident, Scene 3: Suspense Climax, Scene 4: Ending Resolution).
"""

    clean_key = api_key.strip() if api_key else ""
    # Check if key is provided or set in environment
    if not clean_key:
        clean_key = os.environ.get("OPENROUTER_API_KEY", os.environ.get("GEMINI_API_KEY", "")).strip()

    if clean_key:
        # 1. OpenRouter API Engine (sk-or-...)
        if clean_key.startswith("sk-or-"):
            models_to_try = ["google/gemini-2.5-flash", "openrouter/free"]
            for model_name in models_to_try:
                try:
                    url = "https://openrouter.ai/api/v1/chat/completions"
                    payload = {
                        "model": model_name,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a master storyteller and viral content creator for TikTok/Reels/Shorts. You MUST output strictly valid JSON with keys: title, hook, story_text, call_to_action, hashtags, visual_prompt."
                            },
                            {"role": "user", "content": prompt_template}
                        ],
                        "temperature": 0.8
                    }
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {clean_key}",
                        "HTTP-Referer": "http://localhost:8000",
                        "X-Title": "Nexus AI Social Media Automation"
                    }
                    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        res_data = json.loads(resp.read().decode('utf-8'))
                        raw_content = res_data['choices'][0]['message']['content'].strip()
                        if raw_content.startswith("```"):
                            lines = raw_content.splitlines()
                            if lines[0].startswith("```"):
                                lines = lines[1:]
                            if lines and lines[-1].startswith("```"):
                                lines = lines[:-1]
                            raw_content = "\n".join(lines).strip()
                        story_json = json.loads(raw_content)
                        story_json["engine"] = f"OpenRouter AI ({model_name})"
                        return story_json
                except Exception as e:
                    print(f"OpenRouter API call ({model_name}) exception: {e}")

        # 2. Direct Google Gemini REST API (AIza...)
        else:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={clean_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt_template}]}],
                    "generationConfig": {
                        "response_mime_type": "application/json",
                        "temperature": 0.8
                    }
                }
                headers = {"Content-Type": "application/json"}
                req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
                with urllib.request.urlopen(req, timeout=15) as resp:
                    res_data = json.loads(resp.read().decode('utf-8'))
                    candidate_text = res_data['candidates'][0]['content']['parts'][0]['text']
                    story_json = json.loads(candidate_text)
                    story_json["engine"] = "Google Gemini 1.5 Flash API"
                    return story_json
            except Exception as e:
                print(f"Gemini API call exception: {e}")

    # High-quality fallback templates tuned for high engagement with sequential multi-scene AI prompts
    genre_clean = genre.capitalize()
    if "1960s" in genre or "Cartoon" in genre or "Vintage" in genre:
        return {
            "title": f"The 1960s Mystery: {topic}",
            "hook": f"Whatever you do, don't ignore what happened in 1960s {topic}...",
            "story_text": f"It was 3:17 AM in 1965 when an eerie quiet settled over the neighborhood. A shadowy figure approached the vintage streetlight leaving no footprints. Witnesses swore they saw glowing eyes watching from the vintage car parked across the street.",
            "call_to_action": "Would you look out the window? Comment below!",
            "hashtags": ["#1960s", "#animation", "#educational", "#historytok", "#scary", "#horrorstory", "#didyouknow"],
            "visual_prompt": f"1960s vintage cartoon style, dark atmospheric neighborhood street, eerie, 9:16 vertical ratio, {topic}",
            "scene_prompts": [
                f"1960s vintage dark cartoon, Scene 1 Intro: quiet suburban neighborhood street at 3 AM under flickering lamppost, eerie atmosphere, 9:16 vertical ratio",
                f"1960s vintage dark cartoon, Scene 2 Incident: shadowy creepy figure approaching vintage 1960s house leaving no footprints, 9:16 vertical ratio",
                f"1960s vintage dark cartoon, Scene 3 Climax: close-up of sinister glowing eyes watching from inside a dark vintage 1960s car, 9:16 vertical ratio",
                f"1960s vintage dark cartoon, Scene 4 Ending: vintage window curtains pulling back revealing ominous silhouette outside, 9:16 vertical ratio"
            ],
            "engine": "AI Story Generator (1960s Vintage Cartoon Template)"
        }
    elif "Thriller" in genre_clean:
        return {
            "title": f"The Shadow Behind {topic}",
            "hook": f"Whatever you do, don't ignore what just happened with {topic}...",
            "story_text": f"It was 3:17 AM when the quiet hum of {topic} suddenly changed. Sensors registered a signal coming from somewhere that didn't exist on any map. Researchers logged into the central network only to realize the server logs were writing themselves in real time—warning them not to look out the window.",
            "call_to_action": "Would you open the door if you heard the signal? Comment below!",
            "hashtags": ["#ThrillerStory", "#CreepyTales", "#Unexplained", "#ViralReels", "#ShortStories"],
            "visual_prompt": f"Cinematic dark thriller scene, atmospheric foggy night, glowing neon surveillance interface reflecting off rain-slicked glass, hyper-detailed, 8k resolution, cinematic lighting",
            "scene_prompts": [
                f"Cinematic dark thriller scene, quiet foggy neighborhood street at midnight, ominous atmospheric lighting, 9:16 vertical",
                f"Cinematic dark thriller scene, glowing neon computer interface in dark room showing warning alert, 9:16 vertical",
                f"Cinematic dark thriller scene, mysterious shadowy silhouette standing outside in dense fog, dramatic 9:16 vertical"
            ],
            "engine": "AI Story Generator (Thriller Template)"
        }
    elif "Comedy" in genre_clean:
        return {
            "title": f"When {topic} Goes Wrong",
            "hook": f"I tried using {topic} for 24 hours and my cat now controls my bank account.",
            "story_text": f"So there I was, thinking I had fully mastered {topic}. I set everything to automatic mode, grabbed a coffee, and sat back. Five minutes later, my smart fridge ordered 40 pounds of organic cat nip and sent a formal email resignation to my boss.",
            "call_to_action": "Tag a friend who would accidentally cause this chaos!",
            "hashtags": ["#ComedyReels", "#RelatableHumor", "#TechFails", "#FunnyShorts", "#DailyMeme"],
            "visual_prompt": f"Vibrant comedy scene, expressive cat sitting at a futuristic high-tech desk wearing oversized glasses, colorful synthwave backdrop, funny concept art, 4k",
            "scene_prompts": [
                f"Vibrant comedy animation, fluffy cat sitting at high-tech computer wearing oversized glasses, 9:16 vertical",
                f"Vibrant comedy animation, smart fridge dispensing endless cat food onto kitchen floor, funny, 9:16 vertical",
                f"Vibrant comedy animation, shocked person spilling coffee looking at computer screen, 9:16 vertical"
            ],
            "engine": "AI Story Generator (Comedy Template)"
        }
    else:
        return {
            "title": f"The Enigma of {topic}",
            "hook": f"An unsealed envelope containing a note about {topic} was delivered to 100 random people today...",
            "story_text": f"Each envelope contained a single coordinate and a date exactly 24 hours into the future. When investigators arrived at the location, they found an ancient vault door sealed with modern digital keypads that had no record of manufacturer.",
            "call_to_action": "What do you think is inside the vault?",
            "hashtags": ["#MysteryUnsolved", "#ConspiracyTheory", "#MindBlowing", "#DeepSpace", "#MysteryReels"],
            "visual_prompt": f"Atmospheric mystery artwork, subterranean vault illuminated by amber light beams, cryptic ancient runes glowing on dark stone, cinematic depth of field",
            "scene_prompts": [
                f"Atmospheric mystery artwork, unsealed wax-sealed envelope on dark wooden table under candlelight, 9:16 vertical",
                f"Atmospheric mystery artwork, investigators holding glowing flashlight in dark underground vault, 9:16 vertical",
                f"Atmospheric mystery artwork, ancient vault door with glowing neon digital keypads, 9:16 vertical"
            ],
            "engine": "AI Story Generator (Mystery Template)"
        }

def generate_platform_copywriting(story_data: Dict[str, Any], genre: str = "1960s Vintage Dark Cartoon") -> Dict[str, Any]:
    """Generates platform-tailored copywriting copy for TikTok, X (Twitter), YouTube Shorts, and Instagram Reels."""
    title = story_data.get("title", "Viral Short Story")
    hook = story_data.get("hook", "Whatever you do, don't ignore what just happened...")
    story_text = story_data.get("story_text", "")
    
    # 1. TikTok & Instagram Reels Copy
    tiktok_copy = {
        "hook_3s": f"🚨 {hook}",
        "caption": f"The Clown Gang - 1960s 💀\n{title}\n\n{story_text[:120]}...",
        "hashtags": ["#animation", "#educational", "#historytok", "#scary", "#horrorstory", "#1960s", "#facts", "#didyouknow"]
    }
    
    # 2. X (Twitter) Copy
    twitter_copy = {
        "tweet_text": f"💀 {title}\n\n{hook}\n\nWhat would you do if you saw this? 🧵⬇️",
        "hashtags": ["#1960s", "#HorrorStory", "#ViralReel"]
    }
    
    # 3. YouTube Shorts Copy
    youtube_copy = {
        "title": f"{title} (1960s True Story) 💀 #Shorts",
        "description": f"{hook}\n\n{story_text}\n\nSubscribe for more 1960s vintage dark animated mystery stories!",
        "keywords": "1960s, vintage cartoon, horror story, scary facts, shorts, viral"
    }

    return {
        "status": "success",
        "tiktok": tiktok_copy,
        "twitter": twitter_copy,
        "youtube": youtube_copy,
        "instagram": tiktok_copy
    }

if __name__ == "__main__":
    print(generate_story_with_gemini("Autonomous AI", "Thriller"))
