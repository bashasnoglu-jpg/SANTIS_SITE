import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { apiErrorSchema } from '../contracts/boardroomAuditLog.contract.js';

export const boardroomRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Phase J-D: Route exists but returns 501 Not Implemented 
  // to ensure frontend gracefully falls back to mock data
  server.get('/v1/boardroom/audit-log', async (request, reply) => {
    const errorResponse = {
      error: "Not Implemented",
      code: "ERR_NOT_IMPLEMENTED",
      message: "Boardroom Audit Log endpoint is under construction. Future implementation requires proper tenant/admin boundaries."
    };
    
    // Ensure the error response matches our schema contract
    apiErrorSchema.parse(errorResponse);
    
    return reply.status(501).send(errorResponse);
  });
};
