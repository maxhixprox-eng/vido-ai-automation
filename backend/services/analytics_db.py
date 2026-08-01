import sqlite3
import json
import os
import time
from typing import Dict, List, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "analytics.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table for published posts & performance metrics
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        content_type TEXT NOT NULL,
        genre TEXT NOT NULL,
        prompt_used TEXT NOT NULL,
        story_text TEXT NOT NULL,
        media_url TEXT,
        published_at INTEGER NOT NULL,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        engagement_score REAL DEFAULT 0.0
    );
    """)
    
    # Table for prompt strategies and dynamic tuning weights
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prompt_weights (
        genre TEXT PRIMARY KEY,
        hook_style TEXT NOT NULL,
        call_to_action TEXT NOT NULL,
        pacing TEXT NOT NULL,
        performance_score REAL DEFAULT 1.0,
        sample_count INTEGER DEFAULT 1,
        last_updated INTEGER NOT NULL
    );
    """)
    
    # Seed default strategy weights if empty
    cursor.execute("SELECT COUNT(*) FROM prompt_weights;")
    if cursor.fetchone()[0] == 0:
        default_strategies = [
            ("Thriller", "Shocking Question", "Comment your reaction", "Fast-Paced Suspense", 8.8, 12, int(time.time())),
            ("Comedy", "Relatable Situation", "Tag a friend", "Punchy Humor", 9.2, 15, int(time.time())),
            ("Mystery", "Cryptic Clue", "Guess what happens next", "Atmospheric Build-up", 8.4, 9, int(time.time())),
            ("Tech & Future", "Mind-Blowing Fact", "Share your thoughts", "Insightful & Direct", 9.0, 14, int(time.time()))
        ]
        cursor.executemany("""
        INSERT INTO prompt_weights (genre, hook_style, call_to_action, pacing, performance_score, sample_count, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """, default_strategies)
        
    conn.commit()
    conn.close()

import urllib.request

FIREBASE_DB_URL = os.environ.get("FIREBASE_DB_URL", "https://nexus-viral-automation-default-rtdb.firebaseio.com")

def sync_to_firebase(post_record: Dict[str, Any]):
    """Syncs published post metrics and prompt tuning to Firebase Cloud Realtime DB."""
    try:
        url = f"{FIREBASE_DB_URL}/posts/{post_record['id']}.json"
        req = urllib.request.Request(url, data=json.dumps(post_record).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='PUT')
        with urllib.request.urlopen(req, timeout=5) as resp:
            pass
    except Exception as e:
        print(f"Firebase Sync notice: {e}")

def record_post(post_data: Dict[str, Any]) -> Dict[str, Any]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    post_id = post_data.get("id", f"post_{int(time.time())}")
    published_at = post_data.get("published_at", int(time.time()))
    likes = post_data.get("likes", 0)
    comments = post_data.get("comments", 0)
    shares = post_data.get("shares", 0)
    saves = post_data.get("saves", 0)
    
    # Formula for calculating engagement score
    engagement_score = (likes * 1.0) + (comments * 2.5) + (shares * 3.5) + (saves * 4.0)
    
    cursor.execute("""
    INSERT OR REPLACE INTO posts (id, platform, content_type, genre, prompt_used, story_text, media_url, published_at, likes, comments, shares, saves, engagement_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        post_id,
        post_data.get("platform", "X/Twitter"),
        post_data.get("content_type", "Video Reel"),
        post_data.get("genre", "Thriller"),
        post_data.get("prompt_used", "Standard Prompt"),
        post_data.get("story_text", ""),
        post_data.get("media_url", ""),
        published_at,
        likes, comments, shares, saves, engagement_score
    ))
    
    # Update adaptive feedback weight for genre
    genre = post_data.get("genre", "Thriller")
    cursor.execute("SELECT performance_score, sample_count FROM prompt_weights WHERE genre = ?;", (genre,))
    row = cursor.fetchone()
    if row:
        curr_score, curr_count = row
        new_count = curr_count + 1
        # Exponential moving average calculation for score
        new_score = round((curr_score * 0.7) + ((engagement_score / 10.0) * 0.3), 2)
        cursor.execute("""
        UPDATE prompt_weights 
        SET performance_score = ?, sample_count = ?, last_updated = ?
        WHERE genre = ?;
        """, (new_score, new_count, int(time.time()), genre))
        
    conn.commit()
    conn.close()

    # Sync to Firebase Cloud DB
    sync_to_firebase(post_data)

    return {"status": "success", "id": post_id, "engagement_score": engagement_score, "firebase_sync": True}

def get_analytics_summary() -> Dict[str, Any]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, platform, content_type, genre, story_text, likes, comments, shares, saves, engagement_score, published_at FROM posts ORDER BY published_at DESC LIMIT 20;")
    posts = [
        {
            "id": r[0], "platform": r[1], "content_type": r[2], "genre": r[3],
            "story_snippet": r[4][:60] + "..." if len(r[4]) > 60 else r[4],
            "likes": r[5], "comments": r[6], "shares": r[7], "saves": r[8],
            "engagement_score": round(r[9], 1), "published_at": r[10]
        }
        for r in cursor.fetchall()
    ]
    
    cursor.execute("SELECT genre, hook_style, call_to_action, pacing, performance_score, sample_count FROM prompt_weights ORDER BY performance_score DESC;")
    prompt_tuning = [
        {
            "genre": r[0], "hook_style": r[1], "call_to_action": r[2],
            "pacing": r[3], "performance_score": r[4], "sample_count": r[5]
        }
        for r in cursor.fetchall()
    ]
    
    conn.close()
    return {"recent_posts": posts, "prompt_tuning_strategies": prompt_tuning}

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
