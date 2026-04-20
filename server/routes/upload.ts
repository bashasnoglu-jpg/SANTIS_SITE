/**
 * routes/upload.ts
 * Upload endpoint'lerini bağlar.
 *
 * POST /api/upload/init      → enforceUploadPolicy → generatePresignedUrl
 * POST /api/upload/finalize  → Vault Seal Transaction (Sprint 2)
 * POST /api/upload/abort     → rezervasyonu serbest bırak
 */

import { Router, type Request, type Response } from 'express';
import { enforceUploadPolicy }     from '../middleware/enforce-upload-policy';
import { quotaStore }              from '../services/quota-store';
import { emitTelemetry }           from '../core/telemetry';
import {
  createFinalizeController,
  type UploadRecord,
  type FinalizeResult,
} from '../controllers/finalize-upload';

const router = Router();

// ─── DB Stub (gerçek Prisma/SQLite impl ile değiştirilecek) ──────────────────
// Proje Prisma kullanıyorsa:
//   import { prisma } from '../lib/prisma';
//   const fetchUpload = (id: string) => prisma.sovereignAsset.findUnique({ where: { id } });
//   const sealUpload  = (id: string, data) => prisma.sovereignAsset.update({ where: { id }, data });
async function fetchUpload(uploadId: string): Promise<UploadRecord | null> {
  // DB_STUB: prisma.sovereignAsset.findUnique({ where: { id: uploadId } })
  console.warn('[upload.ts] fetchUpload stub — gerçek DB bağlantısı gerekiyor. id:', uploadId);
  return null;
}
async function sealUpload(uploadId: string, data: Omit<FinalizeResult, 'id'>): Promise<void> {
  // DB_STUB: prisma.sovereignAsset.update({ where: { id: uploadId }, data })
  console.warn('[upload.ts] sealUpload stub — gerçek DB bağlantısı gerekiyor. id:', uploadId, data);
}

// ─── Controller bağla ─────────────────────────────────────────────────────────
const finalizeUpload = createFinalizeController(fetchUpload, sealUpload);

router.post('/init', enforceUploadPolicy, async (req: Request, res: Response) => {
  try {
    const { identity, requestedBytes } = req.uploadCtx!;

    // TODO Sprint 2: Gerçek S3/R2 presigned URL üretimi
    const fileId      = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const presignedUrl = `https://storage.example.com/upload/${fileId}?sig=MOCK`;

    // DB kaydı: status = UPLOADING (gerçek impl burada olacak)
    console.log(`[Upload] TICKETED — fileId: ${fileId} | subject: ${identity.subject} | bytes: ${requestedBytes}`);

    res.status(200).json({
      fileId,
      presignedUrl,
      expiresIn: 900, // 15 dakika (reservationTtlSec ile eşleşmeli)
    });

  } catch (err) {
    res.status(500).json({ error: 'INIT_FAILED', message: 'Could not generate upload ticket.' });
  }
});

// ─── POST /api/upload/finalize ───────────────────────────────────────────────
// Vault Seal Transaction: HEAD → size → SHA-256 → DB seal → quota commit
router.post('/finalize', finalizeUpload);


// ─── POST /api/upload/abort ───────────────────────────────────────────────────
// İstemci iptal ederse rezervasyonu geri ver
router.post('/abort', async (req: Request, res: Response) => {
  const { fileId, fileSize } = req.body ?? {};
  if (!fileId) {
    res.status(400).json({ error: 'MISSING_FILE_ID' });
    return;
  }

  // Kota rezervasyonunu iade et
  if (req.uploadCtx) {
    await quotaStore.releaseReservation({
      subject:       req.uploadCtx.identity.subject,
      reservedBytes: req.uploadCtx.requestedBytes,
      now:           Date.now(),
    }).catch(() => {});
  }

  res.status(200).json({ fileId, status: 'ABORTED' });
});

export default router;
