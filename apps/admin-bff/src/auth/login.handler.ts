import { randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import type { IngestionApiClient } from "../client/ingestion-api.client.js";
import type { AdminBffConfig } from "../config.js";
import { setAdminSessionCookie } from "../cookie/admin-session.cookie.js";

const LOGIN_KEYS = new Set(["email", "password"]);
const OPAQUE_SESSION_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLogin(value: unknown): { email: string; password: string } | null {
  if (!isRecord(value) || !Object.keys(value).every((key) => LOGIN_KEYS.has(key))) return null;
  if (typeof value.email !== "string" || value.email.length < 3 || value.email.length > 320) return null;
  if (typeof value.password !== "string" || value.password.length < 1 || value.password.length > 1024) return null;
  return { email: value.email, password: value.password };
}

function loginResult(value: unknown): { sessionReference: string; subjectId: string; absoluteExpiresAt: string } | null {
  if (!isRecord(value)) return null;
  if (typeof value.session_reference !== "string" || !OPAQUE_SESSION_PATTERN.test(value.session_reference)) return null;
  if (typeof value.subject_id !== "string" || value.subject_id.length < 1 || value.subject_id.length > 128) return null;
  if (typeof value.absolute_expires_at !== "string" || !Number.isFinite(Date.parse(value.absolute_expires_at))) return null;
  return {
    sessionReference: value.session_reference,
    subjectId: value.subject_id,
    absoluteExpiresAt: value.absolute_expires_at,
  };
}

export function createLoginHandler(client: IngestionApiClient, config: AdminBffConfig) {
  return async function loginHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.header("cache-control", "no-store");
    const credentials = parseLogin(request.body);
    if (!credentials) {
      await reply.code(400).send({ error: "ERR_INVALID_LOGIN_REQUEST" });
      return;
    }

    let loginResponse;
    try {
      loginResponse = await client.login(credentials.email, credentials.password);
    } catch {
      await reply.code(503).send({ error: "ERR_AUTH_SERVICE_UNAVAILABLE" });
      return;
    }

    if (loginResponse.status !== 200) {
      const status = [400, 401, 403].includes(loginResponse.status) ? 401 : 503;
      await reply.code(status).send({ error: status === 401 ? "ERR_AUTHENTICATION_FAILED" : "ERR_AUTH_SERVICE_UNAVAILABLE" });
      return;
    }

    const session = loginResult(loginResponse.body);
    if (!session) {
      await reply.code(502).send({ error: "ERR_INVALID_AUTHORITY_RESPONSE" });
      return;
    }

    let verification;
    try {
      verification = await client.verify(session.sessionReference, {
        request_id: `bff_bootstrap_${randomUUID()}`,
        requested_resource: "ADMIN_UI",
        requested_action: "ENTER",
        requested_tenant_id: config.requestedTenantId,
      });
    } catch {
      try { await client.logout(session.sessionReference); } catch { /* no browser exposure; fail closed */ }
      await reply.code(503).send({ error: "ERR_AUTH_SERVICE_UNAVAILABLE" });
      return;
    }

    const decision = isRecord(verification.body) ? verification.body.decision : null;
    if (verification.status !== 200 || decision !== "ALLOW") {
      try { await client.logout(session.sessionReference); } catch { /* no browser exposure; fail closed */ }
      await reply.code(403).send({ error: "ERR_ADMIN_UI_DENIED" });
      return;
    }

    setAdminSessionCookie(reply, session.sessionReference, session.absoluteExpiresAt);
    await reply.code(200).send({ authenticated: true, subject_id: session.subjectId });
  };
}
