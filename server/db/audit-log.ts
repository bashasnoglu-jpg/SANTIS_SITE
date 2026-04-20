/**
 * db/audit-log.ts
 * Audit olay yazma katmanı.
 *
 * İki fonksiyon dışa açılır:
 *   logAuditEvent()   → audit_events'e append
 *   upsertIncident()  → incident_state'i aç veya güncelle
 *
 * Her ikisi de sync (better-sqlite3) — try/catch ile sarılı,
 * hata fırlattığında ana işlemi bloklamaz (non-fatal).
 *
 * Severity mapping:
 *   UPLOAD_DENIED           → WARN
 *   UPLOAD_GOVERNOR_ERROR   → ERROR
 *   UPLOAD_FINALIZE_REJECTED→ WARN
 *   UPLOAD_FINALIZED        → INFO
 *   UPLOAD_ORPHAN_REAPED    → WARN
 *   REAPER_ERROR            → ERROR
 */

import { randomUUID } from 'node:crypto';
import { getAuditDb } from './sqlite-audit.js';

// ─── Tipler ───────────────────────────────────────────────────────────────────
export type AuditEventType =
  | 'UPLOAD_DENIED'
  | 'UPLOAD_GOVERNOR_ERROR'
  | 'UPLOAD_FINALIZE_STARTED'
  | 'UPLOAD_FINALIZE_REJECTED'
  | 'UPLOAD_HASH_COMPUTED'
  | 'UPLOAD_FINALIZED'
  | 'UPLOAD_FINALIZE_ERROR'
  | 'UPLOAD_ORPHAN_REAPED'
  | 'REAPER_ERROR';

export type AuditSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface AuditEventInput {
  eventType:    AuditEventType;
  uploadId?:    string;
  fileId?:      string;
  subject?:     string;
  tenantId?:    string;
  sourceIp?:    string;
  statusBefore?: string;
  statusAfter?:  string;
  payload?:     Record<string, unknown>;
}

// ─── Severity otomatik eşlemesi ───────────────────────────────────────────────
const SEVERITY_MAP: Record<AuditEventType, AuditSeverity> = {
  UPLOAD_DENIED:              'WARN',
  UPLOAD_GOVERNOR_ERROR:      'ERROR',
  UPLOAD_FINALIZE_STARTED:    'INFO',
  UPLOAD_FINALIZE_REJECTED:   'WARN',
  UPLOAD_HASH_COMPUTED:       'INFO',
  UPLOAD_FINALIZED:           'INFO',
  UPLOAD_FINALIZE_ERROR:      'ERROR',
  UPLOAD_ORPHAN_REAPED:       'WARN',
  REAPER_ERROR:               'ERROR',
};

// ─── Hazırlanmış sorgular (singleton ile aynı ömür) ──────────────────────────
// Prepared statement'lar bir kez derlenir, defalarca kullanılır → performans
let _insertStmt:  ReturnType<typeof getAuditDb>['prepare'] | null = null;
let _upsertStmt:  ReturnType<typeof getAuditDb>['prepare'] | null = null;

function getInsertStmt() {
  if (!_insertStmt) {
    _insertStmt = getAuditDb().prepare(`
      INSERT INTO audit_events
        (id, event_type, severity, upload_id, file_id, subject, tenant_id,
         source_ip, status_before, status_after, payload_json, created_at)
      VALUES
        (@id, @eventType, @severity, @uploadId, @fileId, @subject, @tenantId,
         @sourceIp, @statusBefore, @statusAfter, @payloadJson, @createdAt)
    `);
  }
  return _insertStmt;
}

function getUpsertStmt() {
  if (!_upsertStmt) {
    _upsertStmt = getAuditDb().prepare(`
      INSERT INTO incident_state
        (incident_key, incident_type, tenant_id, subject,
         status, first_seen_at, last_seen_at, occurrence_count, last_payload_json)
      VALUES
        (@incidentKey, @incidentType, @tenantId, @subject,
         'OPEN', @now, @now, 1, @payloadJson)
      ON CONFLICT (incident_key) DO UPDATE SET
        last_seen_at       = @now,
        occurrence_count   = occurrence_count + 1,
        last_payload_json  = @payloadJson,
        status             = CASE WHEN status = 'RESOLVED' THEN 'OPEN' ELSE status END
    `);
  }
  return _upsertStmt;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Audit olayı yaz (append-only).
 * Non-fatal: hata loglara düşer, exception fırlatmaz.
 */
export function logAuditEvent(input: AuditEventInput): void {
  try {
    getInsertStmt().run({
      id:           randomUUID(),
      eventType:    input.eventType,
      severity:     SEVERITY_MAP[input.eventType] ?? 'INFO',
      uploadId:     input.uploadId     ?? null,
      fileId:       input.fileId       ?? null,
      subject:      input.subject      ?? null,
      tenantId:     input.tenantId     ?? null,
      sourceIp:     input.sourceIp     ?? null,
      statusBefore: input.statusBefore ?? null,
      statusAfter:  input.statusAfter  ?? null,
      payloadJson:  input.payload ? JSON.stringify(input.payload) : null,
      createdAt:    new Date().toISOString(),
    });
  } catch (err) {
    // Audit yazma hiçbir zaman ana akışı öldürmesin
    console.error('[AuditLog] logAuditEvent hatası:', err);
  }
}

/**
 * Incident durumunu aç veya güncelle (UPSERT).
 * İlk görülüşte OPEN açar, sonraki occurrence_count'u artırır.
 * Non-fatal.
 */
export function upsertIncident(params: {
  incidentType: AuditEventType;
  subject?:     string;
  tenantId?:    string;
  payload?:     Record<string, unknown>;
}): void {
  try {
    const incidentKey = `${params.incidentType}:${params.subject ?? 'anon'}`;
    getUpsertStmt().run({
      incidentKey,
      incidentType:  params.incidentType,
      tenantId:      params.tenantId  ?? null,
      subject:       params.subject   ?? null,
      now:           new Date().toISOString(),
      payloadJson:   params.payload ? JSON.stringify(params.payload) : null,
    });
  } catch (err) {
    console.error('[AuditLog] upsertIncident hatası:', err);
  }
}
