import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { boardroomAuthPreHandler, boardroomWriteAuthPreHandler } from '../auth/fastify-auth-prehandler.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogRepository } from '@santis/database';
import { AuditLogQuerySchema } from '@santis/domain-schema/audit-log.contract.js';
import { SANTIS_SESSION_COOKIE, CSRF_COOKIE, CSRF_HEADER } from '../auth/constants.js';

export const boardroomRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  if (!server.db) {
    throw new Error("server.db is not injected");
  }

  const repository = new AuditLogRepository(server.db);
  const service = new AuditLogService(repository);

  // POST /api/v1/boardroom/login -> Skeleton for future credential validation
  server.post('/v1/boardroom/login', async (request, reply) => {
    // Phase J-X1: This is a safe skeleton only.
    // It returns 501 Not Implemented to indicate real provider integration is pending.
    return reply.status(501).send({
      error: "Not Implemented",
      message: "Boardroom login provider integration is pending Phase J-X implementation."
    });
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
