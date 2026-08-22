import type { FastifyReply, FastifyRequest } from "fastify";

const COOKIE_NAME = "__Host-santis_admin_session";
const OPAQUE_SESSION_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_COOKIE_LIFETIME_SECONDS = 8 * 60 * 60;

export function readAdminSessionCookie(request: FastifyRequest): string | null {
  const header = request.headers.cookie;
  if (!header) return null;

  const matches: string[] = [];
  for (const item of header.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    const name = item.slice(0, separator).trim();
    if (name !== COOKIE_NAME) continue;
    matches.push(item.slice(separator + 1).trim());
  }

  if (matches.length > 1) throw new Error("ERR_DUPLICATE_SESSION_COOKIE");
  const value = matches[0];
  if (!value) return null;
  if (!OPAQUE_SESSION_PATTERN.test(value)) throw new Error("ERR_INVALID_SESSION_COOKIE");
  return value;
}

export function setAdminSessionCookie(
  reply: FastifyReply,
  rawSessionToken: string,
  absoluteExpiresAt: string,
): void {
  if (!OPAQUE_SESSION_PATTERN.test(rawSessionToken)) throw new Error("ERR_INVALID_SESSION_REFERENCE");
  const absoluteExpiry = Date.parse(absoluteExpiresAt);
  if (!Number.isFinite(absoluteExpiry)) throw new Error("ERR_INVALID_SESSION_EXPIRY");
  const now = Date.now();
  const maxAge = Math.max(
    1,
    Math.min(MAX_COOKIE_LIFETIME_SECONDS, Math.floor((absoluteExpiry - now) / 1_000)),
  );
  const expires = new Date(now + maxAge * 1_000).toUTCString();
  reply.header(
    "set-cookie",
    `${COOKIE_NAME}=${rawSessionToken}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${maxAge}; Expires=${expires}`,
  );
}

export function expireAdminSessionCookie(reply: FastifyReply): void {
  reply.header(
    "set-cookie",
    `${COOKIE_NAME}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );
}
