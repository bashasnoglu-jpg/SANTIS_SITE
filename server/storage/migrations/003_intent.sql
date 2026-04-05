CREATE TABLE IF NOT EXISTS intent_signals (
id TEXT PRIMARY KEY,
visitor_id TEXT NOT NULL,
session_id TEXT NOT NULL,
signal_type TEXT NOT NULL,
score REAL NOT NULL,
confidence REAL NOT NULL,
page_path TEXT,
created_at TEXT NOT NULL,
FOREIGN KEY(visitor_id) REFERENCES visitors(visitor_id),
FOREIGN KEY(session_id) REFERENCES sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_intent_visitor ON intent_signals(visitor_id);
