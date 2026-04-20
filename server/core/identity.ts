/**
 * core/identity.ts
 * Upload kimlik çözümleme katmanı.
 * Öncelik: userId > apiKey > tenant+visitor > forwardedIp > req.ip
 */

import type { Request } from 'express';

export interface UploadIdentity {
  /** Rate-limit ve quota anahtarı olarak kullanılır */
  subject:   string;
  tenantId:  string;
  sourceIp:  string;
  userId?:   string;
}

export function resolveUploadIdentity(req: Request): UploadIdentity {
  const user     = (req as any).user as { id?: string; tenantId?: string } | undefined;
  const userId   = user?.id;
  const tenantId = user?.tenantId ?? req.header('x-tenant-id') ?? 'public';

  // CDN / proxy arkasında gerçek IP
  const forwardedFor = req.header('x-forwarded-for');
  const sourceIp =
    forwardedFor?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress        ||
    req.ip                           ||
    'unknown';

  const visitorId = req.header('x-visitor-id') ?? 'anon';

  const subject = userId
    ? `user:${userId}`
    : `visitor:${tenantId}:${visitorId}:${sourceIp}`;

  return { subject, tenantId, sourceIp, userId };
}
