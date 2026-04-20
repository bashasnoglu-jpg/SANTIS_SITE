// server/santis-reaper.js — v2.0 (Governor-aware)
//
// Lifecycle kapatma:
//   UPLOADING (expired) → deleteObject → releaseReservation → ORPHANED → telemetry
//
// Değişiklikler (v1 → v2):
//   + Optimistic claim lock (REAPING ara durumu — concurrent reaper güvenliği)
//   + quotaStore.releaseReservation() — kota sahte doluluk engellemesi
//   + orphaned_at + orphan_reason alanları DB'ye yazılıyor
//   + emitTelemetry('UPLOAD_ORPHAN_REAPED') + ('REAPER_ERROR')
//   + Batch limiti (max 100/döngü — büyük birikimde flood önleme)
//   + S3 idempotency: NoSuchKey hatası fatal sayılmıyor
//   + Strict mod: storage delete veya reservation release patlarsa ORPHANED yapılmıyor

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { dbVault }    from './santis-db-vault.js';
import { quotaStore } from './services/quota-store.js';
import { emitTelemetry } from './core/telemetry.js';
import { logAuditEvent } from './db/audit-log.js';

// ─── S3 İstemcisi ─────────────────────────────────────────────────────────────
const s3Client = new S3Client({
    region:      process.env.S3_REGION    || 'auto',
    endpoint:    process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId:     process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'sovereign-vault';

// ─── S3 Sil (idempotent) ─────────────────────────────────────────────────────
async function deleteObjectIfExists(objectKey) {
    try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: objectKey }));
    } catch (err) {
        // NoSuchKey → zaten silinmiş, idempotent geç
        if (err?.Code === 'NoSuchKey' || err?.name === 'NoSuchKey') return;
        throw err; // Gerçek hata → yukarıya ilet (strict mod)
    }
}

// ─── DB: Claim Lock (UPLOADING → REAPING) ─────────────────────────────────────
// Aynı kaydı iki paralel Reaper instance'ının işlemesini engeller.
async function claimUpload(id) {
    const result = await dbVault.query(`
        UPDATE sovereign_assets
        SET    status     = 'REAPING',
               updated_at = NOW()
        WHERE  id         = $1
          AND  status     = 'UPLOADING'
        RETURNING id;
    `, [id]);
    return result.rows.length > 0; // false → başka biri aldı
}

// ─── DB: ORPHANED mühürü ──────────────────────────────────────────────────────
async function markOrphaned(id) {
    await dbVault.query(`
        UPDATE sovereign_assets
        SET status       = 'ORPHANED',
            orphaned_at  = NOW(),
            orphan_reason = 'UPLOAD_EXPIRED'
        WHERE id = $1;
    `, [id]);
}

// ─── DB: REAPING → UPLOADING geri al (rollback) ───────────────────────────────
async function unclaimUpload(id) {
    await dbVault.query(`
        UPDATE sovereign_assets
        SET status = 'UPLOADING', updated_at = NOW()
        WHERE id = $1;
    `, [id]);
}

