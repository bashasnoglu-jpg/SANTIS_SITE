import fastify from 'fastify';
import { healthResponseSchema } from './contracts/health.contract.js';
import { boardroomRoutes } from './routes/boardroom.routes.js';
import { schedulingRoutes } from './routes/scheduling.routes.js';
import { streamRoutes } from './routes/stream.routes.js';
import { paymentsRoutes } from './routes/payments.routes.js';
import { advisorRoutes } from './routes/advisor.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { coreRoutes } from './routes/core.routes.js';
import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifySocketIO from 'fastify-socket.io';
import { SovereignBus } from '@santis/sovereign-bus';
import { BoardroomSocketService } from './services/boardroom.socket.js';

export function buildServer(db?: any) {
  const server = fastify({
    logger: true
  });

  const bus = new SovereignBus();
  server.decorate('bus', bus);

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

  // RT-2B: CORS Configuration
  const allowedOrigins = process.env.ADMIN_ALLOWED_ORIGINS
    ? process.env.ADMIN_ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:8081', 'http://127.0.0.1:8081'];

  server.register(cors, {
    origin: allowedOrigins,
    credentials: true
  });

  // RT-2B: Socket.IO Mock Compatibility
  // @ts-ignore
  server.register(fastifySocketIO, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"]
    }
  });

  server.ready().then(() => {
    // Only typed as any to bypass missing fastify-socket.io types if any
    const io = (server as any).io;
    if (io) {
      const boardroomSocket = new BoardroomSocketService(io);
      boardroomSocket.initialize();
    }
  });

  // Register route skeletons
  server.register(boardroomRoutes, { prefix: '/api' });
  server.register(schedulingRoutes, { prefix: '/api' });
  server.register(streamRoutes, { prefix: '/api' });
  server.register(paymentsRoutes, { prefix: '/api' });
  server.register(advisorRoutes, { prefix: '/api/v1' });
  server.register(authRoutes, { prefix: '/api' });
  server.register(coreRoutes, { prefix: '/api' });

  return server;
}
