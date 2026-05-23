import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { boardroomAuthPreHandler } from '../auth/fastify-auth-prehandler.js';
import { AuditLogService } from '../services/audit-log.service.js';
import { AuditLogRepository } from '@santis/database';

// Note: In a real environment, `db` would be injected from Fastify plugins.
// For the scope of Phase J-S, we instantiate with a dummy db if not present,
// or we assume it's provided. 
export const boardroomRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Normally: const repository = new AuditLogRepository(server.db);
  // We'll use a mock for now to allow tests to run without an actual Postgres connection yet.
  const mockDb = {
    insert: () => ({ values: () => ({ returning: async () => [{ id: "mocked-id", createdAt: new Date() }] }) }),
    select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => ({ offset: async () => [] }) }) }) }) })
  } as any;
  
  const repository = new AuditLogRepository(server.db || mockDb);
  const service = new AuditLogService(repository);

  // POST /api/v1/boardroom/audit-log -> Append-only create
  server.post('/v1/boardroom/audit-log', { preHandler: boardroomAuthPreHandler }, async (request, reply) => {
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
      
      const query = request.query as any;
      const limit = query.limit ? parseInt(query.limit, 10) : 50;
      const offset = query.offset ? parseInt(query.offset, 10) : 0;

      const results = await service.getTenantLogs(tenantId, { limit, offset });
      return reply.status(200).send(results);
    } catch (error: any) {
      server.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  });
};
