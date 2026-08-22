import type { FastifyReply, FastifyRequest } from "fastify";

import type { IngestionApiClient } from "../client/ingestion-api.client.js";
import { expireAdminSessionCookie, readAdminSessionCookie } from "../cookie/admin-session.cookie.js";

export function createLogoutHandler(client: IngestionApiClient) {
  return async function logoutHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.header("cache-control", "no-store");
    let rawSessionToken: string | null;
    try {
      rawSessionToken = readAdminSessionCookie(request);
    } catch {
      expireAdminSessionCookie(reply);
      await reply.code(401).send({ error: "ERR_INVALID_SESSION" });
      return;
    }

    if (!rawSessionToken) {
      expireAdminSessionCookie(reply);
      await reply.code(204).send();
      return;
    }

    let response;
    try {
      response = await client.logout(rawSessionToken);
    } catch {
      expireAdminSessionCookie(reply);
      await reply.code(503).send({ error: "ERR_AUTH_SERVICE_UNAVAILABLE" });
      return;
    }

    expireAdminSessionCookie(reply);
    if (response.status === 204 || response.status === 401 || response.status === 403) {
      await reply.code(204).send();
      return;
    }
    await reply.code(503).send({ error: "ERR_AUTH_SERVICE_UNAVAILABLE" });
  };
}
