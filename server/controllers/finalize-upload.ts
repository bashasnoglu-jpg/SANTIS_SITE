/**
 * controllers/finalize-upload.ts
 * The Vault Seal Transaction — Sprint 2
 *
 * Gate sırası:
 *   1. Input validation (uploadId zorunlu)
 *   2. DB fetch → kayıt var mı?
 *   3. Ownership gate → tenant eşleşiyor mu?
 *   4. Status gate → sadece UPLOADING finalize olabilir
 *   5. Storage HEAD → nesne gerçekten var mı?
 *   6. Size reconciliation → beyan vs gerçek
 *   7. SHA-256 stream hash
 *   8. DB transaction: FINALIZED mühürü
 *   9. Quota reservation commit (close)
 *  10. Telemetry emit
 *
 * HTTP mapping:
 *   400 → uploadId eksik / geçersiz
 *   403 → tenant yetkisiz
 *   404 → kayıt veya storage nesnesi yok
 *   409 → status uygun değil | size mismatch
 *   500 → hash / DB / storage beklenmeyen hata
 *   200 → mühürlendi
 */

import type { Request, Response } from 'express';
import { resolveUploadIdentity }  from '../core/identity';
import { emitTelemetry }          from '../core/telemetry';
import { logAuditEvent }          from '../db/audit-log.js';
import { headStorageObject }      from '../services/storage-head';
import { computeStorageHash }     from '../services/storage-hash';
import { quotaStore }             from '../services/quota-store';

// ─── DB adaptör arayüzü (gerçek impl projeye göre inject edilir) ──────────────
// Proje Prisma kullanıyorsa: import { prisma } from '../lib/prisma'
// SQLite kullanıyorsa:       import { db } from '../lib/db'
// Bu controller DB'ye dokunmak için bu arayüzü bekler.
export interface UploadRecord {
  id:                  string;
  tenantId:            string;
  subject:             string;
  storageKey:          string;
  status:              'UPLOADING' | 'FINALIZED' | 'ORPHANED' | 'FAILED';
  byteSizeDeclared:    number;
  mimeTypeDeclared:    string;
}

export interface FinalizeResult {
  id:              string;
  status:          'FINALIZED';
  sha256Hash:      string;
  byteSizeActual:  number;
  etag:            string;
  mimeVerified:    string;
  finalizedAt:     string;
}

// Bu iki fonksiyon proje DB katmanına göre implemente edilecek
export type FetchUploadFn   = (uploadId: string) => Promise<UploadRecord | null>;
export type SealUploadFn    = (uploadId: string, data: Omit<FinalizeResult, 'id'>) => Promise<void>;

// ─── Tolerans Eşiği ──────────────────────────────────────────────────────────
// Presigned upload'da küçük metadata overhead farkları oluşabilir.
// Bu eşikten fazla sapma varsa mismatch sayarız.
const SIZE_MISMATCH_TOLERANCE_BYTES = 1_024; // 1 KB

// ─── Controller Factory ───────────────────────────────────────────────────────
/**
 * Dependency injection ile DB bağımlılığını dışarıdan al.
 * Test edilebilirlik ve provider esnekliği için.
 */
