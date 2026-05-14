/**
 * routes/boardroom.ts
 * Boardroom Telemetry API — Sprint 4
 *
 * GET /api/v1/boardroom/summary        → 4 kart verisi
 * GET /api/v1/boardroom/incidents      → açık incident listesi
 * GET /api/v1/boardroom/live-feed      → son N audit olayı
 * GET /api/v1/boardroom/quota-pressure → kota baskı tablosu
 *
 * Tüm sorgular SQLite (audit_events + incident_state).
 * Sonuçlar 30s cache ile döner — Boardroom 5s polling yapar,
 * SQLite'ı zorlamaz.
 */

import { Router, type Request, type Response } from 'express';
import { getAuditDb }    from '../db/sqlite-audit.js';
import { emitTelemetry } from '../core/telemetry.js';
import { applyAction }   from '../../assets/js/lib/incidentLifecycle.js';
import { boardroomRateLimit, boardroomAuthGuard } from '../middleware/boardroom-guard.js';
import { detectAnomalies }  from '../services/anomaly-engine.js';
import { SovereignReaper }  from '../santis-reaper.js';

const router = Router();

// Express json parser (Özellikle POST /login için req.body parsing gerekir)
import express from 'express';
router.use(express.json());

// ─── Cerberus Gate / Login Endpoint ──────────────────────────────────────────
// Sadece Rate Limit uygulanır, Auth koruması *yoktur*
router.post('/login', boardroomRateLimit, (req: Request, res: Response) => {
    const { passcode } = req.body;
    const FALLBACK_SECRET  = 'SOVEREIGN_V28_OMEGA';
    const BOARDROOM_SECRET = process.env.BOARDROOM_SECRET || FALLBACK_SECRET;

    if (passcode === BOARDROOM_SECRET) {
        const isProd = process.env.NODE_ENV === 'production';
        const secureFlag = isProd ? 'Secure;' : ''; 
        res.setHeader('Set-Cookie', `cerberus_token=${passcode}; HttpOnly; ${secureFlag} SameSite=Strict; Path=/`);
        res.json({ message: 'CERBERUS_UNSEALED' });
    } else {
        res.status(401).json({ error: 'CERBERUS_REJECTED' });
    }
});

// Auth + Rate limit — Bundan sonraki TÜM boardroom endpoint'leri için Mühür Şarttır.
router.use(boardroomRateLimit, boardroomAuthGuard);

// ─── Sovereign Command / Yöneticisel Uçlar ──────────────────────────────────
router.post('/logout', (req: Request, res: Response) => {
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? 'Secure;' : ''; 
    res.setHeader('Set-Cookie', `cerberus_token=; Max-Age=0; HttpOnly; ${secureFlag} SameSite=Strict; Path=/`);
    res.json({ message: 'CERBERUS_SEALED' });
});

router.post('/reaper/trigger', (req: Request, res: Response) => {
    // Reaper'ı asenkron olarak tetikle, hemen yanıt dön (Non-blocking)
    Promise.resolve().then(() => SovereignReaper.execute()).catch(console.error);
    res.json({ message: 'REAPER_INITIATED' });
});

// ─── Basit bellek cache (TTL: 30s) ───────────────────────────────────────────
interface CacheEntry { data: unknown; expiresAt: number }
const _cache = new Map<string, CacheEntry>();

