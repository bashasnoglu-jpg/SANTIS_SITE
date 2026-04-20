/**
 * services/storage-head.ts
 * Storage nesnesinin var olup olmadığını ve metadata'sını doğrular.
 * Provider: Cloudflare R2 (S3-compat) — AWS S3 ile aynı API.
 */

import { S3Client, HeadObjectCommand, type HeadObjectCommandOutput } from '@aws-sdk/client-s3';

// ─── S3 İstemcisi (R2 / S3 uyumlu) ──────────────────────────────────────────
function buildS3Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT ?? process.env.S3_ENDPOINT;
  return new S3Client({
    region:      process.env.S3_REGION ?? 'auto',
    endpoint,
    credentials: {
      accessKeyId:     process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    // R2 için path-style zorunlu
    forcePathStyle: !!endpoint,
  });
}

let _client: S3Client | null = null;
function getClient(): S3Client {
  if (!_client) _client = buildS3Client();
  return _client;
}

// ─── Tipler ───────────────────────────────────────────────────────────────────
export interface StorageObjectMeta {
  exists:       true;
  contentType:  string;
  contentLength: number;   // bytes
  etag:         string;
  lastModified: Date;
}

export interface StorageObjectMissing {
  exists: false;
}

export type StorageHeadResult = StorageObjectMeta | StorageObjectMissing;

// ─── HEAD İsteği ─────────────────────────────────────────────────────────────
/**
 * Storage'da nesne var mı? Varsa metadata'sını döner.
 * @param storageKey  R2/S3 object key (örn: "uploads/upl_123abc/photo.jpg")
 */
export async function headStorageObject(storageKey: string): Promise<StorageHeadResult> {
  const bucket = process.env.S3_BUCKET!;

  let head: HeadObjectCommandOutput;
  try {
    head = await getClient().send(
      new HeadObjectCommand({ Bucket: bucket, Key: storageKey })
    );
  } catch (err: any) {
    // 404 → nesne yok
    if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    // Diğer hatalar → yukarıya ilet (503)
    throw new Error(`storage_head_failed: ${err?.message ?? 'unknown'}`);
  }

  return {
    exists:        true,
    contentType:   head.ContentType  ?? 'application/octet-stream',
    contentLength: head.ContentLength ?? 0,
    etag:          (head.ETag ?? '').replace(/"/g, ''), // ETag'ı tırnak işaretlerinden arındır
    lastModified:  head.LastModified ?? new Date(),
  };
}