// ─── Ana Reaper Sınıfı ────────────────────────────────────────────────────────
export class SovereignReaper {
    static async execute() {
        const startedAt = new Date().toISOString();
        console.log(`\n[THE REAPER] Uyanıyor. Hayalet vizeler taranıyor... (${startedAt})`);

        let reaped = 0;
        let failed = 0;

        try {
            // ── 1. Expired UPLOADING kayıtları çek (batch 100, lock için FOR UPDATE SKIP LOCKED)
            //    subject + byte_size_declared → quota release için zorunlu
            const { rows: orphans } = await dbVault.query(`
                SELECT id,
                       file_id,
                       object_key,
                       visitor_id,
                       subject,
                       tenant_id,
                       byte_size_declared
                FROM   sovereign_assets
                WHERE  status      = 'UPLOADING'
                  AND  created_at  < NOW() - INTERVAL '1 hour'
                ORDER  BY created_at ASC
                LIMIT  100
                FOR UPDATE SKIP LOCKED;
            `);

            if (orphans.length === 0) {
                console.log('[THE REAPER] Sistem temiz. Hayalet bulunamadı. Uyku moduna geçiliyor.');
                return;
            }

            console.log(`[THE REAPER] ${orphans.length} adet hayalet tespit edildi. İnfaz protokolü başlatılıyor...`);

            // ── 2. Her kayıt için işlem döngüsü
            for (const orphan of orphans) {
                try {
                    // A. Optimistic claim — race condition koruması
                    const claimed = await claimUpload(orphan.id);
                    if (!claimed) {
                        console.log(`   [SKIP] ${orphan.file_id} — başka worker aldı.`);
                        continue;
                    }

                    // B. Storage object sil (STRICT: hata olursa rollback, ORPHANED yapma)
                    try {
                        await deleteObjectIfExists(orphan.object_key);
                    } catch (storageErr) {
                        await unclaimUpload(orphan.id);
                        await emitTelemetry('REAPER_ERROR', {
                            ts:      Date.now(),
                            fileId:  orphan.file_id,
                            message: `storage_delete_failed: ${storageErr?.message ?? 'unknown'}`,
                        }).catch(() => {});
                        console.error(`   [FAILED-STORAGE] ${orphan.file_id}:`, storageErr?.message);
                        failed++;
                        continue;
                    }

                    // C. Quota reservation release (STRICT: hata olursa rollback)
                    try {
                        await quotaStore.releaseReservation({
                            subject:       orphan.subject || `visitor:${orphan.tenant_id}:${orphan.visitor_id}`,
                            reservedBytes: orphan.byte_size_declared || 0,
                            now:           Date.now(),
                        });
                    } catch (quotaErr) {
                        await unclaimUpload(orphan.id);
                        await emitTelemetry('REAPER_ERROR', {
                            ts:      Date.now(),
                            fileId:  orphan.file_id,
                            message: `quota_release_failed: ${quotaErr?.message ?? 'unknown'}`,
                        }).catch(() => {});
                        console.error(`   [FAILED-QUOTA] ${orphan.file_id}:`, quotaErr?.message);
                        failed++;
                        continue;
                    }

                    // D. DB mühürü: ORPHANED
                    await markOrphaned(orphan.id);

                    // E. Telemetry
                    await emitTelemetry('UPLOAD_ORPHAN_REAPED', {
                        ts:             Date.now(),
                        fileId:         orphan.file_id,
                        subject:        orphan.subject || orphan.visitor_id,
                        tenantId:       orphan.tenant_id,
                        requestedBytes: orphan.byte_size_declared || 0,
                    }).catch(() => {});

                    logAuditEvent({
                        eventType:    'UPLOAD_ORPHAN_REAPED',
                        uploadId:     orphan.id,
                        fileId:       orphan.file_id,
                        subject:      orphan.subject || orphan.visitor_id,
                        tenantId:       orphan.tenant_id,
                        statusBefore: 'UPLOADING',
                        statusAfter:  'ORPHANED',
                        payload:      { bytesReleased: orphan.byte_size_declared, storageKey: orphan.object_key },
                    });

                    console.log(`   [KILLED] FileID: ${orphan.file_id} | Subject: ${orphan.subject || orphan.visitor_id} | Bytes released: ${orphan.byte_size_declared ?? 0}`);
                    reaped++;

                } catch (err) {
                    // Beklenmeyen hata — işlem yarıda kaldıysa REAPING takılı kalır;
                    // bir sonraki döngüde FOR UPDATE SKIP LOCKED atlar.
                    await emitTelemetry('REAPER_ERROR', {
                        ts:      Date.now(),
                        fileId:  orphan.file_id,
                        message: err?.message ?? 'unknown_error',
                    }).catch(() => {});
                    
                    logAuditEvent({
                        eventType: 'REAPER_ERROR',
                        uploadId:  orphan?.id,
                        payload:   { message: err?.message ?? 'unknown_error' },
                    });
                    console.error(`   [ERROR] ${orphan.file_id}:`, err?.message);
                    failed++;
                }
            }

            console.log(`[THE REAPER] Operasyon tamamlandı. ✅ ${reaped} temizlendi | ❌ ${failed} başarısız.`);

        } catch (fatalError) {
            console.error('[THE REAPER] Sistem Hatası. Tırpan takıldı:', fatalError);
            await emitTelemetry('REAPER_ERROR', {
                ts:      Date.now(),
                message: fatalError?.message ?? 'fatal_reaper_error',
            }).catch(() => {});
        }
    }

    static start(intervalMinutes = 60) {
        const intervalMs = intervalMinutes * 60 * 1000;
        console.log(`[SOVEREIGN CORE] The Reaper v2.0 Protokolü devrede. Her ${intervalMinutes} dakikada bir çalışacak. ☠️🧹`);
        this.execute();
        setInterval(() => this.execute(), intervalMs);
    }
}

SovereignReaper.start(60);
