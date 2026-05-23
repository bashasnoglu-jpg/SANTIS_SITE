import { buildServer } from './server.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3030;

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
