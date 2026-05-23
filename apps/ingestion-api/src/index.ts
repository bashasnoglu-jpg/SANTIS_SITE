import { buildServer } from './server.js';
import { createDbConnection } from '@santis/database';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3030;

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is missing. Cannot start ingestion-api without a real database.");
  process.exit(1);
}

// Wire the real Postgres/Drizzle provider
const db = createDbConnection(process.env.DATABASE_URL);
const server = buildServer(db);

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
