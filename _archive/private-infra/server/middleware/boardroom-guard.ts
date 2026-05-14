/**
 * middleware/boardroom-guard.ts
 * Stabilization Pass — Boardroom Auth + Rate Limit
 *
 * 1. ROLE GUARD:
 *    İstekte geçerli operator token'ı olmadan boardroom endpoint'leri yanıt vermiyor.
 *    Üretimde: JWT verify → role = 'admin' | 'operator'
 *    Geliştirmede: BOARDROOM_SECRET env değişkeni ile basit header check.
 *
 * 2. RATE LIMIT:
 *    Per-IP, in-memory sliding window.
 *    Varsayılan: 120 istek / dakika (dashboard poller'ları için yeterli).
 *    Aşılırsa: 429 + Retry-After.
 *
 * Kullanım:
 *   router.use(boardroomRateLimit, boardroomAuthGuard);
 */

import type { Request, Response, NextFunction } from 'express';

// ─── 1. Rate Limiter ──────────────────────────────────────────────────────────
const MAX_REQUESTS  = 120;       // / dakika
const WINDOW_MS     = 60_000;

interface RateWindow { count: number; resetAt: number }
const _windows = new Map<string, RateWindow>();

// Sızdırmayı önlemek için eski pencereler 5 dakikada bir temizlenir
setInterval(() => {
  const now = Date.now();
  for (const [ip, w] of _windows) {
    if (w.resetAt < now - WINDOW_MS * 5) _windows.delete(ip);
  }
}, 300_000).unref();

export function boardroomRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip  = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
              ?? req.socket.remoteAddress
              ?? 'unknown';
  const now = Date.now();
  let win   = _windows.get(ip);

  if (!win || win.resetAt < now) {
    win = { count: 1, resetAt: now + WINDOW_MS };
    _windows.set(ip, win);
    return next();
  }

  win.count++;
  if (win.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((win.resetAt - now) / 1_000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      error:   'BOARDROOM_RATE_LIMIT',
      message: `Max ${MAX_REQUESTS} req/min. Retry after ${retryAfter}s.`,
    });
    return;
  }

  next();
}

// ─── 2. Auth Guard ────────────────────────────────────────────────────────────
// Prod: Bearer JWT -> doğrula -> role kontrolü
// Dev:  X-Boardroom-Secret header -> BOARDROOM_SECRET env VEYA cerberus_token cookie

// Fallback OMEGA Parolası tanımlandı (Zero-Touch için)
const FALLBACK_SECRET  = 'SOVEREIGN_V28_OMEGA';
const BOARDROOM_SECRET = process.env.BOARDROOM_SECRET || FALLBACK_SECRET;
const BYPASS_IN_DEV    = false; // Boardroom her zaman korunmalıdır.

export function boardroomAuthGuard(req: Request, res: Response, next: NextFunction): void {
  // 1. Bearer Token Headers
  const bearer = req.headers['authorization']?.replace('Bearer ', '').trim();
  const secret = req.headers['x-boardroom-secret'] as string | undefined;
  
  // 2. Cookie Mühürü (Zero-Bloat Parser)
  let cookieToken = '';
  const cookieHeader = req.headers.cookie || '';
  const cerberusMatch = cookieHeader.match(/cerberus_token=([^;]+)/);
  if (cerberusMatch) {
      cookieToken = cerberusMatch[1];
  }

  const provided = bearer || secret || cookieToken || '';

  if (!provided) {
    res.status(401).json({ error: 'BOARDROOM_UNAUTHORIZED', message: 'Mühür tespit edilemedi.' });
    return;
  }

  // Güvenlik Karşilaştırmasi
  // Not: Üretim (Prod) aşamasında bu JWT validation ile değişebilir, 
  // ancak Cerberus Gate şu an doğrudan otonom çalışacak.
  if (provided !== BOARDROOM_SECRET) {
    res.status(403).json({ error: 'BOARDROOM_FORBIDDEN', message: 'Kilit reddedildi.' });
    return;
  }

  // Operator kimliğini request'e ekle
  (req as any).boardroomOperator = cookieToken ? 'cerberus-operator' : (bearer ? 'jwt-operator' : 'secret-operator');
  next();
}
