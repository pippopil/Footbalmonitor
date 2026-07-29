import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from app.config import DATABASE_PATH

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    
    # Таблица пользователей
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_chat_id INTEGER UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Таблица фильтров (с новыми полями разницы)
    c.execute('''CREATE TABLE IF NOT EXISTS filters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        match_time_min INTEGER, match_time_max INTEGER,
        total_goals_min INTEGER, total_goals_max INTEGER,
        total_corners_min INTEGER, total_corners_max INTEGER,
        total_shots_min INTEGER, total_shots_max INTEGER,
        total_sot_min INTEGER, total_sot_max INTEGER,
        total_yellow_min INTEGER, total_yellow_max INTEGER,
        home_goals_min INTEGER, home_goals_max INTEGER,
        away_goals_min INTEGER, away_goals_max INTEGER,
        home_corners_min INTEGER, home_corners_max INTEGER,
        away_corners_min INTEGER, away_corners_max INTEGER,
        home_shots_min INTEGER, home_shots_max INTEGER,
        away_shots_min INTEGER, away_shots_max INTEGER,
        home_sot_min INTEGER, home_sot_max INTEGER,
        away_sot_min INTEGER, away_sot_max INTEGER,
        home_yellow_min INTEGER, home_yellow_max INTEGER,
        away_yellow_min INTEGER, away_yellow_max INTEGER,
        h2h_matches_count INTEGER,
        h2h_avg_goals_min REAL, h2h_avg_goals_max REAL,
        home_recent_count INTEGER,
        home_recent_goals_min REAL, home_recent_goals_max REAL,
        away_recent_count INTEGER,
        away_recent_goals_min REAL, away_recent_goals_max REAL,
        odds_p1_min REAL, odds_p1_max REAL,
        odds_p2_min REAL, odds_p2_max REAL,
        odds_draw_min REAL, odds_draw_max REAL,
        odds_total_over_2_5_min REAL, odds_total_over_2_5_max REAL,
        -- НОВЫЕ ПОЛЯ для разницы (home - away)
        diff_goals_min INTEGER, diff_goals_max INTEGER,
        diff_corners_min INTEGER, diff_corners_max INTEGER,
        diff_shots_min INTEGER, diff_shots_max INTEGER,
        diff_sot_min INTEGER, diff_sot_max INTEGER,
        diff_yellow_min INTEGER, diff_yellow_max INTEGER,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS blacklisted_leagues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        league_id INTEGER,
        league_name TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, league_id)
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS triggered_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        filter_id INTEGER,
        triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        match_data TEXT,
        UNIQUE(match_id, filter_id)
    )''')
    
    # --- Миграция: добавляем новые столбцы, если их нет ---
    c.execute("PRAGMA table_info(filters)")
    columns = [col[1] for col in c.fetchall()]
    
    diff_columns = [
        'diff_goals_min', 'diff_goals_max',
        'diff_corners_min', 'diff_corners_max',
        'diff_shots_min', 'diff_shots_max',
        'diff_sot_min', 'diff_sot_max',
        'diff_yellow_min', 'diff_yellow_max'
    ]
    
    for col in diff_columns:
        if col not in columns:
            c.execute(f"ALTER TABLE filters ADD COLUMN {col} INTEGER DEFAULT 0")
    
    conn.commit()
    conn.close()

# --- Остальные функции (без изменений) ---
def create_user(chat_id: int) -> int:
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO users (telegram_chat_id) VALUES (?)", (chat_id,))
    conn.commit()
    c.execute("SELECT id FROM users WHERE telegram_chat_id=?", (chat_id,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else None

def get_user_id(chat_id: int) -> Optional[int]:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE telegram_chat_id=?", (chat_id,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else None

def save_filter(user_id: int, data: dict) -> int:
    conn = get_db()
    c = conn.cursor()
    cols = ['user_id'] + list(data.keys())
    placeholders = ','.join(['?'] * len(cols))
    values = [user_id] + list(data.values())
    c.execute(f"INSERT INTO filters ({','.join(cols)}) VALUES ({placeholders})", values)
    conn.commit()
    filter_id = c.lastrowid
    conn.close()
    return filter_id

def get_active_filters(user_id: int) -> List[dict]:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM filters WHERE user_id=? AND is_active=1", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_all_filters(user_id: int) -> List[dict]:
    """Возвращает все фильтры пользователя (включая неактивные)."""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM filters WHERE user_id=? ORDER BY id DESC", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_filter_status(filter_id: int, active: bool):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE filters SET is_active=? WHERE id=?", (1 if active else 0, filter_id))
    conn.commit()
    conn.close()

def get_blacklisted_leagues(user_id: int) -> List[int]:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT league_id FROM blacklisted_leagues WHERE user_id=?", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [row[0] for row in rows]

def get_blacklisted_leagues_full(user_id: int) -> List[dict]:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT league_id, league_name FROM blacklisted_leagues WHERE user_id=?", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [{'id': row[0], 'name': row[1]} for row in rows]

def add_blacklisted_league(user_id: int, league_id: int, league_name: str):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO blacklisted_leagues (user_id, league_id, league_name) VALUES (?,?,?)",
              (user_id, league_id, league_name))
    conn.commit()
    conn.close()

def remove_blacklisted_league(user_id: int, league_id: int):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM blacklisted_leagues WHERE user_id=? AND league_id=?", (user_id, league_id))
    conn.commit()
    conn.close()

def is_match_triggered(match_id: int, filter_id: int) -> bool:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT 1 FROM triggered_matches WHERE match_id=? AND filter_id=?", (match_id, filter_id))
    exists = c.fetchone() is not None
    conn.close()
    return exists

def add_triggered_match(match_id: int, filter_id: int, match_data: dict):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO triggered_matches (match_id, filter_id, match_data) VALUES (?,?,?)",
              (match_id, filter_id, json.dumps(match_data, ensure_ascii=False)))
    conn.commit()
    conn.close()