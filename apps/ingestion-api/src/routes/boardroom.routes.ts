import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ErrorResponseSchema } from '../contracts/boardroom-audit-log.contract.js';

export const boardroomRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get('/v1/boardroom/audit-log', async (request, reply) => {
    const errorResponse = {
      error: "Not Implemented",
      code: "ERR_BOARDROOM_AUDIT_LOG_NOT_IMPLEMENTED",
      message: "Sovereign Memory backend requires auth and tenant boundary implementation before live data can be served."
    };
    
    // Ensure the response matches our contract exactly
    ErrorResponseSchema.parse(errorResponse);
    
    return reply.status(501).send(errorResponse);
  });
};
