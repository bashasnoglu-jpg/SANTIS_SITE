/**
 * middleware/enforce-upload-policy.ts
 * Upload Admission Control — tek giriş noktası.
 *
 * Kontrol sırası:
 *   1. fileSize sanity (pozitif, integer, max sınırı)
 *   2. Identity resolve
 *   3. Quota checkAndReserve (burst + hourly + daily)
 *   4. Telemetry emit
 *   5. next() — req.uploadCtx ile downstream'e kimlik ve boyutu taşı
 *
 * Davranış: FAIL-CLOSED
 *   Governor unavailable → 503 döner, upload açılmaz.
 *   Telemetry hatası → non-blocking, upload etkilenmez.
 *
 * HTTP status mapping:
 *   400 → geçersiz fileSize
 *   413 → dosya boyutu politikayı aşıyor
 *   429 → rate veya quota aşımı (Retry-After header eklenir)
 *   503 → governor unavailable (geçici hizmet dışı)
 */

import type { Request, Response, NextFunction } from 'express';
import { resolveUploadIdentity, type UploadIdentity } from '../core/identity';
import { UPLOAD_POLICY } from '../core/upload-policy';
import { quotaStore } from '../services/quota-store';
import { emitTelemetry } from '../core/telemetry';
import { logAuditEvent, upsertIncident } from '../db/audit-log.js';

// req üzerine attach edilen context — downstream controller okur
export interface UploadContext {
  identity:       UploadIdentity;
  requestedBytes: number;
}

// Express Request'e uploadCtx tipini ekle
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      uploadCtx?: UploadContext;
    }
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export async function enforceUploadPolicy(
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  const now = Date.now();

  try {
    // ── 1. fileSize sanity ──────────────────────────────────────────────────
    const rawSize       = req.body?.fileSize;
    const requestedBytes = Number.isFinite(Number(rawSize)) ? Math.floor(Number(rawSize)) : -1;

    if (requestedBytes <= 0) {
      res.status(400).json({
        error:   'INVALID_FILE_SIZE',
        message: 'fileSize must be a positive integer (bytes).',
      });
      return;
    }

    if (requestedBytes > UPLOAD_POLICY.maxFileBytes) {
      await emitTelemetry('UPLOAD_DENIED', {
        ts:             now,
        reason:         'FILE_TOO_LARGE',
        requestedBytes,
      }).catch(() => {});

      res.status(413).json({
        error:   'FILE_TOO_LARGE',
        message: `Max file size is ${UPLOAD_POLICY.maxFileBytes} bytes (${UPLOAD_POLICY.maxFileBytes / 1_048_576} MB).`,
      });
      return;
    }

    // ── 2. Identity resolve ─────────────────────────────────────────────────
    const identity = resolveUploadIdentity(req);

    // ── 3. Quota check ──────────────────────────────────────────────────────
    const decision = await quotaStore.checkAndReserve({
      subject:        identity.subject,
      requestedBytes,
      now,
    });

    if (!decision.ok) {
      await emitTelemetry('UPLOAD_DENIED', {
        ts:             now,
        reason:         decision.reason,
        subject:        identity.subject,
        tenantId:       identity.tenantId,
        sourceIp:       identity.sourceIp,
        requestedBytes,
      }).catch(() => {});

      logAuditEvent({
        eventType:  'UPLOAD_DENIED',
        subject:    identity.subject,
        tenantId:   identity.tenantId,
        sourceIp:   identity.sourceIp,
        payload:    { reason: decision.reason, requestedBytes },
      });

      upsertIncident({
        incidentType: 'UPLOAD_DENIED',
        subject:      identity.subject,
        tenantId:     identity.tenantId,
        payload:      { reason: decision.reason },
      });

      if (decision.retryAfterSec) {
        res.setHeader('Retry-After', String(decision.retryAfterSec));
      }

      res.status(decision.code).json({
        error:      decision.reason,
        message:    'Upload admission denied.',
        retryAfter: decision.retryAfterSec,
      });
      return;
    }

    // ── 4. Kabul — context'i downstream'e taşı ─────────────────────────────
    req.uploadCtx = { identity, requestedBytes };

    await emitTelemetry('UPLOAD_INIT_ACCEPTED', {
      ts:             now,
      subject:        identity.subject,
      tenantId:       identity.tenantId,
      sourceIp:       identity.sourceIp,
      requestedBytes,
    }).catch(() => {});

    next();

  } catch (err) {
    // Governor unavailable → fail-closed
    const message = err instanceof Error ? err.message : 'unknown_error';

    await emitTelemetry('UPLOAD_GOVERNOR_ERROR', {
      ts:      now,
      message,
    }).catch(() => {});

    logAuditEvent({
      eventType: 'UPLOAD_GOVERNOR_ERROR',
      subject:   req.uploadCtx?.identity?.subject,
      payload:   { message },
    });

    console.error('[UploadGovernor] Kritik hata — fail-closed:', message);

    res.status(503).json({
      error:   'UPLOAD_GOVERNOR_UNAVAILABLE',
      message: 'Upload policy layer is temporarily unavailable. Please retry.',
    });
  }
}
