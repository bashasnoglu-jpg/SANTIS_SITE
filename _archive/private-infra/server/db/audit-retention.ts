/**
 * db/audit-retention.ts
 * Stabilization Pass — Audit DB Compaction Worker
 *
 * Görev: audit_events tablosundan belirli bir yaşı geçen satırları siler.
 * incident_state: RESOLVED olanlar 30 gün → RESOLVED_ARCHIVED olarak işaretlenir,
 *                 90 gün sonra tamamen silinir.
 *
 * Çalıştırma: server.js veya Reaper ile aynı scheduler'dan tetikle.
 *
 *   import { runAuditRetention } from './db/audit-retention.js';
 *   setInterval(runAuditRetention, 6 * 60 * 60 * 1_000); // 6 saatte bir
 *
 * Env değişkenleri:
 *   AUDIT_RETENTION_DAYS          → audit_events saklanma süresi (default: 90)
 *   AUDIT_INCIDENT_ARCHIVE_DAYS   → RESOLVED incident arşiv süresi (default: 30)
 *   AUDIT_INCIDENT_DELETE_DAYS    → RESOLVED incident silme süresi (default: 90)
 */

import { getAuditDb } from './sqlite-audit.js';

const RETENTION_DAYS         = Number(process.env.AUDIT_RETENTION_DAYS        ?? 90);
const INCIDENT_ARCHIVE_DAYS  = Number(process.env.AUDIT_INCIDENT_ARCHIVE_DAYS ?? 30);
const INCIDENT_DELETE_DAYS   = Number(process.env.AUDIT_INCIDENT_DELETE_DAYS  ?? 90);

export interface RetentionResult {
  eventsDeleted:            number;
  incidentsArchived:        number;
  incidentsDeleted:         number;
  sizeBeforeBytes:          number;
  sizeAfterBytes:           number;
  durationMs:               number;
  ranAt:                    string;
}

/**
 * Tek pass — transactional, non-fatal.
 * Hata olursa log yaz, caller'ı etkileme.
 */
export async function runAuditRetention(): Promise<RetentionResult | null> {
  const t0  = Date.now();
  const now = new Date().toISOString();

  try {
    const db = getAuditDb();

    // DB boyutunu al (WAL dahil)
    const sizeBeforeRow = db.prepare(
      `SELECT page_count * page_size AS sz FROM pragma_page_count(), pragma_page_size()`
    ).get() as { sz: number } | undefined;
    const sizeBefore = sizeBeforeRow?.sz ?? 0;

    const result = db.transaction((): Omit<RetentionResult, 'sizeAfterBytes' | 'durationMs' | 'ranAt' | 'sizeBeforeBytes'> => {
      // 1. Eski audit_events sil
      const eventsResult = db.prepare(`
        DELETE FROM audit_events
        WHERE created_at < datetime('now', '-${RETENTION_DAYS} days')
      `).run();

      // 2. Eski RESOLVED incident'leri arşivle (status güncelle)
      const archiveResult = db.prepare(`
        UPDATE incident_state
        SET status = 'RESOLVED_ARCHIVED'
        WHERE status    = 'RESOLVED'
          AND resolved_at < datetime('now', '-${INCIDENT_ARCHIVE_DAYS} days')
      `).run();

      // 3. Çok eski arşivlenmiş incident'leri sil
      const deleteResult = db.prepare(`
        DELETE FROM incident_state
        WHERE status    = 'RESOLVED_ARCHIVED'
          AND resolved_at < datetime('now', '-${INCIDENT_DELETE_DAYS} days')
      `).run();

      return {
        eventsDeleted:     eventsResult.changes,
        incidentsArchived: archiveResult.changes,
        incidentsDeleted:  deleteResult.changes,
      };
    })();

    // WAL checkpoint — silinenleri dosyaya işle
    db.pragma('wal_checkpoint(PASSIVE)');

    const sizeAfterRow = db.prepare(
      `SELECT page_count * page_size AS sz FROM pragma_page_count(), pragma_page_size()`
    ).get() as { sz: number } | undefined;
    const sizeAfter = sizeAfterRow?.sz ?? 0;

    const final: RetentionResult = {
      ...result,
      sizeBeforeBytes: sizeBefore,
      sizeAfterBytes:  sizeAfter,
      durationMs:      Date.now() - t0,
      ranAt:           now,
    };

    console.log('[AuditRetention] Compaction tamamlandı:', {
      eventsDeleted:     final.eventsDeleted,
      incidentsArchived: final.incidentsArchived,
      incidentsDeleted:  final.incidentsDeleted,
      freedBytes:        sizeBefore - sizeAfter,
      durationMs:        final.durationMs,
    });

    return final;
  } catch (err: any) {
    // Non-fatal — sadece logla
    console.error('[AuditRetention] Compaction hatası:', err?.message);
    return null;
  }
}
