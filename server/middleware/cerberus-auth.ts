/**
 * server/middleware/cerberus-auth.ts
 * The Cerberus Gate — Sovereign Admin Auth Middleware
 *
 * Zero-bloat: cookie-parser, passport, jwt lib olmadan.
 * Strateji: Server-set HttpOnly cookie (cerberus_token) → HMAC-SHA256 ile imzalı.
 */

import { IncomingMessage, ServerResponse } from 'http';

const CERBERUS_SECRET = process.env.CERBERUS_SECRET || 'sovereign-dev-secret-2026';
const COOKIE_NAME     = 'cerberus_token';
const TOKEN_TTL_MS    = 4 * 60 * 60 * 1000; // 4 saat

// ─── Cookie parser (zero-dependency) ─────────────────────────────────────────
function parseCookies(header: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!header) return map;
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx < 1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try { map[key] = decodeURIComponent(val); } catch { map[key] = val; }
  }
  return map;
}

// ─── HMAC-SHA256 token (Node crypto — zero-dependency) ───────────────────────
const { createHmac, timingSafeEqual } = require('crypto');

function signToken(payload: string): string {
  return createHmac('sha256', CERBERUS_SECRET).update(payload).digest('hex');
}

/** Token formatı: `<issuedAt>.<signature>` */
export function issueToken(): string {
  const issuedAt = Date.now().toString();
  const sig      = signToken(issuedAt);
  return `${issuedAt}.${sig}`;
}

function verifyToken(token: string): boolean {
  const dot = token.indexOf('.');
  if (dot === -1) return false;

  const issuedAt  = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected  = signToken(issuedAt);

  // Timing-safe karşılaştırma (timing attack önleme)
  try {
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expected,  'hex');
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  // TTL kontrolü
  const age = Date.now() - parseInt(issuedAt, 10);
  return age > 0 && age < TOKEN_TTL_MS;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export function cerberusAuth(req: any, res: any, next: () => void): void {
  const cookies = parseCookies(req.headers?.cookie);
  const token   = cookies[COOKIE_NAME];

  if (token && verifyToken(token)) {
    return next(); // ✅ Geçerli token → devam et
  }

  const path = req.url?.split('?')[0] || '/';

  // API isteği → 401 JSON
  if (path.startsWith('/api/')) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized. The Cerberus Gate is sealed.' }));
    return;
  }

  // HTML isteği → login sayfasına yönlendir
  console.warn(`[Cerberus Gate] Yetkisiz erişim: ${path} | IP: ${req.socket?.remoteAddress}`);
  res.writeHead(302, { Location: '/admin/login.html' });
  res.end();
}
