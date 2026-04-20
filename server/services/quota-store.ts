/**
 * services/quota-store.ts
 * Redis destekli quota deposu — in-memory fallback ile.
 *
 * Redis yoksa (local dev) Map tabanlı in-memory store devreye girer.
 * Production'da REDIS_URL env değişkeni set edilmelidir.
 *
 * Tüm sayaçlar atomik INCRBY + EXPIRE kombinasyonuyla yönetilir.
 * INCR → EXPIRE yarış durumunu önlemek için SET NX + TTL tek adımda yapılır.
 */

import { UPLOAD_POLICY } from '../core/upload-policy';

// ─── Karar Tipleri ────────────────────────────────────────────────────────────
export type QuotaDecision =
  | { ok: true }
  | { ok: false; code: number; reason: string; retryAfterSec?: number };

export interface QuotaStore {
  /**
   * Kota kontrolü yap ve başarılıysa rezervasyon aç.
   * Fail → QuotaDecision.ok = false
   */
  checkAndReserve(params: {
    subject:        string;
    requestedBytes: number;
    now:            number;
  }): Promise<QuotaDecision>;

  /**
   * Upload iptal veya Reaper temizliği sonrası rezervasyonu geri ver.
   */
  releaseReservation(params: {
    subject:       string;
    reservedBytes: number;
    now:           number;
  }): Promise<void>;
}

// ─── In-Memory Store (dev / fallback) ────────────────────────────────────────
interface MemEntry { value: number; expiresAt: number }

class InMemoryQuotaStore implements QuotaStore {
  private store = new Map<string, MemEntry>();

  private get(key: string, now: number): number {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt <= now) return 0;
    return entry.value;
  }

  private set(key: string, value: number, ttlSec: number, now: number): void {
    this.store.set(key, { value, expiresAt: now + ttlSec * 1_000 });
  }

  async checkAndReserve({ subject, requestedBytes, now }: {
    subject: string; requestedBytes: number; now: number;
  }): Promise<QuotaDecision> {
    // ── Burst: dakikada istek sayısı ──────────────────────────────────────────
    const rpmKey     = `rpm:${subject}`;
    const rpmCurrent = this.get(rpmKey, now);

    if (rpmCurrent >= UPLOAD_POLICY.maxRequestsPerMinute) {
      return {
        ok:             false,
        code:           429,
        reason:         'RATE_LIMIT_EXCEEDED',
        retryAfterSec:  UPLOAD_POLICY.rateLimitWindowSec,
      };
    }
    this.set(rpmKey, rpmCurrent + 1, UPLOAD_POLICY.rateLimitWindowSec, now);

    // ── Saatlik byte kotası ───────────────────────────────────────────────────
    const hourKey     = `bytes_hour:${subject}`;
    const hourCurrent = this.get(hourKey, now);

    if (hourCurrent + requestedBytes > UPLOAD_POLICY.maxBytesPerHour) {
      return {
        ok:             false,
        code:           429,
        reason:         'HOURLY_QUOTA_EXCEEDED',
        retryAfterSec:  UPLOAD_POLICY.hourlyWindowSec,
      };
    }
    this.set(hourKey, hourCurrent + requestedBytes, UPLOAD_POLICY.hourlyWindowSec, now);

    // ── Günlük byte kotası ────────────────────────────────────────────────────
    const dayKey     = `bytes_day:${subject}`;
    const dayCurrent = this.get(dayKey, now);

    if (dayCurrent + requestedBytes > UPLOAD_POLICY.maxBytesPerDay) {
      return {
        ok:     false,
        code:   429,
        reason: 'DAILY_QUOTA_EXCEEDED',
        retryAfterSec: UPLOAD_POLICY.dailyWindowSec,
      };
    }
    this.set(dayKey, dayCurrent + requestedBytes, UPLOAD_POLICY.dailyWindowSec, now);

    return { ok: true };
  }

  async releaseReservation({ subject, reservedBytes, now }: {
    subject: string; reservedBytes: number; now: number;
  }): Promise<void> {
    for (const prefix of ['bytes_hour', 'bytes_day']) {
      const key     = `${prefix}:${subject}`;
      const current = this.get(key, now);
      const entry   = this.store.get(key);
      if (entry) {
        entry.value = Math.max(0, current - reservedBytes);
      }
    }
  }
}

