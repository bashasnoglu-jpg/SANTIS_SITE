import { FastifyInstance } from 'fastify';
import { AdvisorService } from '../advisor/advisor.service.js';
import { IntentPayload } from '../advisor/types.js';

export async function advisorRoutes(fastify: FastifyInstance) {
  // @ts-ignore
  const db = fastify.db;
  // @ts-ignore
  const bus = fastify.bus;
  const advisorService = new AdvisorService(db, bus);

  fastify.post('/advisor/intent', async (request, reply) => {
    const payload = request.body as IntentPayload;
    if (!payload || !payload.tenantId || !payload.currentAction) {
      return reply.status(400).send({ error: "tenantId and currentAction are required" });
    }

    const context = await advisorService.processIntent(payload);
    return reply.send(context);
  });
}
