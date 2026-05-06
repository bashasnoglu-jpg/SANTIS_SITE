/**
 * SANTIS OS — HTTP Server Factory
 * @description Starts the HTTP server with EADDRINUSE guard and banner logging.
 */

import http from "http";
import type { Express } from "express";

export function startHttpServer(app: Express, port: number | string): http.Server {
  const server = app.listen(port, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║  👑 SANTIS INGESTION GATEWAY v1.0                 ║
  ║  Zero-Trust Zod Parse | CQRS Dispatch             ║
  ╠═══════════════════════════════════════════════════╣
  ║  📡 Port: ${port}                                      ║
  ║  🛡️  Endpoint: POST /api/v1/commands              ║
  ╚═══════════════════════════════════════════════════╝
    `);
  });

  server.on("error", (e: NodeJS.ErrnoException) => {
    if (e.code === "EADDRINUSE") {
      console.error(`\n❌ [Ingestion API] Port ${port} already in use.`);
      console.error(`Run: netstat -ano | findstr :${port}`);
      console.error(`Then: taskkill /PID <PID> /F\n`);
      process.exit(1);
    } else {
      console.error("❌ [Ingestion API] Server error:", e);
      process.exit(1);
    }
  });

  return server;
}