// ─── Redis Store (production) ─────────────────────────────────────────────────
class RedisQuotaStore implements QuotaStore {
  private client: any; // ioredis veya @redis/client

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  /**
   * Atomik INCR: SET key 0 EX ttl NX sonra INCRBY.
   * Yarış durumunu önler.
   */
  private async atomicIncrBy(key: string, delta: number, ttlSec: number): Promise<number> {
    // SET key 0 EX ttl NX → sadece yoksa oluştur
    await this.client.set(key, 0, 'EX', ttlSec, 'NX');
    return await this.client.incrby(key, delta);
  }

  async checkAndReserve({ subject, requestedBytes, now: _now }: {
    subject: string; requestedBytes: number; now: number;
  }): Promise<QuotaDecision> {
    // ── Burst ─────────────────────────────────────────────────────────────────
    const rpmKey = `snt:rpm:${subject}`;
    const rpmVal = await this.atomicIncrBy(rpmKey, 1, UPLOAD_POLICY.rateLimitWindowSec);

    if (rpmVal > UPLOAD_POLICY.maxRequestsPerMinute) {
      // Aşıldı — sayacı geri al (atomik olmadığından yaklaşık düzeltme)
      await this.client.decrby(rpmKey, 1).catch(() => {});
      return { ok: false, code: 429, reason: 'RATE_LIMIT_EXCEEDED',
               retryAfterSec: UPLOAD_POLICY.rateLimitWindowSec };
    }

    // ── Saatlik ───────────────────────────────────────────────────────────────
    const hourKey = `snt:bytes_hour:${subject}`;
    const hourVal = await this.atomicIncrBy(hourKey, requestedBytes, UPLOAD_POLICY.hourlyWindowSec);

    if (hourVal > UPLOAD_POLICY.maxBytesPerHour) {
      await this.client.decrby(hourKey, requestedBytes).catch(() => {});
      return { ok: false, code: 429, reason: 'HOURLY_QUOTA_EXCEEDED',
               retryAfterSec: await this.client.ttl(hourKey) };
    }

    // ── Günlük ────────────────────────────────────────────────────────────────
    const dayKey = `snt:bytes_day:${subject}`;
    const dayVal = await this.atomicIncrBy(dayKey, requestedBytes, UPLOAD_POLICY.dailyWindowSec);

    if (dayVal > UPLOAD_POLICY.maxBytesPerDay) {
      await this.client.decrby(dayKey, requestedBytes).catch(() => {});
      await this.client.decrby(hourKey, requestedBytes).catch(() => {});
      return { ok: false, code: 429, reason: 'DAILY_QUOTA_EXCEEDED',
               retryAfterSec: await this.client.ttl(dayKey) };
    }

    return { ok: true };
  }

  async releaseReservation({ subject, reservedBytes }: {
    subject: string; reservedBytes: number; now: number;
  }): Promise<void> {
    await Promise.allSettled([
      this.client.decrby(`snt:bytes_hour:${subject}`, reservedBytes),
      this.client.decrby(`snt:bytes_day:${subject}`, reservedBytes),
    ]);
  }
}

// ─── Factory: env'e göre doğru store'u seç ───────────────────────────────────
function createQuotaStore(): QuotaStore {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      // ioredis veya @redis/client — proje bağımlılığına göre
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Redis = require('ioredis');
      const client = new Redis(redisUrl);
      console.log('[QuotaStore] Redis store aktif →', redisUrl.replace(/:\/\/.*@/, '://***@'));
      return new RedisQuotaStore(client);
    } catch (e) {
      console.warn('[QuotaStore] Redis bağlanamadı, in-memory fallback kullanılıyor.', e);
    }
  } else {
    console.warn('[QuotaStore] REDIS_URL bulunamadı — in-memory store (sadece local dev).');
  }
  return new InMemoryQuotaStore();
}

export const quotaStore: QuotaStore = createQuotaStore();
