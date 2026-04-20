/**
 * services/anomaly-engine.ts
 * V2.3 — Deterministic Anomaly Detection Engine
 *
 * Kural sınıfları:
 *   VOLUMETRIC  → DENY_SPIKE
 *   LIFECYCLE   → ORPHAN_SURGE
 *   LATENCY     → P95_REGRESSION, P99_REGRESSION
 *
 * Yaklaşım: saf threshold rules, ML yok.
 * Her kural kendi pencerelerini SQLite'tan okur,
 * bağımsız ve idempotent çalışır.
 *
 * Kullanım:
 *   const anomalies = await detectAnomalies(db);
 */

import type { Database } from 'better-sqlite3';

// ─── Tip tanımları ────────────────────────────────────────────────────────────
export type AnomalyType =
  | 'DENY_SPIKE'
  | 'ORPHAN_SURGE'
  | 'P95_REGRESSION'
  | 'P99_REGRESSION';

export type AnomalySeverity = 'warning' | 'critical';

export interface Anomaly {
  key:         string;
  type:        AnomalyType;
  severity:    AnomalySeverity;
  title:       string;
  summary:     string;
  tenantId?:   string;
  detectedAt:  string;
  metrics:     Record<string, number | null>;
}

// ─── Yardımcı: percentile (sıralı array) ─────────────────────────────────────
function pct(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.max(0, Math.floor(sorted.length * p) - 1)];
}

// ─── Kural 1: DENY_SPIKE ─────────────────────────────────────────────────────
// last15m_denied > prev60m_per15m_avg × SPIKE_FACTOR AND last15m >= MIN_ABS
const DENY_SPIKE_FACTOR  = 3;
const DENY_SPIKE_MIN_ABS = 10;

function checkDenySpike(db: Database): Anomaly | null {
  const now = (db.prepare(`
    SELECT COUNT(*) AS n FROM audit_events
    WHERE event_type = 'UPLOAD_DENIED'
      AND created_at >= datetime('now','-15 minutes')
  `).get() as any).n as number;

  const prev = (db.prepare(`
    SELECT COUNT(*) AS n FROM audit_events
    WHERE event_type = 'UPLOAD_DENIED'
      AND created_at >= datetime('now','-75 minutes')
      AND created_at <  datetime('now','-15 minutes')
  `).get() as any).n as number;

  const baselinePer15 = prev / 4;                  // 60dk → 15dk birime çevir
  const multiplier    = baselinePer15 > 0
    ? now / baselinePer15
    : now >= DENY_SPIKE_MIN_ABS ? DENY_SPIKE_FACTOR + 1 : 0;

  if (now < DENY_SPIKE_MIN_ABS || multiplier < DENY_SPIKE_FACTOR) return null;

  const severity: AnomalySeverity = multiplier >= DENY_SPIKE_FACTOR * 2 ? 'critical' : 'warning';

  return {
    key:        'DENY_SPIKE:global',
    type:       'DENY_SPIKE',
    severity,
    title:      'Upload Denial Spike Detected',
    summary:    `${now} ret / 15dk — baseline'in ${multiplier.toFixed(1)}×'i. Flood veya abuse kontrol edilmeli.`,
    detectedAt: new Date().toISOString(),
    metrics:    { last15mDenied: now, baselinePer15m: Math.round(baselinePer15), multiplier: Math.round(multiplier * 10) / 10 },
  };
}

// ─── Kural 2: ORPHAN_SURGE ────────────────────────────────────────────────────
// orphaned_last60m > baseline24h_hourly_avg × SURGE_FACTOR AND >= MIN_ABS
const ORPHAN_SURGE_FACTOR  = 2;
const ORPHAN_SURGE_MIN_ABS = 5;

function checkOrphanSurge(db: Database): Anomaly | null {
  const last60m = (db.prepare(`
    SELECT COUNT(*) AS n FROM audit_events
    WHERE event_type = 'UPLOAD_ORPHAN_REAPED'
      AND created_at >= datetime('now','-1 hour')
  `).get() as any).n as number;

  const prev24h = (db.prepare(`
    SELECT COUNT(*) AS n FROM audit_events
    WHERE event_type = 'UPLOAD_ORPHAN_REAPED'
      AND created_at >= datetime('now','-25 hours')
      AND created_at <  datetime('now','-1 hour')
  `).get() as any).n as number;

  const hourlyBaseline = prev24h / 24;
  const multiplier     = hourlyBaseline > 0
    ? last60m / hourlyBaseline
    : last60m >= ORPHAN_SURGE_MIN_ABS ? ORPHAN_SURGE_FACTOR + 1 : 0;

  if (last60m < ORPHAN_SURGE_MIN_ABS || multiplier < ORPHAN_SURGE_FACTOR) return null;

  const severity: AnomalySeverity = multiplier >= ORPHAN_SURGE_FACTOR * 3 ? 'critical' : 'warning';

  return {
    key:        'ORPHAN_SURGE:global',
    type:       'ORPHAN_SURGE',
    severity,
    title:      'Orphan Upload Surge',
    summary:    `${last60m} orphan / 1s — saatlik baseline'in ${multiplier.toFixed(1)}×'i. Finalize zinciri kontrol edilmeli.`,
    detectedAt: new Date().toISOString(),
    metrics:    { last60mOrphaned: last60m, hourlyBaseline: Math.round(hourlyBaseline), multiplier: Math.round(multiplier * 10) / 10 },
  };
}

