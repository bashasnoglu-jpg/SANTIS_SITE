import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Fastify, { type FastifyInstance } from "fastify";

import { createLoginHandler } from "./auth/login.handler.js";
import { createLogoutHandler } from "./auth/logout.handler.js";
import { verifyWifServiceIdentity } from "./middleware/wif-identity.middleware.js";
import { RedisSessionStore, type SessionStore } from "./persistence/session.store.js";
import { createVerifyHandler } from "./session/verify.handler.js";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`ERR_MISSING_${name}`);
  return value;
}

export function buildServer(store?: SessionStore): FastifyInstance {
  const sessionStore = store ?? new RedisSessionStore(requiredEnv("REDIS_URL"));
  const server = Fastify({
    logger: false,
    bodyLimit: 16 * 1024,
    requestTimeout: 15_000,
    disableRequestLogging: true,
  });

  server.post(
    "/v1/auth/admin/login",
    { preHandler: verifyWifServiceIdentity },
    createLoginHandler(sessionStore),
  );
  server.post(
    "/v1/auth/admin/verify",
    { preHandler: verifyWifServiceIdentity },
    createVerifyHandler(sessionStore),
  );
  server.post(
    "/v1/auth/admin/logout",
    { preHandler: verifyWifServiceIdentity },
    createLogoutHandler(sessionStore),
  );

  server.setNotFoundHandler(async (_request, reply) => {
    await reply.code(404).send({ error: "ERR_NOT_FOUND" });
  });
  server.setErrorHandler(async (error, _request, reply) => {
    const statusCode = typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 500
      ? error.statusCode
      : 500;
    await reply.code(statusCode).send({ error: statusCode === 500 ? "ERR_INTERNAL" : "ERR_BAD_REQUEST" });
  });

  return server;
}

async function start(): Promise<void> {
  const server = buildServer();
  const portText = process.env.PORT?.trim() || "3031";
  const port = Number.parseInt(portText, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("ERR_INVALID_PORT");
  const host = process.env.HOST?.trim() || "127.0.0.1";
  await server.listen({ port, host });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  start().catch(() => {
    process.exitCode = 1;
  });
}
