import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildApp } from "./app.js";

async function start(): Promise<void> {
  const server = buildApp();
  const portText = process.env.PORT?.trim() || "3032";
  const port = Number.parseInt(portText, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("ERR_INVALID_PORT");
  const host = process.env.HOST?.trim() || "127.0.0.1";
  await server.listen({ port, host });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  start().catch(() => {
    process.exitCode = 1;
  });
}
