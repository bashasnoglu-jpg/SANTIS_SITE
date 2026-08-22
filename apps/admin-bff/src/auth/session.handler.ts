import { randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import type { IngestionApiClient } from "../client/ingestion-api.client.js";
import type { AdminBffConfig } from "../config.js";
import { expireAdminSessionCookie, readAdminSessionCookie } from "../cookie/admin-session.cookie.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createSessionHandler(client: IngestionApiClient, config: AdminBffConfig) {
  return async function sessionHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.header("cache-control", "no-store");
    let rawSessionToken: string | null;
    try {
      rawSessionToken = readAdminSessionCookie(request);
    } catch {
      expireAdminSessionCookie(reply);
      await reply.code(401).send({ authenticated: false });
      return;
    }
    if (!rawSessionToken) {
      await reply.code(401).send({ authenticated: false });
      return;
    }

    let verification;
    try {
      verification = await client.verify(rawSessionToken, {
        request_id: `bff_session_${randomUUID()}`,
        requested_resource: "ADMIN_UI",
        requested_action: "ENTER",
        requested_tenant_id: config.requestedTenantId,
      });
    } catch {
      await reply.code(503).send({ error: "ERR_AUTH_SERVICE_UNAVAILABLE" });
      return;
    }

    if (verification.status === 503) {
      await reply.code(503).send({ error: "ERR_AUTH_SERVICE_UNAVAILABLE" });
      return;
    }

    const body = isRecord(verification.body) ? verification.body : null;
    if (verification.status !== 200 || body?.decision !== "ALLOW") {
      expireAdminSessionCookie(reply);
      await reply.code(401).send({ authenticated: false });
      return;
    }

    await reply.code(200).send({
      authenticated: true,
      subject_id: typeof body.subject_id === "string" ? body.subject_id : null,
    });
  };
}
