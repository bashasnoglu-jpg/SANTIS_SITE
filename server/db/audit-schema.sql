-- audit-schema.sql
-- Sprint 3: SQLite Audit Persistence
-- Çalıştır: sqlite3 data/santis-audit.db < audit-schema.sql

PRAGMA journal_mode = WAL;   -- Concurrent okuma + yazma
PRAGMA foreign_keys = ON;

-- ─── Tablo 1: audit_events ────────────────────────────────────────────────────
-- Append-only olay günlüğü. Hiçbir satır güncellenmez, silinmez.
CREATE TABLE IF NOT EXISTS audit_events (
    id              TEXT        NOT NULL PRIMARY KEY,  -- UUID v4
    event_type      TEXT        NOT NULL,              -- 'UPLOAD_DENIED' | 'UPLOAD_FINALIZED' | ...
    severity        TEXT        NOT NULL DEFAULT 'INFO',-- 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
    upload_id       TEXT,                              -- sovereign_assets.id (nullable — governor deny'da henüz yok)
    file_id         TEXT,
    subject         TEXT,                              -- 'user:xxx' | 'visitor:tenant:id:ip'
    tenant_id       TEXT,
    source_ip       TEXT,
    status_before   TEXT,                              -- 'UPLOADING', 'REAPING', ...
    status_after    TEXT,                              -- 'FINALIZED', 'ORPHANED', ...
    payload_json    TEXT,                              -- JSON blob (esnek alan)
    created_at      TEXT        NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Sık sorgulanan alanlar için index
CREATE INDEX IF NOT EXISTS idx_ae_event_type  ON audit_events (event_type);
CREATE INDEX IF NOT EXISTS idx_ae_subject     ON audit_events (subject);
CREATE INDEX IF NOT EXISTS idx_ae_tenant_id   ON audit_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ae_created_at  ON audit_events (created_at);
CREATE INDEX IF NOT EXISTS idx_ae_upload_id   ON audit_events (upload_id) WHERE upload_id IS NOT NULL;

-- ─── Tablo 2: incident_state ─────────────────────────────────────────────────
-- Aktif incident'lerin canlı durumu. UPSERT ile güncellenir.
-- incident_key = event_type:subject (örn: 'RATE_LIMIT_EXCEEDED:user:abc123')
CREATE TABLE IF NOT EXISTS incident_state (
    incident_key    TEXT        NOT NULL PRIMARY KEY,  -- event_type:subject
    incident_type   TEXT        NOT NULL,
    tenant_id       TEXT,
    subject         TEXT,
    status          TEXT        NOT NULL DEFAULT 'OPEN', -- 'OPEN' | 'RESOLVED' | 'SUPPRESSED'
    first_seen_at   TEXT        NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_seen_at    TEXT        NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    occurrence_count INTEGER    NOT NULL DEFAULT 1,
    last_payload_json TEXT,
    resolved_at     TEXT,
    resolved_by     TEXT
);

CREATE INDEX IF NOT EXISTS idx_is_status     ON incident_state (status);
CREATE INDEX IF NOT EXISTS idx_is_tenant_id  ON incident_state (tenant_id);
CREATE INDEX IF NOT EXISTS idx_is_type       ON incident_state (incident_type);
CREATE INDEX IF NOT EXISTS idx_is_resolved   ON incident_state (resolved_at) WHERE resolved_at IS NOT NULL;

-- ─── Composite indexes (Boardroom sorgu optimizasyonu) ────────────────────────
-- Heatmap: event_type + created_at + tenant_id
CREATE INDEX IF NOT EXISTS idx_ae_type_time
  ON audit_events (event_type, created_at DESC);

-- Heatmap grouping: type + tenant + time
CREATE INDEX IF NOT EXISTS idx_ae_type_tenant_time
  ON audit_events (event_type, tenant_id, created_at DESC);

-- Latency: UPLOAD_FINALIZED + finalizeDurationMs (JSON extract önce index devreye girmez
--          ama event_type + created_at daraltma yapar)
CREATE INDEX IF NOT EXISTS idx_ae_finalized_time
  ON audit_events (event_type, created_at DESC)
  WHERE event_type = 'UPLOAD_FINALIZED';

-- Retention job için
CREATE INDEX IF NOT EXISTS idx_ae_retention_sweep
  ON audit_events (created_at ASC);
