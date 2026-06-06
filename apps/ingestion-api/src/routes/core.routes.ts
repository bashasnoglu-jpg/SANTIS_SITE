import { FastifyInstance } from 'fastify';

export async function coreRoutes(server: FastifyInstance) {
  // Phase E-E-D: nav-manifest stub
  server.get('/v1/nav-manifest', async (request, reply) => {
    return {
      status: "ok",
      manifest: {
        version: "1.0",
        items: [
          { id: "home", path: "/", label: "Home" },
          { id: "boardroom", path: "/admin/", label: "Boardroom" }
        ]
      },
      ts: Date.now()
    };
  });

  // Phase E-E-D: core-state stub
  server.get('/v1/core-state', async (request, reply) => {
    return {
      status: "ok",
      state: {
        maintenance_mode: false,
        active_connections: 42,
        system_health: "nominal"
      },
      ts: Date.now()
    };
  });
}
