import type { FastifyReply, FastifyRequest } from "fastify";

import type { AdminBffConfig } from "../config.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function createOriginGuard(config: AdminBffConfig) {
  return async function originGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const origin = request.headers.origin;
    if (typeof origin === "string" && origin !== config.adminPublicOrigin) {
      await reply.code(403).send({ error: "ERR_ORIGIN_DENIED" });
      return;
    }

    if (UNSAFE_METHODS.has(request.method) && origin !== config.adminPublicOrigin) {
      await reply.code(403).send({ error: "ERR_ORIGIN_REQUIRED" });
    }
  };
}
