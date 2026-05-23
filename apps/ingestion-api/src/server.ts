import fastify from 'fastify';
import { healthResponseSchema } from './contracts/health.contract.js';
import { boardroomRoutes } from './routes/boardroom.routes.js';

export function buildServer(db?: any) {
  const server = fastify({
    logger: true
  });

  if (db) {
    server.decorate('db', db);
  }

  server.get('/health', async (request, reply) => {
    const response = { status: "ok", service: "ingestion-api" };
    // We could validate with Zod here before sending, but for a simple health check, returning the object is fine.
    // The schema acts as a contract definition for this endpoint.
    healthResponseSchema.parse(response);
    return response;
  });

  // Register cookie plugin for session bridge
  server.register(import('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET || 'fallback-dev-secret-do-not-use-in-prod', // optional, for signed cookies
    parseOptions: {} // options parsed to cookie.parse
  });

  // Register route skeletons
  server.register(boardroomRoutes, { prefix: '/api' });

  return server;
}
