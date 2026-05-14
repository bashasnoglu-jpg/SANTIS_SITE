CREATE TABLE IF NOT EXISTS revenue_objects (
revenue_object_id TEXT PRIMARY KEY,
visitor_id TEXT NOT NULL,
session_id TEXT NOT NULL,
package_id TEXT,
package_name TEXT,
total_value REAL NOT NULL,
deferred_value REAL NOT NULL,
recognized_value REAL DEFAULT 0,
breakage_estimate REAL DEFAULT 0,
currency TEXT DEFAULT 'EUR',
status TEXT DEFAULT 'deferred',
created_at TEXT NOT NULL,
updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commission_ledger (
id TEXT PRIMARY KEY,
revenue_object_id TEXT NOT NULL,
commission_type TEXT,
actor_id TEXT,
amount REAL,
currency TEXT DEFAULT 'EUR',
created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS crm_trigger_log (
id TEXT PRIMARY KEY,
visitor_id TEXT,
session_id TEXT,
trigger_type TEXT,
target TEXT,
payload_json TEXT,
created_at TEXT
);
