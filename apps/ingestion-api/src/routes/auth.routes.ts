import { FastifyInstance } from 'fastify';

export async function authRoutes(server: FastifyInstance) {
  server.get('/v1/auth/session', async (request, reply) => {
    // Phase E-E-C: Deterministic local dev token/session stub
    return {
      token: "dev-local-session-stub-token",
      role: "admin",
      status: "authenticated",
      ts: Date.now()
    };
  });
}
