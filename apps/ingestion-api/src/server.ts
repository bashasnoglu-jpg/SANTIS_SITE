import fastify from 'fastify';
import { healthResponseSchema } from './contracts/health.contract.js';
import { boardroomRoutes } from './routes/boardroom.routes.js';
import { schedulingRoutes } from './routes/scheduling.routes.js';
import fastifyCookie from '@fastify/cookie';

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

  // Production strictness for cookie secret
  const isProd = process.env.NODE_ENV === 'production';
  const cookieSecret = process.env.COOKIE_SECRET;
  
  if (isProd && !cookieSecret) {
    throw new Error("COOKIE_SECRET is required in production");
  }

  // Register cookie plugin for session bridge
  server.register(fastifyCookie, {
    secret: cookieSecret || 'fallback-dev-secret-do-not-use-in-prod', // optional, for signed cookies
    parseOptions: {} // options parsed to cookie.parse
  });

  // Register route skeletons
  server.register(boardroomRoutes, { prefix: '/api' });
  server.register(schedulingRoutes, { prefix: '/api' });

  return server;
}