// ─── Kural 3 & 4: P95 / P99 REGRESSION ────────────────────────────────────────
// Mevcut pencere (0–4h) vs önceki pencere (4–8h)
// P95 > baseline × 1.75 AND > 350ms  → P95_REGRESSION
// P99 > baseline × 2.00 AND > 1000ms → P99_REGRESSION

const P95_FACTOR   = 1.75;
const P95_MIN_MS   = 350;
const P99_FACTOR   = 2.00;
const P99_MIN_MS   = 1_000;

function checkLatencyRegression(db: Database): Anomaly[] {
  const queryMs = (since: string, before?: string): number[] => {
    const beforeClause = before ? `AND created_at < ${before}` : '';
    const rows = db.prepare(`
      SELECT CAST(json_extract(payload_json,'$.finalizeDurationMs') AS INTEGER) AS ms
      FROM   audit_events
      WHERE  event_type = 'UPLOAD_FINALIZED'
        AND  created_at >= ${since} ${beforeClause}
        AND  json_extract(payload_json,'$.finalizeDurationMs') IS NOT NULL
      ORDER  BY ms ASC
    `).all() as Array<{ ms: number }>;
    return rows.map(r => r.ms).filter(v => !isNaN(v));
  };

  const currVals = queryMs("datetime('now','-4 hours')");
  const prevVals = queryMs("datetime('now','-8 hours')", "datetime('now','-4 hours')");

  if (currVals.length < 5 || prevVals.length < 5) return [];  // yetersiz veri

  const currP95 = pct(currVals, 0.95)!;
  const currP99 = pct(currVals, 0.99)!;
  const prevP95 = pct(prevVals, 0.95)!;
  const prevP99 = pct(prevVals, 0.99)!;

  const anomalies: Anomaly[] = [];
  const now = new Date().toISOString();

  if (prevP95 > 0 && currP95 > P95_MIN_MS && currP95 / prevP95 > P95_FACTOR) {
    const mult = currP95 / prevP95;
    anomalies.push({
      key:        'P95_REGRESSION:global',
      type:       'P95_REGRESSION',
      severity:   mult > P95_FACTOR * 1.5 ? 'critical' : 'warning',
      title:      'Finalize P95 Latency Regression',
      summary:    `P95 ${currP95}ms — önceki pencerenin ${mult.toFixed(1)}×'i (${prevP95}ms). Storage HEAD veya hash katmanı kontrol edilmeli.`,
      detectedAt: now,
      metrics:    { currP95, prevP95, multiplier: Math.round(mult * 10) / 10, samples: currVals.length },
    });
  }

  if (prevP99 > 0 && currP99 > P99_MIN_MS && currP99 / prevP99 > P99_FACTOR) {
    const mult = currP99 / prevP99;
    anomalies.push({
      key:        'P99_REGRESSION:global',
      type:       'P99_REGRESSION',
      severity:   'critical',   // P99 gerileme her zaman kritik
      title:      'Finalize P99 Tail Latency Critical',
      summary:    `P99 ${currP99}ms — önceki pencerenin ${mult.toFixed(1)}×'i. Tail latency sıkıştı, outlier analiz gerekiyor.`,
      detectedAt: now,
      metrics:    { currP99, prevP99, multiplier: Math.round(mult * 10) / 10, samples: currVals.length },
    });
  }

  return anomalies;
}

// ─── Severity sırası ──────────────────────────────────────────────────────────
const SEV_ORDER: Record<AnomalySeverity, number> = { critical: 0, warning: 1 };

// ─── Ana fonksiyon ────────────────────────────────────────────────────────────
/**
 * Tüm kuralları çalıştırır, aktif anomalileri severity'ye göre sıralı döndürür.
 * Non-fatal: bireysel kural hatası toplam sonucu etkilemez.
 */
export function detectAnomalies(db: Database): Anomaly[] {
  const results: Anomaly[] = [];

  const safe = <T>(fn: () => T | null | T[]): void => {
    try {
      const r = fn();
      if (!r) return;
      if (Array.isArray(r)) results.push(...r);
      else results.push(r);
    } catch (err: any) {
      console.warn('[AnomalyEngine] Kural hatası:', err?.message);
    }
  };

  safe(() => checkDenySpike(db));
  safe(() => checkOrphanSurge(db));
  safe(() => checkLatencyRegression(db));

  // Severity sırala: critical önce, sonra warning
  return results.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
}
