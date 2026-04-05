CREATE TABLE IF NOT EXISTS telemetry_events (
id TEXT PRIMARY KEY,
event_type TEXT NOT NULL,
visitor_id TEXT NOT NULL,
session_id TEXT NOT NULL,
page_path TEXT,
source TEXT DEFAULT 'frontend',
payload_json TEXT NOT NULL,
event_ts TEXT NOT NULL,
created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_visitor ON telemetry_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON telemetry_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON telemetry_events(event_type);
