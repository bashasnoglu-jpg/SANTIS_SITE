import { randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import type { IngestionApiClient } from "../client/ingestion-api.client.js";
import type { AdminBffConfig } from "../config.js";
import { expireAdminSessionCookie, readAdminSessionCookie } from "../cookie/admin-session.cookie.js";
import { resolveAdminRoutePolicy } from "../policy/admin-route-policy.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createAdminApiProxy(client: IngestionApiClient, config: AdminBffConfig) {
  return async function adminApiProxy(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const policy = resolveAdminRoutePolicy(request.method, request.raw.url ?? "");
    if (!policy) {
      await reply.code(403).send({ error: "ERR_ADMIN_ROUTE_DENIED" });
      return;
    }

    let rawSessionToken: string | null;
    try {
      rawSessionToken = readAdminSessionCookie(request);
    } catch {
      expireAdminSessionCookie(reply);
      await reply.code(401).send({ error: "ERR_INVALID_SESSION" });
      return;
    }
    if (!rawSessionToken) {
      await reply.code(401).send({ error: "ERR_NO_SESSION" });
      return;
    }

    let verification;
    try {
      verification = await client.verify(rawSessionToken, {
        request_id: `bff_proxy_${randomUUID()}`,
        requested_resource: policy.requestedResource,
        requested_action: policy.requestedAction,
        requested_tenant_id: config.requestedTenantId,
      });
    } catch {
      await reply.code(503).send({ error: "ERR_AUTH_SERVICE_UNAVAILABLE" });
      return;
    }

    if (verification.status !== 200 || !isRecord(verification.body) || verification.body.decision !== "ALLOW") {
      if (verification.status === 401) expireAdminSessionCookie(reply);
      const status = verification.status === 503 ? 503 : verification.status === 401 ? 401 : 403;
      await reply.code(status).send({ error: status === 503 ? "ERR_AUTH_SERVICE_UNAVAILABLE" : "ERR_AUTHORIZATION_DENIED" });
      return;
    }

    const upstreamUrl = new URL(policy.upstreamPath, `${config.adminBffUpstream.origin}/`);
    const headers: Record<string, string> = { accept: "application/json" };
    const incomingContentType = request.headers["content-type"];
    if (typeof incomingContentType === "string") headers["content-type"] = incomingContentType;

    const hasBody = request.method !== "GET" && request.method !== "HEAD" && request.body !== undefined;
    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers,
        ...(hasBody ? { body: JSON.stringify(request.body) } : {}),
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      await reply.code(502).send({ error: "ERR_ADMIN_UPSTREAM_UNAVAILABLE" });
      return;
    }

    const contentType = upstreamResponse.headers.get("content-type");
    if (contentType) reply.header("content-type", contentType);
    const text = await upstreamResponse.text();
    if (!text) {
      await reply.code(upstreamResponse.status).send();
      return;
    }
    if (contentType?.includes("application/json")) {
      try {
        await reply.code(upstreamResponse.status).send(JSON.parse(text));
        return;
      } catch {
        await reply.code(502).send({ error: "ERR_INVALID_ADMIN_UPSTREAM_RESPONSE" });
        return;
      }
    }
    await reply.code(upstreamResponse.status).send(text);
  };
}