function cachedQuery<T>(key: string, ttlMs: number, fn: () => T): T {
  const entry = _cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.data as T;
  const data = fn();
  _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

// ─── GET /summary ─────────────────────────────────────────────────────────────
router.get('/summary', (_req: Request, res: Response) => {
  try {
    const db = getAuditDb();
    const data = cachedQuery('summary', 30_000, () => {
      const deniedLastHour = (db.prepare(`
        SELECT COUNT(*) AS n FROM audit_events
        WHERE event_type = 'UPLOAD_DENIED'
          AND created_at > datetime('now', '-1 hour')
      `).get() as any).n;

      const activeIncidents = (db.prepare(`
        SELECT COUNT(*) AS n FROM incident_state WHERE status = 'OPEN'
      `).get() as any).n;

      const finalizedBytesRow = db.prepare(`
        SELECT COALESCE(SUM(CAST(json_extract(payload_json,'$.byteSizeActual') AS INTEGER)), 0) AS total
        FROM audit_events
        WHERE event_type = 'UPLOAD_FINALIZED'
          AND date(created_at) = date('now')
      `).get() as any;

      const reaperCount = (db.prepare(`
        SELECT COUNT(*) AS n FROM audit_events
        WHERE event_type = 'UPLOAD_ORPHAN_REAPED'
          AND created_at > datetime('now', '-24 hours')
      `).get() as any).n;

      return {
        deniedLastHour,
        activeIncidents,
        finalizedBytesToday: finalizedBytesRow?.total ?? 0,
        reaperCleanupsDay:   reaperCount,
        generatedAt:         new Date().toISOString(),
      };
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'SUMMARY_FAILED', message: err?.message });
  }
});

// ─── GET /incidents ───────────────────────────────────────────────────────────
router.get('/incidents', (req: Request, res: Response) => {
  try {
    const db     = getAuditDb();
    const limit  = Math.min(Number(req.query.limit ?? 50), 200);
    const status = (req.query.status as string) ?? 'OPEN';

    const rows = cachedQuery(`incidents:${status}:${limit}`, 15_000, () =>
      db.prepare(`
        SELECT incident_key, incident_type, tenant_id, subject,
               status, first_seen_at, last_seen_at, occurrence_count,
               last_payload_json
        FROM   incident_state
        WHERE  status = ?
        ORDER  BY occurrence_count DESC, last_seen_at DESC
        LIMIT  ?
      `).all(status, limit)
    );

    res.json({ incidents: rows, count: (rows as any[]).length });
  } catch (err: any) {
    res.status(500).json({ error: 'INCIDENTS_FAILED', message: err?.message });
  }
});

// ─── GET /live-feed ───────────────────────────────────────────────────────────
router.get('/live-feed', (req: Request, res: Response) => {
  try {
    const db    = getAuditDb();
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const types = ['UPLOAD_DENIED','UPLOAD_FINALIZE_REJECTED',
                   'REAPER_ERROR','UPLOAD_ORPHAN_REAPED',
                   'UPLOAD_FINALIZED','UPLOAD_GOVERNOR_ERROR'];

    // Live feed cache kısa tutulur (5s) — pulse hissi
    const rows = cachedQuery(`live-feed:${limit}`, 5_000, () =>
      db.prepare(`
        SELECT id, event_type, severity, upload_id, file_id,
               subject, tenant_id, status_before, status_after,
               payload_json, created_at
        FROM   audit_events
        WHERE  event_type IN (${types.map(() => '?').join(',')})
        ORDER  BY created_at DESC
        LIMIT  ?
      `).all(...types, limit)
    );

    res.json({ events: rows, count: (rows as any[]).length });
  } catch (err: any) {
    res.status(500).json({ error: 'LIVE_FEED_FAILED', message: err?.message });
  }
});

// ─── GET /quota-pressure ──────────────────────────────────────────────────────
router.get('/quota-pressure', (_req: Request, res: Response) => {
  try {
    const db = getAuditDb();
    const data = cachedQuery('quota-pressure', 60_000, () => {
      const topDenied = db.prepare(`
        SELECT subject, tenant_id, COUNT(*) AS deny_count
        FROM   audit_events
        WHERE  event_type = 'UPLOAD_DENIED'
          AND  created_at > datetime('now', '-24 hours')
          AND  subject IS NOT NULL
        GROUP  BY subject
        ORDER  BY deny_count DESC
        LIMIT  10
      `).all();

      const topBytes = db.prepare(`
        SELECT subject, tenant_id,
               SUM(CAST(json_extract(payload_json,'$.requestedBytes') AS INTEGER)) AS total_bytes
        FROM   audit_events
        WHERE  event_type IN ('UPLOAD_DENIED','UPLOAD_FINALIZED')
          AND  created_at > datetime('now', '-24 hours')
          AND  subject IS NOT NULL
        GROUP  BY subject
        ORDER  BY total_bytes DESC
        LIMIT  10
      `).all();

      const topOrphans = db.prepare(`
        SELECT subject, tenant_id, COUNT(*) AS orphan_count
        FROM   audit_events
        WHERE  event_type = 'UPLOAD_ORPHAN_REAPED'
          AND  created_at > datetime('now', '-24 hours')
          AND  subject IS NOT NULL
        GROUP  BY subject
        ORDER  BY orphan_count DESC
        LIMIT  10
      `).all();

      return { topDenied, topBytes, topOrphans };
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'QUOTA_PRESSURE_FAILED', message: err?.message });
  }
});

// ─── GET /anomalies ─────────────────────────────────────────────────────
// Aktif anomalileri severity sırasıyla döndürür (max 10)
router.get('/anomalies', (_req: Request, res: Response) => {
  try {
    const data = cachedQuery('anomalies', 30_000, () => {
      const db       = getAuditDb();
      const anomalies = detectAnomalies(db).slice(0, 10);
      return { anomalies, count: anomalies.length, detectedAt: new Date().toISOString() };
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'ANOMALY_DETECTION_FAILED', message: err?.message });
  }
});

// ─── GET /timeseries ─────────────────────────────────────────────────────
// ?window=24h|7d  ?bucket=hour|day
router.get('/timeseries', (req: Request, res: Response) => {
  try {
    const win    = req.query.window === '7d' ? '7d' : '24h';
    const bucket = win === '7d' ? 'day' : 'hour';
    const cacheKey = `ts:${win}`;

    const data = cachedQuery(cacheKey, win === '24h' ? 60_000 : 300_000, () => {
      const db = getAuditDb();

      // SQLite strftime ile bucket'lama
      const fmt  = bucket === 'hour' ? '%Y-%m-%dT%H:00:00Z' : '%Y-%m-%d';
      const since = win === '24h'
        ? "datetime('now', '-24 hours')"
        : "datetime('now', '-7 days')";

      const denied = db.prepare(`
        SELECT strftime('${fmt}', created_at) AS bucket, COUNT(*) AS value
        FROM   audit_events
        WHERE  event_type = 'UPLOAD_DENIED'
          AND  created_at >= ${since}
        GROUP  BY bucket ORDER BY bucket ASC
      `).all();

      const finalized = db.prepare(`
        SELECT strftime('${fmt}', created_at) AS bucket,
               COALESCE(SUM(CAST(json_extract(payload_json,'$.byteSizeActual') AS INTEGER)), 0) AS value
        FROM   audit_events
        WHERE  event_type = 'UPLOAD_FINALIZED'
          AND  created_at >= ${since}
        GROUP  BY bucket ORDER BY bucket ASC
      `).all();

      const reaper = db.prepare(`
        SELECT strftime('${fmt}', created_at) AS bucket, COUNT(*) AS value
        FROM   audit_events
        WHERE  event_type = 'UPLOAD_ORPHAN_REAPED'
          AND  created_at >= ${since}
        GROUP  BY bucket ORDER BY bucket ASC
      `).all();

      return { window: win, bucket, denied, finalized, reaper };
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'TIMESERIES_FAILED', message: err?.message });
  }
});

// ─── PATCH /incidents/:key ───────────────────────────────────────────────────
// Incident lifecycle geçişi: ACK | MUTE | ESCALATE | RESOLVE
router.patch('/incidents/:key', async (req: Request, res: Response) => {
  const incidentKey = decodeURIComponent(req.params.key);
  const { action, operatorId, operatorNote } = req.body ?? {};

  if (!action) {
    res.status(400).json({ error: 'MISSING_ACTION', message: 'action is required.' });
    return;
  }

  try {
    const db  = getAuditDb();
    const row = db.prepare(`
      SELECT incident_key, status FROM incident_state WHERE incident_key = ?
    `).get(incidentKey) as { incident_key: string; status: string } | undefined;

    if (!row) {
      res.status(404).json({ error: 'INCIDENT_NOT_FOUND' });
      return;
    }

    const { newState, allowed, reason } = applyAction(row.status, action);
    if (!allowed) {
      res.status(409).json({ error: 'TRANSITION_NOT_ALLOWED', reason });
      return;
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE incident_state
      SET status       = ?,
          last_seen_at = ?,
          resolved_at  = CASE WHEN ? = 'RESOLVED' THEN ? ELSE resolved_at END,
          resolved_by  = CASE WHEN ? = 'RESOLVED' THEN ? ELSE resolved_by END
      WHERE incident_key = ?
    `).run(newState, now, newState, now, newState, operatorId ?? 'system', incidentKey);

    // Audit kaydı
    db.prepare(`
      INSERT INTO audit_events
        (id, event_type, severity, payload_json, created_at)
      VALUES (lower(hex(randomblob(16))), 'INCIDENT_TRANSITION', 'INFO', ?, ?)
    `).run(JSON.stringify({
      incidentKey, action, from: row.status, to: newState,
      operatorId, operatorNote,
    }), now);

    // WS broadcast
    await emitTelemetry('INCIDENT_TRANSITION' as any, {
      ts: Date.now(), incidentKey, action, from: row.status, to: newState,
    }).catch(() => {});

    _cache.clear(); // Snapshot cache'i temizle
    res.json({ incidentKey, previousStatus: row.status, newStatus: newState });

  } catch (err: any) {
    res.status(500).json({ error: 'TRANSITION_FAILED', message: err?.message });
  }
});

// ─── GET /denial-heatmap ──────────────────────────────────────────────────────
// ?range=24h|7d
// Döndürür: { range, buckets[], tenants[], cells[] }
router.get('/denial-heatmap', (req: Request, res: Response) => {
  try {
    const range  = req.query.range === '7d' ? '7d' : '24h';
    const cacheKey = `heatmap:${range}`;

    const data = cachedQuery(cacheKey, 60_000, () => {
      const db   = getAuditDb();
      const fmt  = range === '7d' ? '%Y-%m-%d' : '%Y-%m-%dT%H:00:00Z';
      const since = range === '7d'
        ? "datetime('now', '-7 days')"
        : "datetime('now', '-24 hours')";

      // Ana hücre verisi
      const rows = db.prepare(`
        SELECT
          COALESCE(tenant_id, 'unknown') AS tenant_id,
          strftime('${fmt}', created_at)  AS bucket,
          COUNT(*)                         AS deny_count,
          SUM(CAST(json_extract(payload_json,'$.requestedBytes') AS INTEGER))
                                           AS requested_bytes
        FROM   audit_events
        WHERE  event_type = 'UPLOAD_DENIED'
          AND  created_at >= ${since}
        GROUP  BY tenant_id, bucket
        ORDER  BY bucket ASC, deny_count DESC
      `).all() as Array<{
        tenant_id: string; bucket: string;
        deny_count: number; requested_bytes: number;
      }>;

      // Her (tenant, bucket) için top reason — ayrı sorgu, hafif
      const reasons = db.prepare(`
        SELECT
          COALESCE(tenant_id, 'unknown') AS tenant_id,
          strftime('${fmt}', created_at)  AS bucket,
          json_extract(payload_json,'$.reason') AS reason,
          COUNT(*) AS n
        FROM   audit_events
        WHERE  event_type = 'UPLOAD_DENIED'
          AND  created_at >= ${since}
          AND  json_extract(payload_json,'$.reason') IS NOT NULL
        GROUP  BY tenant_id, bucket, reason
        ORDER  BY n DESC
      `).all() as Array<{
        tenant_id: string; bucket: string; reason: string; n: number;
      }>;

      // Reason lookup: "tenant:bucket" → top reason
      const reasonMap = new Map<string, string>();
      for (const r of reasons) {
        const k = `${r.tenant_id}:${r.bucket}`;
        if (!reasonMap.has(k)) reasonMap.set(k, r.reason);
      }

      const cells = rows.map(r => ({
        tenantId:       r.tenant_id,
        bucket:         r.bucket,
        denyCount:      r.deny_count,
        requestedBytes: r.requested_bytes ?? 0,
        topReason:      reasonMap.get(`${r.tenant_id}:${r.bucket}`) ?? null,
      }));

      // Sıralı eksen listeleri
      const buckets = [...new Set(rows.map(r => r.bucket))].sort();
      const tenants = ['unknown',
        ...new Set(rows.map(r => r.tenant_id).filter(t => t !== 'unknown'))
      ];

      return { range, buckets, tenants, cells };
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'HEATMAP_FAILED', message: err?.message });
  }
});

// ─── GET /latency ─────────────────────────────────────────────────────────────
// ?range=24h|7d
// Döndürür: { count, p50, p95, p99, avg, histogram[], breakdown }
router.get('/latency', (req: Request, res: Response) => {
  try {
    const range    = req.query.range === '7d' ? '7d' : '24h';
    const cacheKey = `latency:${range}`;

    const data = cachedQuery(cacheKey, 30_000, () => {
      const db    = getAuditDb();
      const since = range === '7d'
        ? "datetime('now', '-7 days')"
        : "datetime('now', '-24 hours')";

      // Tüm finalizeDurationMs değerlerini çek (sıralı — percentile için)
      const allRows = db.prepare(`
        SELECT
          CAST(json_extract(payload_json,'$.finalizeDurationMs') AS INTEGER) AS ms,
          CAST(json_extract(payload_json,'$.storageHeadMs')      AS INTEGER) AS head_ms,
          CAST(json_extract(payload_json,'$.hashComputeMs')      AS INTEGER) AS hash_ms,
          CAST(json_extract(payload_json,'$.dbCommitMs')         AS INTEGER) AS db_ms
        FROM   audit_events
        WHERE  event_type = 'UPLOAD_FINALIZED'
          AND  created_at >= ${since}
          AND  json_extract(payload_json,'$.finalizeDurationMs') IS NOT NULL
        ORDER  BY ms ASC
      `).all() as Array<{ ms: number; head_ms: number; hash_ms: number; db_ms: number }>;

      if (!allRows.length) {
        return { range, count: 0, p50: null, p95: null, p99: null, avg: null,
                 histogram: [], breakdown: null };
      }

      const vals    = allRows.map(r => r.ms);
      const n       = vals.length;
      const pct     = (p: number) => vals[Math.max(0, Math.floor(n * p) - 1)];
      const avg     = Math.round(vals.reduce((a,b) => a+b,0) / n);

      // Histogram buckets
      const BUCKETS = [
        { label: '0–50ms',    min: 0,   max: 50   },
        { label: '50–100ms',  min: 50,  max: 100  },
        { label: '100–250ms', min: 100, max: 250  },
        { label: '250–500ms', min: 250, max: 500  },
        { label: '500ms+',    min: 500, max: Infinity },
      ];
      const histogram = BUCKETS.map(b => ({
        label: b.label,
        count: vals.filter(v => v >= b.min && v < b.max).length,
      }));

      // Phase breakdown ortalamaları
      const avg_ms = (key: keyof typeof allRows[0]) => {
        const filtered = allRows.map(r => r[key]).filter((v): v is number => typeof v === 'number' && !isNaN(v));
        return filtered.length ? Math.round(filtered.reduce((a,b)=>a+b,0)/filtered.length) : null;
      };

      return {
        range, count: n,
        p50:  pct(0.50), p95: pct(0.95), p99: pct(0.99), avg,
        histogram,
        breakdown: {
          storageHeadMs: avg_ms('head_ms'),
          hashComputeMs: avg_ms('hash_ms'),
          dbCommitMs:    avg_ms('db_ms'),
        },
      };
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'LATENCY_FAILED', message: err?.message });
  }
});

export default router;


