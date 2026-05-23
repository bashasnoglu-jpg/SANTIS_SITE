import { buildServer } from './server.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3030;

// Temporarily use a mock DB until the full Postgres setup is implemented in a future phase
const mockDb = {
  insert: () => ({ values: (vals: any) => ({ returning: async () => [{ ...vals, id: "00000000-0000-0000-0000-000000000000", createdAt: new Date() }] }) }),
  select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => ({ offset: async () => [] }) }) }) }) })
} as any;

const server = buildServer(mockDb);

const start = async () => {
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Ingestion API listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
