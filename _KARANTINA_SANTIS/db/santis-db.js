// db/santis-db.js
// SQLite persistence katmanı — better-sqlite3 (senkron, hızlı, sıfır async karmaşıklığı)
//
// Tablolar:
//   audit_events    → tüm OPERATOR_ACTION kayıtları
//   incident_state  → her incident'in mevcut yaşam döngüsü durumu

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

// ─── Yapılandırma ─────────────────────────────────────────────────────────────
const DB_DIR  = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'santis-ops.sqlite');

fs.mkdirSync(DB_DIR, { recursive: true });

// ─── Bağlantı ─────────────────────────────────────────────────────────────────
const db = new Database(DB_PATH, { verbose: null });

// WAL modu: eş zamanlı okuma + yazma için ideal
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    schema_version  INTEGER NOT NULL DEFAULT 1,
    target_event_id TEXT    NOT NULL,
    action          TEXT    NOT NULL,
    operator_id     TEXT,
    operator_name   TEXT,
    operator_role   TEXT,
    session_id      TEXT,
    source          TEXT,
    timestamp       INTEGER,
    processed_at    INTEGER,
    payload_json    TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_audit_target
    ON audit_events (target_event_id);

  CREATE INDEX IF NOT EXISTS idx_audit_operator
    ON audit_events (operator_id);

  CREATE INDEX IF NOT EXISTS idx_audit_timestamp
    ON audit_events (timestamp);

  CREATE TABLE IF NOT EXISTS incident_state (
    target_event_id TEXT    PRIMARY KEY,
    current_state   TEXT    NOT NULL DEFAULT 'OPEN',
    last_action     TEXT,
    updated_at      INTEGER,
    updated_by      TEXT,
    is_resolved     INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL
  );
`);

// ─── Prepared Statements (hız için) ──────────────────────────────────────────
const stmts = {
  insertAudit: db.prepare(`
    INSERT INTO audit_events
      (schema_version, target_event_id, action, operator_id, operator_name,
       operator_role, session_id, source, timestamp, processed_at, payload_json)
    VALUES
      (@schema_version, @target_event_id, @action, @operator_id, @operator_name,
       @operator_role, @session_id, @source, @timestamp, @processed_at, @payload_json)
  `),

  upsertIncident: db.prepare(`
    INSERT INTO incident_state
      (target_event_id, current_state, last_action, updated_at, updated_by, is_resolved, created_at)
    VALUES
      (@target_event_id, @current_state, @last_action, @updated_at, @updated_by, @is_resolved, @created_at)
    ON CONFLICT(target_event_id) DO UPDATE SET
      current_state = excluded.current_state,
      last_action   = excluded.last_action,
      updated_at    = excluded.updated_at,
      updated_by    = excluded.updated_by,
      is_resolved   = excluded.is_resolved
  `),

  getAllAudit: db.prepare(`
    SELECT * FROM audit_events ORDER BY timestamp ASC
  `),

  getAuditByTarget: db.prepare(`
    SELECT * FROM audit_events WHERE target_event_id = ? ORDER BY timestamp ASC
  `),

  getAllIncidents: db.prepare(`
    SELECT * FROM incident_state ORDER BY updated_at DESC
  `),

  getIncident: db.prepare(`
    SELECT * FROM incident_state WHERE target_event_id = ?
  `),

  getOpenIncidents: db.prepare(`
    SELECT * FROM incident_state WHERE is_resolved = 0 ORDER BY updated_at DESC
  `),
};

// ─── İncident state hesaplama yardımcısı ─────────────────────────────────────
// Gateway'de incidentLifecycle.js kullanamayız (ESM/CJS uyumsuzluğu).
// Geçiş tablosunu burada CJS olarak tekrarlıyoruz.
const TRANSITIONS = {
  OPEN:      { ACK: 'ACKED', MUTE: 'MUTED', ESCALATE: 'ESCALATED', RESOLVE: null       },
  ACKED:     { ACK: 'ACKED', MUTE: 'MUTED', ESCALATE: 'ESCALATED', RESOLVE: 'RESOLVED' },
  MUTED:     { ACK: 'ACKED', MUTE: 'MUTED', ESCALATE: 'ESCALATED', RESOLVE: 'RESOLVED' },
  ESCALATED: { ACK: 'ACKED', MUTE: 'MUTED', ESCALATE: 'ESCALATED', RESOLVE: 'RESOLVED' },
  RESOLVED:  { ACK: null,    MUTE: null,    ESCALATE: 'ESCALATED',  RESOLVE: 'RESOLVED' },
};

function nextState(current, action) {
  return (TRANSITIONS[current] ?? {})[action] ?? null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * OPERATOR_ACTION paketini hem audit_events'e hem incident_state'e yazar.
 * Senkron — gateway message handler içinde güvenle çağrılabilir.
 */
function writeOperatorAction(packet) {
  const now = Date.now();

  // 1. Audit kaydı
  stmts.insertAudit.run({
    schema_version:  1,
    target_event_id: packet.targetEventId ?? 'UNKNOWN',
    action:          packet.action,
    operator_id:     packet.operatorId    ?? null,
    operator_name:   packet.operatorName  ?? null,
    operator_role:   packet.operatorRole  ?? null,
    session_id:      packet.sessionId     ?? null,
    source:          packet.source        ?? null,
    timestamp:       packet.timestamp     ?? now,
    processed_at:    packet.processedAt   ?? now,
    payload_json:    JSON.stringify(packet),
  });

  // 2. Incident state güncelle
  const existing  = stmts.getIncident.get(packet.targetEventId ?? 'UNKNOWN');
  const currState = existing?.current_state ?? 'OPEN';
  const newState  = nextState(currState, packet.action) ?? currState;

  stmts.upsertIncident.run({
    target_event_id: packet.targetEventId ?? 'UNKNOWN',
    current_state:   newState,
    last_action:     packet.action,
    updated_at:      now,
    updated_by:      packet.operatorId ?? null,
    is_resolved:     newState === 'RESOLVED' ? 1 : 0,
    created_at:      existing?.created_at ?? now,
  });

  return { newState };
}

/** Tüm audit kayıtlarını döndürür (REST endpoint için). */
function getAllAudit()      { return stmts.getAllAudit.all(); }

/** Tüm incident durumlarını döndürür. */
function getAllIncidents()  { return stmts.getAllIncidents.all(); }

/** Açık (çözümlenmemiş) incident'leri döndürür. */
function getOpenIncidents() { return stmts.getOpenIncidents.all(); }

module.exports = { writeOperatorAction, getAllAudit, getAllIncidents, getOpenIncidents };
