import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const paymentsRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Phantom Route Resolution for checkout animation
  server.post('/v1/payments/checkout/sovereign-seal', async (request, reply) => {
    // Fulfills the UI contract expected by santis-checkout-vault.js
    return reply.status(200).send({
      success: true,
      url: "/tr/handoff/success.html"
    });
  });
};
