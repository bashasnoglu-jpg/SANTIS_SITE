import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { boardroomAuthPreHandler, boardroomWriteAuthPreHandler } from '../auth/fastify-auth-prehandler.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogRepository } from '@santis/database';
import { AuditLogQuerySchema } from '@santis/domain-schema/audit-log.contract.js';

export const boardroomRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  if (!server.db) {
    throw new Error("server.db is not injected");
  }

  const repository = new AuditLogRepository(server.db);
  const service = new AuditLogService(repository);

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
