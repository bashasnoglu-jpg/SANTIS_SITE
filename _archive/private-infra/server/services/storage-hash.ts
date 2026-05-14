/**
 * services/storage-hash.ts
 * Storage nesnesini stream ederek SHA-256 hesaplar.
 * GPU / Ana thread kullanmaz — Node.js crypto stream pipeline'ı.
 *
 * Neden stream? 20 MB'ı belleğe almak yerine chunk'lar halinde
 * işleyip bellek baskısını sıfır tutar.
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createHash }                  from 'node:crypto';
import { pipeline }                    from 'node:stream/promises';
import { Writable }                    from 'node:stream';

// ─── Paylaşılan istemci (storage-head.ts ile aynı pattern) ───────────────────
function buildS3Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT ?? process.env.S3_ENDPOINT;
  return new S3Client({
    region:         process.env.S3_REGION ?? 'auto',
    endpoint,
    credentials: {
      accessKeyId:     process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: !!endpoint,
  });
}

let _client: S3Client | null = null;
function getClient(): S3Client {
  if (!_client) _client = buildS3Client();
  return _client;
}

// ─── Sonuç Tipi ───────────────────────────────────────────────────────────────
export interface HashResult {
  sha256:     string;   // hex digest
  byteCount:  number;   // stream sırasında sayılan gerçek boyut
}

// ─── SHA-256 Stream Hesaplama ─────────────────────────────────────────────────
/**
 * S3/R2 nesnesini stream edip SHA-256 + gerçek boyut hesaplar.
 * @param storageKey  Object key (örn: "uploads/upl_123abc/photo.jpg")
 * @returns           { sha256, byteCount }
 * @throws            storage_hash_failed: <mesaj>
 */
export async function computeStorageHash(storageKey: string): Promise<HashResult> {
  const bucket = process.env.S3_BUCKET!;

  let objectStream: NodeJS.ReadableStream;
  try {
    const response = await getClient().send(
      new GetObjectCommand({ Bucket: bucket, Key: storageKey })
    );
    // AWS SDK v3: Body is a readable stream (Node.js)
    objectStream = response.Body as NodeJS.ReadableStream;
  } catch (err: any) {
    throw new Error(`storage_hash_failed: cannot_fetch: ${err?.message ?? 'unknown'}`);
  }

  const hash      = createHash('sha256');
  let byteCount   = 0;

  // Sink: hash'e besle + byte sayacı tut
  const sink = new Writable({
    write(chunk: Buffer, _enc, cb) {
      byteCount += chunk.byteLength;
      hash.update(chunk);
      cb();
    },
  });

  try {
    await pipeline(objectStream as any, sink);
  } catch (err: any) {
    throw new Error(`storage_hash_failed: stream_error: ${err?.message ?? 'unknown'}`);
  }

  return {
    sha256:    hash.digest('hex'),
    byteCount,
  };
}
