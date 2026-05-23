import { buildServer } from './server.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3030;

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is missing. Cannot start ingestion-api without a real database.");
  process.exit(1);
}

// TODO: Phase J-T or later will wire up the actual Postgres/Drizzle provider here.
// For now, we fail fast if DATABASE_URL is missing, and if it's provided, we'd theoretically inject it.
// Since we don't have the real provider implemented yet, this will just crash during route registration if we pass undefined.
const server = buildServer();

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