export function createFinalizeController(
  fetchUpload: FetchUploadFn,
  sealUpload:  SealUploadFn,
) {
  return async function finalizeUpload(req: Request, res: Response): Promise<void> {
    const t0       = Date.now();           // toplam süre başlangıcı
    let   tHead    = 0, tHash = 0, tDB = 0; // phase checkpoint'ler
    const identity = resolveUploadIdentity(req);
    const uploadId = (req.body?.uploadId ?? '').trim() as string;

    // ── 1. Input validation ──────────────────────────────────────────────────
    if (!uploadId) {
      res.status(400).json({ error: 'MISSING_UPLOAD_ID', message: 'uploadId is required.' });
      return;
    }

    const now = t0;

    await emitTelemetry('UPLOAD_FINALIZE_STARTED', {
      ts: now, subject: identity.subject, tenantId: identity.tenantId,
    }).catch(() => {});

    let record: UploadRecord | null = null;

    try {
      // ── 2. DB fetch ────────────────────────────────────────────────────────
      record = await fetchUpload(uploadId);
      if (!record) {
        await emitTelemetry('UPLOAD_FINALIZE_REJECTED', {
          ts: now, reason: 'RECORD_NOT_FOUND', subject: identity.subject,
        }).catch(() => {});
        logAuditEvent({
          eventType:    'UPLOAD_FINALIZE_REJECTED',
          uploadId:     uploadId,
          subject:      identity.subject,
          tenantId:     identity.tenantId,
          statusBefore: record?.status,
          payload:      { reason: 'RECORD_NOT_FOUND' },
        });
        res.status(404).json({ error: 'RECORD_NOT_FOUND', message: 'Upload record not found.' });
        return;
      }

      // ── 3. Ownership gate ─────────────────────────────────────────────────
      const requesterTenant = identity.tenantId;
      const isAdmin         = (req as any).user?.isAdmin === true;
      if (!isAdmin && record.tenantId !== requesterTenant) {
        await emitTelemetry('UPLOAD_FINALIZE_REJECTED', {
          ts: now, reason: 'UNAUTHORIZED_TENANT',
          subject: identity.subject, tenantId: identity.tenantId,
        }).catch(() => {});
        logAuditEvent({
          eventType:    'UPLOAD_FINALIZE_REJECTED',
          uploadId:     uploadId,
          subject:      identity.subject,
          tenantId:     identity.tenantId,
          statusBefore: record.status,
          payload:      { reason: 'UNAUTHORIZED_TENANT' },
        });
        res.status(403).json({ error: 'UNAUTHORIZED', message: 'Access denied.' });
        return;
      }

      // ── 4. Status gate ────────────────────────────────────────────────────
      if (record.status !== 'UPLOADING') {
        const reason = record.status === 'FINALIZED'
          ? 'ALREADY_FINALIZED'
          : `INVALID_STATUS_${record.status}`;
        await emitTelemetry('UPLOAD_FINALIZE_REJECTED', {
          ts: now, reason, subject: identity.subject,
        }).catch(() => {});
        logAuditEvent({
          eventType:    'UPLOAD_FINALIZE_REJECTED',
          uploadId:     uploadId,
          subject:      identity.subject,
          tenantId:     identity.tenantId,
          statusBefore: record.status,
          payload:      { reason },
        });
        res.status(409).json({
          error:          reason,
          message:        `Cannot finalize — current status: ${record.status}.`,
          currentStatus:  record.status,
        });
        return;
      }

      // ── 5. Storage HEAD ───────────────────────────────────────────────────
      const t5Head    = Date.now();
      const headResult = await headStorageObject(record.storageKey);
      tHead = Date.now() - t5Head;
      if (!headResult.exists) {
        await emitTelemetry('UPLOAD_FINALIZE_REJECTED', {
          ts: now, reason: 'OBJECT_NOT_IN_STORAGE',
          subject: identity.subject, storageKey: record.storageKey,
        } as any).catch(() => {});
        logAuditEvent({
          eventType:    'UPLOAD_FINALIZE_REJECTED',
          uploadId:     uploadId,
          subject:      identity.subject,
          tenantId:     identity.tenantId,
          statusBefore: record.status,
          payload:      { reason: 'OBJECT_NOT_IN_STORAGE' },
        });
        res.status(404).json({
          error:   'OBJECT_NOT_IN_STORAGE',
          message: 'File was not found in storage. Upload may have failed.',
        });
        return;
      }

      // ── 6. Size reconciliation ────────────────────────────────────────────
      const actualBytes   = headResult.contentLength;
      const declaredBytes = record.byteSizeDeclared;
      const sizeDelta     = Math.abs(actualBytes - declaredBytes);

      if (sizeDelta > SIZE_MISMATCH_TOLERANCE_BYTES) {
        await emitTelemetry('UPLOAD_FINALIZE_REJECTED', {
          ts:            now,
          reason:        'SIZE_MISMATCH',
          subject:       identity.subject,
          requestedBytes: declaredBytes,
          actualBytes,
        }).catch(() => {});
        logAuditEvent({
          eventType:    'UPLOAD_FINALIZE_REJECTED',
          uploadId:     uploadId,
          subject:      identity.subject,
          tenantId:     identity.tenantId,
          statusBefore: record.status,
          payload:      { reason: 'SIZE_MISMATCH' },
        });
        res.status(409).json({
          error:          'SIZE_MISMATCH',
          message:        'Declared and actual file sizes do not match.',
          declaredBytes,
          actualBytes,
          delta:          sizeDelta,
        });
        return;
      }

      // ── 7. SHA-256 stream hash ────────────────────────────────────────────
      const t7Hash = Date.now();
      const { sha256, byteCount } = await computeStorageHash(record.storageKey);
      tHash = Date.now() - t7Hash;

      await emitTelemetry('UPLOAD_HASH_COMPUTED', {
        ts:          now,
        subject:     identity.subject,
        actualBytes: byteCount,
      } as any).catch(() => {});

      // ── 8. DB seal (FINALIZED mühürü) ─────────────────────────────────────
      const finalizedAt = new Date(now).toISOString();
      const sealData: Omit<FinalizeResult, 'id'> = {
        status:         'FINALIZED',
        sha256Hash:     sha256,
        byteSizeActual: byteCount,
        etag:           headResult.etag,
        mimeVerified:   headResult.contentType,
        finalizedAt,
      };

      const t8DB = Date.now();
      await sealUpload(uploadId, sealData);
      tDB = Date.now() - t8DB;

      // ── 9. Quota reservation commit ───────────────────────────────────────
      // Günlük/saatlik rezervasyonu kapat; gerçek boyutu esas al.
      await quotaStore.releaseReservation({
        subject:       record.subject,
        reservedBytes: declaredBytes,
        now,
      }).catch(() => {});

      // ── 10. Telemetry (süre dahil) ────────────────────────────────────────
      const finalizeDurationMs = Date.now() - t0;
      await emitTelemetry('UPLOAD_FINALIZED', {
        ts:                  now,
        subject:             identity.subject,
        tenantId:            identity.tenantId,
        fileId:              uploadId,
        actualBytes:         byteCount,
        requestedBytes:      declaredBytes,
        sha256,
        finalizeDurationMs,
        storageHeadMs:       tHead,
        hashComputeMs:       tHash,
        dbCommitMs:          tDB,
      }).catch(() => {});

      logAuditEvent({
        eventType:    'UPLOAD_FINALIZED',
        uploadId:     uploadId,
        fileId:       record.id,
        subject:      identity.subject,
        tenantId:     identity.tenantId,
        statusBefore: 'UPLOADING',
        statusAfter:  'FINALIZED',
        payload:      { sha256, byteSizeActual: byteCount, etag: headResult.etag },
      });

      // ── Başarı ────────────────────────────────────────────────────────────
      res.status(200).json({
        uploadId,
        ...sealData,
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown_error';

      await emitTelemetry('UPLOAD_FINALIZE_ERROR', {
        ts:      now,
        subject: identity.subject,
        message,
      }).catch(() => {});

      logAuditEvent({
        eventType: 'UPLOAD_FINALIZE_ERROR',
        uploadId:  uploadId,
        subject:   identity.subject,
        payload:   { message },
      });

      console.error('[Finalize] Beklenmeyen hata:', message, err);

      // Storage/hash geçici hatası olabilir → 503
      if (message.startsWith('storage_')) {
        res.status(503).json({
          error:   'STORAGE_UNAVAILABLE',
          message: 'Could not verify file. Please retry.',
        });
        return;
      }

      res.status(500).json({
        error:   'FINALIZE_FAILED',
        message: 'Internal error during finalization.',
      });
    }
  };
}
