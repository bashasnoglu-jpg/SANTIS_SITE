CREATE TABLE IF NOT EXISTS ritual_builder_activity (
id TEXT PRIMARY KEY,
visitor_id TEXT NOT NULL,
session_id TEXT NOT NULL,
service_id TEXT,
package_id TEXT,
action TEXT NOT NULL,
duration_minutes INTEGER,
price_amount REAL,
currency TEXT DEFAULT 'EUR',
page_path TEXT,
created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ritual_visitor ON ritual_builder_activity(visitor_id);
