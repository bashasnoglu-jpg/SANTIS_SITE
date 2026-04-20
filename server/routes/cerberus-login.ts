/**
 * POST /api/auth/login — Cerberus Gate Login Route
 * Server-side doğrulama → HttpOnly cookie set
 */

import { issueToken } from '../middleware/cerberus-auth';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'SOVEREIGN2026';
const COOKIE_NAME    = 'cerberus_token';
const IS_PROD        = process.env.NODE_ENV === 'production';

export function handleCerberusLogin(req: any, res: any): void {
  let body = '';
  req.on('data', (c: string) => { body += c; });
  req.on('end', () => {
    let passcode = '';
    try {
      const parsed = JSON.parse(body);
      passcode = parsed.passcode || '';
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    if (!passcode || passcode !== ADMIN_PASSCODE) {
      console.warn(`[Cerberus] Başarısız giriş denemesi. IP: ${req.socket?.remoteAddress}`);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'ACCESS_DENIED' }));
      return;
    }

    const token = issueToken();
    const cookieFlags = [
      `${COOKIE_NAME}=${encodeURIComponent(token)}`,
      'HttpOnly',                          // JS erişemez
      'SameSite=Strict',
      'Path=/admin',
      'Max-Age=14400',                     // 4 saat
      ...(IS_PROD ? ['Secure'] : []),      // HTTPS'de Secure flag
    ].join('; ');

    console.log(`[Cerberus] ✅ Giriş onaylandı. IP: ${req.socket?.remoteAddress}`);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie':   cookieFlags,
    });
    res.end(JSON.stringify({ ok: true, redirect: '/admin/boardroom.html' }));
  });
}
