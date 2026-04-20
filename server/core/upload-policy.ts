/**
 * core/upload-policy.ts
 * Tek doğruluk kaynağı — tüm limit sabitleri buradan okunur.
 * Değiştirmek için sadece bu dosyaya dokunulur.
 */

export const UPLOAD_POLICY = {
  /** Tek dosya başına maksimum boyut (bytes) */
  maxFileBytes: 20 * 1_024 * 1_024,          // 20 MB

  /** Subject başına dakikada maksimum /init isteği */
  maxRequestsPerMinute: 10,

  /** Subject başına saatlik bayt kotası */
  maxBytesPerHour: 100 * 1_024 * 1_024,      // 100 MB

  /** Subject başına günlük bayt kotası */
  maxBytesPerDay: 500 * 1_024 * 1_024,       // 500 MB

  /** Init → Finalize için rezervasyon TTL (saniye). Reaper bu süre içinde temizler. */
  reservationTtlSec: 15 * 60,                // 15 dakika

  /** Rate limit penceresi (saniye) */
  rateLimitWindowSec: 60,

  /** Saatlik kota penceresi (saniye) */
  hourlyWindowSec: 3_600,

  /** Günlük kota penceresi (saniye) */
  dailyWindowSec: 86_400,
} as const;

export type UploadPolicy = typeof UPLOAD_POLICY;
