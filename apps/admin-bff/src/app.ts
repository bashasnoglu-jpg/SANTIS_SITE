import Fastify, { type FastifyInstance } from "fastify";

import { createLoginHandler } from "./auth/login.handler.js";
import { createLogoutHandler } from "./auth/logout.handler.js";
import { createSessionHandler } from "./auth/session.handler.js";
import { IngestionApiClient } from "./client/ingestion-api.client.js";
import { loadConfig, type AdminBffConfig } from "./config.js";
import { InjectedWifJwtProvider, type ServiceIdentityProvider } from "./identity/service-identity.provider.js";
import { enforceFetchMetadata } from "./middleware/fetch-metadata.middleware.js";
import { createOriginGuard } from "./middleware/origin.middleware.js";
import { createAdminApiProxy } from "./proxy/admin-api.proxy.js";

export function buildApp(
  config: AdminBffConfig = loadConfig(),
  identity: ServiceIdentityProvider = new InjectedWifJwtProvider(),
): FastifyInstance {
  const server = Fastify({
    logger: false,
    bodyLimit: 2 * 1024 * 1024,
    requestTimeout: 20_000,
    disableRequestLogging: true,
  });
  const client = new IngestionApiClient(config, identity);
  const browserGuards = [createOriginGuard(config), enforceFetchMetadata];

  server.post("/api/admin/login", { preHandler: browserGuards }, createLoginHandler(client, config));
  server.post("/api/admin/logout", { preHandler: browserGuards }, createLogoutHandler(client));
  server.get("/api/admin/session", { preHandler: browserGuards }, createSessionHandler(client, config));
  server.all("/api/admin/backend/v1/*", { preHandler: browserGuards }, createAdminApiProxy(client, config));

  server.setNotFoundHandler(async (_request, reply) => {
    await reply.code(404).send({ error: "ERR_NOT_FOUND" });
  });
  server.setErrorHandler(async (error, _request, reply) => {
    const status = typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 500
      ? error.statusCode
      : 500;
    await reply.code(status).send({ error: status === 500 ? "ERR_INTERNAL" : "ERR_BAD_REQUEST" });
  });

  return server;
}
