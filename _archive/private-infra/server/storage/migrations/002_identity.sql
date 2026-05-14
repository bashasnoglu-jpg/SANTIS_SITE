CREATE TABLE IF NOT EXISTS visitors (
visitor_id TEXT PRIMARY KEY,
first_seen_at TEXT NOT NULL,
last_seen_at TEXT NOT NULL,
total_sessions INTEGER DEFAULT 0,
current_intent_score REAL DEFAULT 0,
current_status TEXT DEFAULT 'cold'
);

CREATE TABLE IF NOT EXISTS sessions (
session_id TEXT PRIMARY KEY,
visitor_id TEXT NOT NULL,
started_at TEXT NOT NULL,
ended_at TEXT,
entry_page TEXT,
exit_page TEXT,
duration_seconds INTEGER,
device_type TEXT,
user_agent TEXT,
FOREIGN KEY(visitor_id) REFERENCES visitors(visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions(visitor_id);
