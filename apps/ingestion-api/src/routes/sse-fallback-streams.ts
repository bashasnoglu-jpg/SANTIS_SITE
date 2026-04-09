import { Router } from "express";
import crypto from "node:crypto";
import type { FallbackIncidentsReadModelRepository } from "../../../packages/application/src/projections/fallback-incidents/repository.js";
import type { FallbackSseRegistry } from "../services/fallback-sse-registry.js";

export function createFallbackSseRouter(params: {
  repo: FallbackIncidentsReadModelRepository;
  registry: FallbackSseRegistry;
}) {
  const router = Router();

  router.get("/api/v1/streams/fallback-incidents/:tenantId", async (req, res) => {
    const tenantId = req.params.tenantId;
    const windowRaw = String(req.query.window ?? "5m");
    const window =
      windowRaw === "15m" || windowRaw === "1h" ? windowRaw : "5m";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const send = (payload: string) => res.write(payload);

    const removeClient = params.registry.addClient({
      id: crypto.randomUUID(),
      tenantId,
      send,
    });

    const snapshot = await params.repo.getSnapshot({ tenantId, window });

    if (snapshot) {
      params.registry.broadcastSnapshot({
        tenantId,
        traceId: snapshot.lastTraceId,
        snapshot,
        type: "fallback.snapshot.initial",
      });
    } else {
      send(
        `event: fallback.snapshot.empty\n` +
          `data: ${JSON.stringify({
            type: "fallback.snapshot.empty",
            tenantId,
            traceId: null,
            data: null,
          })}\n\n`
      );
    }

    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeat);
      removeClient();
      res.end();
    });
  });

  return router;
}
