import { FastifyInstance, FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    db: any;
  }
}
import { boardroomAuthPreHandler, boardroomWriteAuthPreHandler } from '../auth/fastify-auth-prehandler.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogRepository } from '@santis/database';
import crypto from 'node:crypto';
import { AuditLogQuerySchema } from '@santis/domain-schema/audit-log.contract.js';
import { BoardroomReadableSessionSchema } from '@santis/domain-schema/session.contract.js';
import { SANTIS_SESSION_COOKIE, CSRF_COOKIE, CSRF_HEADER } from '../auth/constants.js';
import { verifySupabaseJwt } from '../auth/supabase-jwks.js';
import { createSantisSessionContextFromJwtPayload } from '../auth/session-context.js';

export const boardroomRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  if (!server.db) {
    throw new Error("server.db is not injected");
  }

  const repository = new AuditLogRepository(server.db);
  const service = new AuditLogService(repository);

  // POST /api/v1/boardroom/login -> JWT Exchange Endpoint
  server.post('/v1/boardroom/login', async (request, reply) => {
    try {
      const body = request.body as { token?: string };
      if (!body || typeof body.token !== 'string') {
        return reply.status(401).send({ error: "Missing or invalid token" });
      }

      // Verify the Supabase JWT
      const payload = await verifySupabaseJwt(body.token);
      const sessionContext = createSantisSessionContextFromJwtPayload(payload);

      // Validate that it meets Boardroom read requirements at minimum
      const validationResult = BoardroomReadableSessionSchema.safeParse(sessionContext);
      if (!validationResult.success) {
        return reply.status(401).send({ error: "Insufficient permissions" });
      }

      // Issue CSRF Token
      const csrfToken = crypto.randomUUID();

      // Issue HttpOnly Session Cookie
      reply.setCookie(SANTIS_SESSION_COOKIE, body.token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

      // Issue Readable CSRF Cookie
      reply.setCookie(CSRF_COOKIE, csrfToken, {
        path: '/',
        httpOnly: false, // Must be readable by frontend JS
        secure: true,
        sameSite: 'strict',
      });

      return reply.status(200).send({ ok: true });
    } catch (error) {
      server.log.error(error);
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });

  // GET /api/v1/boardroom/csrf -> Optional CSRF Token Refresh
  server.get('/v1/boardroom/csrf', { preHandler: boardroomAuthPreHandler }, async (request, reply) => {
    const csrfToken = crypto.randomUUID();
    reply.setCookie(CSRF_COOKIE, csrfToken, {
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
    });
    return reply.status(200).send({ ok: true });
  });

  // POST /api/v1/boardroom/logout -> Clears cookies
  server.post('/v1/boardroom/logout', async (request, reply) => {
    // If user has a session cookie, require CSRF to logout (prevents forced-logout attacks)
    if (request.cookies[SANTIS_SESSION_COOKIE]) {
      const csrfCookie = request.cookies[CSRF_COOKIE];
      const csrfHeader = request.headers[CSRF_HEADER];
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return reply.status(403).send({ error: "Forbidden", code: "ERR_FORBIDDEN" });
      }
    }

    reply.clearCookie(SANTIS_SESSION_COOKIE, { path: '/' });
    reply.clearCookie(CSRF_COOKIE, { path: '/' }); // For future J-X2 compatibility
    return reply.status(200).send({ ok: true });
  });


  // POST /api/v1/boardroom/audit-log -> Append-only create
  server.post('/v1/boardroom/audit-log', { preHandler: boardroomWriteAuthPreHandler }, async (request, reply) => {
    try {
      // 1. Extract tenantId directly from the validated session
      const tenantId = request.santisContext?.tenant?.tenantId;
      if (!tenantId) {
        return reply.status(403).send({ error: "Tenant context missing" });
      }

      const rawBody = request.body as any;
      // 2. Safely merge tenantId, ignoring whatever was in the body
      const entryToCreate = {
        ...rawBody,
        tenantId,
      };

      const result = await service.appendLog(entryToCreate);
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return reply.status(400).send({ error: "Validation Error", details: error.errors });
      }
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  // GET /api/v1/boardroom/audit-log -> Tenant-scoped read
  server.get('/v1/boardroom/audit-log', { preHandler: boardroomAuthPreHandler }, async (request, reply) => {
    try {
      const tenantId = request.santisContext?.tenant?.tenantId;
      if (!tenantId) {
        return reply.status(403).send({ error: "Tenant context missing" });
      }
      
      const queryParsed = AuditLogQuerySchema.safeParse(request.query);
      if (!queryParsed.success) {
        return reply.status(400).send({ error: "Invalid Query", details: queryParsed.error.errors });
      }

      const results = await service.getTenantLogs(tenantId, queryParsed.data);
      return reply.status(200).send(results);
    } catch (error: any) {
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });
};
