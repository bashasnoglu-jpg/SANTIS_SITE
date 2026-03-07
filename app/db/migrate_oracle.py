"""
Phase 17: Direct SQLite migration for revenue_scores table.
Safe to run multiple times (CREATE TABLE IF NOT EXISTS).
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "santis.db")

DDL = """
CREATE TABLE IF NOT EXISTS revenue_scores (
    id                 TEXT PRIMARY KEY,
    session_id         TEXT NOT NULL,
    guest_name         TEXT,
    tenant_id          TEXT,
    composite_score    REAL NOT NULL,
    tier               TEXT NOT NULL,
    is_whale           INTEGER NOT NULL DEFAULT 0,
    intent_component   REAL DEFAULT 0.0,
    recency_component  REAL DEFAULT 0.0,
    aov_component      REAL DEFAULT 0.0,
    behavior_component REAL DEFAULT 0.0,
    service_interest   TEXT,
    behavioral_tags    TEXT,
    nudge_type         TEXT,
    nudge_message      TEXT,
    booked             INTEGER,
    booking_id         TEXT,
    scored_at          TEXT
);
"""
INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_rs_session ON revenue_scores(session_id);",
    "CREATE INDEX IF NOT EXISTS ix_rs_whale   ON revenue_scores(is_whale);",
    "CREATE INDEX IF NOT EXISTS ix_rs_tenant  ON revenue_scores(tenant_id);",
    "CREATE INDEX IF NOT EXISTS ix_rs_scored  ON revenue_scores(scored_at);",
]

def run():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(DDL)
    for idx in INDEXES:
        conn.execute(idx)
    conn.commit()

    # Verify
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='revenue_scores'"
    ).fetchone()
    if row:
        print(f"[Migration] OK — tablo: {row[0]}")
        # Show columns
        cols = conn.execute("PRAGMA table_info(revenue_scores)").fetchall()
        for c in cols:
            print(f"  col: {c[1]} ({c[2]})")
    else:
        print("[Migration] ERROR — tablo olusturulamadi!")
    conn.close()

if __name__ == "__main__":
    run()
