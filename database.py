import sqlite3
import hashlib

DB_FILE = "user_interview.db"

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    conn=sqlite3.connect(DB_FILE)
    cursor=conn.cursor()
    

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user(
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions(
        username TEXT,
        interviewer_id TEXT,
        profile_memory TEXT DEFAULT '',
        conversation_summary TEXT DEFAULT '',
        PRIMARY KEY (username, interviewer_id),
        FOREIGN KEY (username) REFERENCES user (username)
    )
    """)


    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        interviewer_id TEXT,
        role TEXT,
        content TEXT,
        FOREIGN KEY (username, interviewer_id) REFERENCES sessions (username, interviewer_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resumes(
        username TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        resume_text TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES user (username)
    )
    """)
    conn.commit()
    conn.close()

def register_user(username, password):
    conn=sqlite3.connect(DB_FILE)
    cursor=conn.cursor()
    try:
        hashed=hash_password(password)
        cursor.execute("INSERT INTO user (username, password_hash) VALUES (?, ?)", (username, hashed))
        conn.commit()
        success=True
    except sqlite3.IntegrityError:
        success=False
    finally:
        conn.close()
    return success

def verify_user(username, password):
    conn=sqlite3.connect(DB_FILE)
    cursor=conn.cursor()
    hashed=hash_password(password)
    cursor.execute("SELECT 1 FROM user WHERE username = ? AND password_hash = ?", (username, hashed))
    user_exists=cursor.fetchone() is not None
    conn.close()
    return user_exists



def save_resume(username, file_path, resume_text):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO resumes (username, file_path, resume_text, uploaded_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(username) DO UPDATE SET
            file_path = excluded.file_path,
            resume_text = excluded.resume_text,
            uploaded_at = excluded.uploaded_at
    """, (username, file_path, resume_text))
    conn.commit()
    conn.close()

def get_resume(username):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT resume_text FROM resumes WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def ensure_session(username, interviewer_id):
    conn=sqlite3.connect(DB_FILE)
    cursor=conn.cursor()
    cursor.execute("""
        INSERT OR IGNORE INTO sessions (username, interviewer_id) 
        VALUES (?, ?)
    """, (username, interviewer_id))
    conn.commit()
    conn.close()

def save_message(username, interviewer_id, role, content):
    conn=sqlite3.connect(DB_FILE)
    cursor=conn.cursor()
    cursor.execute("""
        INSERT INTO messages (username, interviewer_id, role, content) 
        VALUES (?, ?, ?, ?)
    """, (username, interviewer_id, role, content))
    conn.commit()
    conn.close()

def full_history(username, interviewer_id):
    conn=sqlite3.connect(DB_FILE)
    cursor=conn.cursor()
    cursor.execute("""
        SELECT role, content FROM messages 
        WHERE username = ? AND interviewer_id = ? 
        ORDER BY id ASC
    """, (username, interviewer_id))
    history = cursor.fetchall()
    conn.close()
    return history

def recent_ai_context(username, interviewer_id, limit=12):
    conn=sqlite3.connect(DB_FILE)
    cursor=conn.cursor()
    cursor.execute("""
        SELECT role, content FROM (
            SELECT id, role, content FROM messages 
            WHERE username = ? AND interviewer_id = ? 
            ORDER BY id DESC LIMIT ?
        ) ORDER BY id ASC
    """, (username, interviewer_id, limit))
    history=cursor.fetchall()
    conn.close()
    return history

def memory_context(username, interviewer_id):
    conn=sqlite3.connect(DB_FILE)
    cursor=conn.cursor()
    cursor.execute("""
        SELECT profile_memory, conversation_summary 
        FROM sessions 
        WHERE username = ? AND interviewer_id = ?
    """, (username, interviewer_id))
    row = cursor.fetchone()
    conn.close()
    return row if row else ("", "")

def update_memory(username, interviewer_id, summary, profile):
    conn=sqlite3.connect(DB_FILE)
    cursor=conn.cursor()
    cursor.execute("""
        UPDATE sessions 
        SET conversation_summary = ?, profile_memory = ? 
        WHERE username = ? AND interviewer_id = ?
    """, (summary, profile, username, interviewer_id))
    conn.commit()
    conn.close()

init_db()