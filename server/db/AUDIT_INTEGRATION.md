# Sprint 3 — Audit Entegrasyon Noktaları

Bu dosya, `logAuditEvent` ve `upsertIncident` çağrılarının
hangi dosyalara, hangi satırlara ekleneceğini gösterir.

## Kurulum

```bash
npm install better-sqlite3 @types/better-sqlite3
mkdir -p server/data   # DB dosyası buraya yazılır
```

---

## 1. `middleware/enforce-upload-policy.ts`

### UPLOAD_DENIED → Governor ret

```ts
// Mevcut emitTelemetry('UPLOAD_DENIED', ...) çağrısının ALTINA ekle:
import { logAuditEvent, upsertIncident } from '../db/audit-log.js';

// --- governor ret bloğunda ---
logAuditEvent({
  eventType:  'UPLOAD_DENIED',
  subject:    identity.subject,
  tenantId:   identity.tenantId,
  sourceIp:   identity.sourceIp,
  payload:    { reason: decision.reason, requestedBytes },
});

// Incident: aynı subject sürekli reddediliyorsa OPEN kalır
upsertIncident({
  incidentType: 'UPLOAD_DENIED',
  subject:      identity.subject,
  tenantId:     identity.tenantId,
  payload:      { reason: decision.reason },
});
```

### UPLOAD_GOVERNOR_ERROR → try/catch bloğunda

```ts
logAuditEvent({
  eventType: 'UPLOAD_GOVERNOR_ERROR',
  subject:   identity?.subject,
  payload:   { message },
});
```

---

## 2. `controllers/finalize-upload.ts`

### UPLOAD_FINALIZE_REJECTED → her ret dalında

```ts
logAuditEvent({
  eventType:    'UPLOAD_FINALIZE_REJECTED',
  uploadId:     uploadId,
  subject:      identity.subject,
  tenantId:     identity.tenantId,
  statusBefore: record?.status,
  payload:      { reason: 'RECORD_NOT_FOUND' | 'UNAUTHORIZED' | 'SIZE_MISMATCH' | ... },
});
```

### UPLOAD_FINALIZED → başarı bloğunda

```ts
logAuditEvent({
  eventType:    'UPLOAD_FINALIZED',
  uploadId:     uploadId,
  fileId:       record.fileId,
  subject:      identity.subject,
  tenantId:     identity.tenantId,
  statusBefore: 'UPLOADING',
  statusAfter:  'FINALIZED',
  payload:      { sha256, byteSizeActual: byteCount, etag: headResult.etag },
});
```

### UPLOAD_FINALIZE_ERROR → catch bloğunda

```ts
logAuditEvent({
  eventType: 'UPLOAD_FINALIZE_ERROR',
  uploadId:  uploadId,
  subject:   identity.subject,
  payload:   { message },
});
```

---

## 3. `santis-reaper.js`

### UPLOAD_ORPHAN_REAPED → başarılı temizlik sonrası

```js
import { logAuditEvent } from './db/audit-log.js';

logAuditEvent({
  eventType:    'UPLOAD_ORPHAN_REAPED',
  uploadId:     orphan.id,
  fileId:       orphan.file_id,
  subject:      orphan.subject || orphan.visitor_id,
  tenantId:     orphan.tenant_id,
  statusBefore: 'UPLOADING',
  statusAfter:  'ORPHANED',
  payload:      { bytesReleased: orphan.byte_size_declared, storageKey: orphan.object_key },
});
```

### REAPER_ERROR → catch bloğunda

```js
logAuditEvent({
  eventType: 'REAPER_ERROR',
  uploadId:  orphan?.id,
  payload:   { message: err?.message ?? 'unknown_error' },
});
```

---

## Örnek SQLite sorguları (Boardroom / raporlama)

```sql
-- Son 1 saatteki tüm retler
SELECT event_type, subject, tenant_id, payload_json, created_at
FROM   audit_events
WHERE  event_type = 'UPLOAD_DENIED'
  AND  created_at > datetime('now', '-1 hour')
ORDER  BY created_at DESC;

-- Aktif açık incident'ler
SELECT incident_key, incident_type, occurrence_count, last_seen_at
FROM   incident_state
WHERE  status = 'OPEN'
ORDER  BY occurrence_count DESC;

-- Bugün finalize edilen upload'lar (toplam byte)
SELECT COUNT(*) AS count,
       SUM(json_extract(payload_json, '$.byteSizeActual')) AS total_bytes
FROM   audit_events
WHERE  event_type = 'UPLOAD_FINALIZED'
  AND  date(created_at) = date('now');

-- Reaper günlük özet
SELECT date(created_at) AS day,
       COUNT(*) AS reaped_count
FROM   audit_events
WHERE  event_type = 'UPLOAD_ORPHAN_REAPED'
GROUP  BY day
ORDER  BY day DESC
LIMIT  30;
```
