import { createHash } from "node:crypto";
import { dbVault } from "../santis-db-vault.js";

const DEFAULT_SEAL_TTL_MS = 60 * 60 * 1000;

export type UploadSealAcquireReason =
  | "SEAL_NOT_FOUND"
  | "SEAL_EXPIRED"
  | "SEAL_IN_USE"
  | "TOKEN_MISMATCH"
  | "ASSET_MISMATCH";

export type UploadSealAcquireResult =
  | {
      ok: true;
      record: {
          assetId: string;
          tenantId: string;
          checksumSha256?: string;
          createdAt: number;
          expiresAt: number;
      };
    }
  | {
      ok: false;
      reason: UploadSealAcquireReason;
    };

type RegisterInput = {
  uploadId: string;
  rawToken: string;
  assetId: string;
  tenantId: string;
  checksumSha256?: string | null;
  ttlMs?: number;
};

type AcquireInput = {
  uploadId: string;
  rawToken: string;
  assetId: string;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const hashToken = (rawToken: string) =>
  createHash("sha256").update(rawToken).digest("hex");

export const UploadRegistry = {
  async register({
    uploadId,
    rawToken,
    assetId,
    tenantId,
    checksumSha256,
    ttlMs = DEFAULT_SEAL_TTL_MS,
  }: RegisterInput): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    const tokenHash = hashToken(rawToken);
    const checksum = normalizeOptionalString(checksumSha256) || null;

    const query = `
      INSERT INTO sovereign_upload_seals 
      (upload_id, asset_id, tenant_id, token_hash, checksum_sha256, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (upload_id) DO UPDATE SET 
        asset_id = EXCLUDED.asset_id,
        tenant_id = EXCLUDED.tenant_id,
        token_hash = EXCLUDED.token_hash,
        checksum_sha256 = EXCLUDED.checksum_sha256,
        is_locked = false,
        expires_at = EXCLUDED.expires_at,
        created_at = CURRENT_TIMESTAMP
    `;
    await dbVault.query(query, [uploadId, assetId, tenantId, tokenHash, checksum, expiresAt]);
  },

  async acquire({ uploadId, rawToken, assetId }: AcquireInput): Promise<UploadSealAcquireResult> {
    // 1. Önce kaydı çek ve TTL kontrolünü yap.
    const selQuery = `SELECT * FROM sovereign_upload_seals WHERE upload_id = $1`;
    const res = await dbVault.query(selQuery, [uploadId]);
    if (res.rowCount === 0) {
      return { ok: false, reason: "SEAL_NOT_FOUND" };
    }

    const record = res.rows[0];

    // Zaman aşımı kontrolü (JS tarafında da yapılabilir)
    if (new Date(record.expires_at).getTime() <= Date.now()) {
      await this.consume(uploadId);
      return { ok: false, reason: "SEAL_EXPIRED" };
    }

    // Token Hash Karşılaştırma
    if (record.token_hash !== hashToken(rawToken)) {
      return { ok: false, reason: "TOKEN_MISMATCH" };
    }

    // Asset Mismatch
    if (record.asset_id !== assetId) {
      return { ok: false, reason: "ASSET_MISMATCH" };
    }

    // Eğer zaten kilitliyse (başka bir process içeri girmişse)
    if (record.is_locked) {
      return { ok: false, reason: "SEAL_IN_USE" };
    }

    // 2. Kilidi "Atomik" olarak Al (Concurrency için UPDATE koşulu)
    const lockQuery = `
      UPDATE sovereign_upload_seals
      SET is_locked = true
      WHERE upload_id = $1 AND is_locked = false
      RETURNING *;
    `;
    const lockRes = await dbVault.query(lockQuery, [uploadId]);

    // Race condition: biz SELECT ettikten hemen sonra başka bir process UPDATE ettiyse rowCount 0 döner.
    if (lockRes.rowCount === 0) {
      return { ok: false, reason: "SEAL_IN_USE" };
    }

    const lockedRecord = lockRes.rows[0];

    return {
      ok: true,
      record: {
        assetId: lockedRecord.asset_id,
        tenantId: lockedRecord.tenant_id,
        checksumSha256: lockedRecord.checksum_sha256 || undefined,
        createdAt: new Date(lockedRecord.created_at).getTime(),
        expiresAt: new Date(lockedRecord.expires_at).getTime(),
      },
    };
  },

  async release(uploadId: string): Promise<void> {
    const query = `UPDATE sovereign_upload_seals SET is_locked = false WHERE upload_id = $1`;
    await dbVault.query(query, [uploadId]);
  },

  async consume(uploadId: string): Promise<void> {
    const query = `DELETE FROM sovereign_upload_seals WHERE upload_id = $1`;
    await dbVault.query(query, [uploadId]);
  },
};
