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
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_chat_id INTEGER UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
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
        glicko_home_min REAL, glicko_home_max REAL,
        glicko_away_min REAL, glicko_away_max REAL,
        glicko_draw_min REAL, glicko_draw_max REAL,
        expected_outcome TEXT,
        rules TEXT,
        rule_logic TEXT,
        track_odds BOOLEAN DEFAULT 0,
        odds_target TEXT,
        odds_change_threshold REAL DEFAULT 0.0,
        odds_change_type TEXT DEFAULT 'absolute',
        odds_direction TEXT DEFAULT 'down',
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
        expected_outcome TEXT,
        actual_outcome TEXT,
        is_success BOOLEAN DEFAULT 0,
        conditions TEXT,
        UNIQUE(match_id, filter_id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS odds_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        p1 REAL,
        p2 REAL,
        draw REAL,
        total_over_2_5 REAL
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS odds_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filter_id INTEGER,
        match_id INTEGER,
        initial_value REAL,
        current_value REAL,
        triggered BOOLEAN DEFAULT 0,
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (filter_id) REFERENCES filters(id),
        UNIQUE(filter_id, match_id)
    )''')
    conn.commit()
    migrate_db(conn)
    conn.close()

def migrate_db(conn=None):
    close_conn = False
    if conn is None:
        conn = get_db()
        close_conn = True
    c = conn.cursor()
    # Filters
    c.execute("PRAGMA table_info(filters)")
    cols = [row[1] for row in c.fetchall()]
    new_cols = [
        ('glicko_home_min', 'REAL DEFAULT 0'),
        ('glicko_home_max', 'REAL DEFAULT 100'),
        ('glicko_away_min', 'REAL DEFAULT 0'),
        ('glicko_away_max', 'REAL DEFAULT 100'),
        ('glicko_draw_min', 'REAL DEFAULT 0'),
        ('glicko_draw_max', 'REAL DEFAULT 100'),
        ('expected_outcome', 'TEXT DEFAULT ""'),
        ('rules', 'TEXT DEFAULT "[]"'),
        ('rule_logic', 'TEXT DEFAULT "AND"'),
        ('track_odds', 'BOOLEAN DEFAULT 0'),
        ('odds_target', 'TEXT DEFAULT ""'),
        ('odds_change_threshold', 'REAL DEFAULT 0.0'),
        ('odds_change_type', 'TEXT DEFAULT "absolute"'),
        ('odds_direction', 'TEXT DEFAULT "down"')
    ]
    for col, type_def in new_cols:
        if col not in cols:
            c.execute(f"ALTER TABLE filters ADD COLUMN {col} {type_def}")
    # Triggered
    c.execute("PRAGMA table_info(triggered_matches)")
    cols = [row[1] for row in c.fetchall()]
    new_cols_trig = [
        ('expected_outcome', 'TEXT DEFAULT ""'),
        ('actual_outcome', 'TEXT DEFAULT ""'),
        ('is_success', 'BOOLEAN DEFAULT 0'),
        ('conditions', 'TEXT DEFAULT "[]"')
    ]
    for col, type_def in new_cols_trig:
        if col not in cols:
            c.execute(f"ALTER TABLE triggered_matches ADD COLUMN {col} {type_def}")
    conn.commit()
    if close_conn:
        conn.close()

# --- Пользователи ---
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

# --- Фильтры ---
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

def get_filter(filter_id: int) -> Optional[dict]:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM filters WHERE id=?", (filter_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_filters(user_id: int) -> List[dict]:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM filters WHERE user_id=?", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_active_filters(user_id: int) -> List[dict]:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM filters WHERE user_id=? AND is_active=1", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_filter(filter_id: int, data: dict):
    conn = get_db()
    c = conn.cursor()
    set_clause = ", ".join([f"{key}=?" for key in data.keys()])
    values = list(data.values()) + [filter_id]
    c.execute(f"UPDATE filters SET {set_clause} WHERE id=?", values)
    conn.commit()
    conn.close()

def delete_filter(filter_id: int):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM filters WHERE id=?", (filter_id,))
    conn.commit()
    conn.close()

def get_all_untracked_filters_with_odds() -> List[dict]:
    """Возвращает все активные фильтры с включённым отслеживанием коэффициентов."""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM filters WHERE is_active=1 AND track_odds=1")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# --- Чёрный список ---
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

# --- История срабатываний ---
def add_triggered_match(match_id: int, filter_id: int, match_data: dict, expected_outcome: str, conditions: list):
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        INSERT OR IGNORE INTO triggered_matches 
        (match_id, filter_id, match_data, expected_outcome, conditions) 
        VALUES (?,?,?,?,?)
    """, (match_id, filter_id, json.dumps(match_data, ensure_ascii=False), expected_outcome, json.dumps(conditions)))
    conn.commit()
    conn.close()

def is_match_triggered(match_id: int, filter_id: int) -> bool:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT 1 FROM triggered_matches WHERE match_id=? AND filter_id=?", (match_id, filter_id))
    exists = c.fetchone() is not None
    conn.close()
    return exists

def get_pending_triggered_matches() -> List[dict]:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM triggered_matches WHERE actual_outcome IS NULL OR actual_outcome = ''")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_match_outcome(match_id: int, filter_id: int, actual_outcome: str, is_success: bool):
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        UPDATE triggered_matches 
        SET actual_outcome=?, is_success=? 
        WHERE match_id=? AND filter_id=?
    """, (actual_outcome, 1 if is_success else 0, match_id, filter_id))
    conn.commit()
    conn.close()

def get_filter_stats(filter_id: int) -> dict:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as total FROM triggered_matches WHERE filter_id=?", (filter_id,))
    total = c.fetchone()[0]
    c.execute("SELECT COUNT(*) as success FROM triggered_matches WHERE filter_id=? AND is_success=1", (filter_id,))
    success = c.fetchone()[0]
    c.execute("SELECT actual_outcome, COUNT(*) as count FROM triggered_matches WHERE filter_id=? GROUP BY actual_outcome", (filter_id,))
    outcomes = {row[0]: row[1] for row in c.fetchall()}
    conn.close()
    return {
        'total': total,
        'success': success,
        'rate': (success / total * 100) if total > 0 else 0,
        'outcomes': outcomes
    }

def get_recent_triggered_for_filter(filter_id: int, limit: int = 50) -> List[dict]:
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT match_id, triggered_at, actual_outcome, is_success, conditions 
        FROM triggered_matches 
        WHERE filter_id=? 
        ORDER BY triggered_at DESC 
        LIMIT ?
    """, (filter_id, limit))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# --- Отслеживание коэффициентов ---
def get_odds_tracking(filter_id: int, match_id: int) -> Optional[dict]:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM odds_tracking WHERE filter_id=? AND match_id=?", (filter_id, match_id))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def upsert_odds_tracking(filter_id: int, match_id: int, initial_value: float, current_value: float = None):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id FROM odds_tracking WHERE filter_id=? AND match_id=?", (filter_id, match_id))
    existing = c.fetchone()
    if existing:
        c.execute("""
            UPDATE odds_tracking 
            SET current_value=?, last_update=CURRENT_TIMESTAMP 
            WHERE filter_id=? AND match_id=?
        """, (current_value or initial_value, filter_id, match_id))
    else:
        c.execute("""
            INSERT INTO odds_tracking (filter_id, match_id, initial_value, current_value, triggered)
            VALUES (?, ?, ?, ?, 0)
        """, (filter_id, match_id, initial_value, current_value or initial_value))
    conn.commit()
    conn.close()

def mark_odds_tracking_triggered(filter_id: int, match_id: int):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE odds_tracking SET triggered=1 WHERE filter_id=? AND match_id=?", (filter_id, match_id))
    conn.commit()
    conn.close()