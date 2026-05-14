/**
 * SANTIS OS — Sovereign DI Root (Bootstrap Orchestrator)
 * @version Phase-84
 * @description Single entrypoint that wires all runtime modules via dependency injection.
 * This file MUST remain orchestration-only — no business logic, no stateful construction,
 * no direct Express/WebSocket setup. All of that lives in bootstrap/*.
 *
 * Execution order is intentional:
 *   1. createRuntimeContext  — builds all stateful singletons (repos, managers, persistence)
 *   2. createWebSocketGateway — isolated WS server, injected deps
 *   3. registerCommandHandlers — bus command surface
 *   4. registerEventObservers — firehose observer (idempotency-guarded)
 *   5. createExpressApp       — HTTP surface, routes, middleware
 *   6. startHttpServer        — binds port
 */

import { SovereignBus } from "@santis/sovereign-bus";
import { IntentEngine } from "./engine/intent.engine.js";
import type { SantisEvent } from "@santis/event-dictionary";

import { createRuntimeContext } from "./bootstrap/create-runtime-context.js";
import { createWebSocketGateway } from "./bootstrap/create-websocket-gateway.js";
import { registerEventObservers } from "./bootstrap/register-event-observers.js";
import { createExpressApp } from "./bootstrap/create-express-app.js";
import { startHttpServer } from "./bootstrap/create-http-server.js";
import { registerCommandHandlers } from "./handlers/register-command-handlers.js";


async function bootstrap() {
  // ── Step 1: Runtime Context (all stateful singletons) ──────────────────────
  const context = await createRuntimeContext();

  // ── Step 2: Command Bus ─────────────────────────────────────────────────────
  const bus = new SovereignBus();
  registerCommandHandlers(bus, context.sseManager);
  IntentEngine.init(bus);

  // ── Step 3: WebSocket Gateway ───────────────────────────────────────────────
  const wss = createWebSocketGateway(context);

  // ── Step 4: Event Observer (Firehose — idempotency-guarded) ────────────────
  const eventStoreAdapter = {
    append: (event: SantisEvent) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (context.eventStore as any).append(event) as Promise<void>,
  };
  registerEventObservers({
    bus,
    wss,
    sseManager: context.sseManager,
    eventStore: eventStoreAdapter,
  });

  // ── Step 5: Express HTTP App ────────────────────────────────────────────────
  const app = createExpressApp({
    bus,
    sseManager: context.sseManager,
    fallbackSseRegistry: context.fallbackSseRegistry,
    uow: context.uow,
    guestSessionRepo: context.guestSessionRepo,
    intentSnapshotRepo: context.intentSnapshotRepo,
    moodReadModelRepo: context.moodReadModelRepo,
    outboxRepo: context.outboxRepo,
    fallbackRepo: context.fallbackRepo,
  });
  // Alias: /health — monitoring / test-api-drift.mjs
  app.get("/health", (_req, res) => {
    res.json({ status: "operational", service: "ingestion-api", timestamp: new Date().toISOString() });
  });

  // ── Step 6: HTTP Server ─────────────────────────────────────────────────────
  const port = process.env.PORT || 3030;
  startHttpServer(app, port);
}

bootstrap().catch((err) => {
  console.error("🔥 [FATAL] Boot sequence failed:", err);
  process.exit(1);
});
