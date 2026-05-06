/**
 * SANTIS OS — Express App Factory
 * @description Builds the Express application with all middleware and routes.
 * All stateful deps (repos, registries, bus, sseManager) injected — never re-instantiated here.
 */

import express, { type Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { dynamicCorsDelegate } from "../security/origin-policy.js";
import { verifySessionToken } from "../security/crypto-token.js";

import type { SovereignBus } from "@santis/sovereign-bus";
import type { SseManager } from "../services/sse-manager.js";
import type { FallbackSseRegistry } from "../services/fallback-sse-registry.js";
import type {
  InMemoryIntentSnapshotRepository,
  InMemoryMoodReadModelRepository,
  InMemoryGuestSessionRepository,
} from "../infrastructure/in-memory-adapters.js";
import type { OutboxRepository } from "@santis/application/outbox/repository";
import type { FallbackIncidentsReadModelRepository } from "@santis/application/projections/fallback-incidents/repository";


import { CommandIngressService } from "../services/command-ingress.js";
import { createIngressRouter } from "../routes/ingress.js";
import { registerGuestSelectMoodFlow } from "@santis/application/bootstrap/register-guest-select-mood";
import { registerBoardroomProjections } from "../projections/boardroom-projections.js";
import { registerCoreStateRoute } from "../routes/core-state.js";
import { sendNack } from "../utils/http-contract.js";

import { createReadRoutes } from "../routes/read-queries.js";
import { createHistoryReadRouter } from "../routes/read-history.js";
import { createSseRoutes } from "../routes/sse-streams.js";
import { createFallbackIncidentsReadRouter } from "../routes/read-fallback-incidents.js";
import { createFallbackSseRouter } from "../routes/sse-fallback-streams.js";
import pricingRouter from "../routes/pricing.route.js";
import streamRoutes from "../routes/stream.route.js";
import { createStrategyRouter } from "../routes/strategy.js";
import { authRouter } from "../routes/auth.routes.js";
import { boardroomRouter } from "../routes/boardroom.js";
import { cognitiveBoardroomRouter } from "../routes/boardroom-cognitive-analysis.js";
import { oracleStreamRouter } from "../routes/oracle-stream.js";
import { oracleActionMemoryRouter } from "../oracle/oracle-action-memory.routes.js";
import { oracleNodeSyncRouter } from "../oracle/oracle-node-sync.routes.js";
import { oracleGlobalAggregationRouter } from "../oracle/oracle-global-aggregation.routes.js";
import { oracleCrossNodeLearningRouter } from "../oracle/oracle-cross-node-learning.routes.js";
import { oracleStrategySimulationRouter } from "../oracle/oracle-strategy-simulation.routes.js";
import { oracleExecutionGuardRouter } from "../oracle/oracle-execution-guard.routes.js";
import { oracleExecutionOutcomeRouter } from "../oracle/oracle-execution-outcome.routes.js";
import { oracleStatisticalForecastRouter } from "../oracle/oracle-statistical-forecast.routes.js";
import { oracleDecisionKernelRouter } from "../oracle/oracle-decision-kernel.routes.js";
import { telemetryRouter } from "../telemetry.routes.js";
import { navRouter } from "../routes/nav.routes.js";
import type { InMemoryUnitOfWork } from "@santis/application/uow/in-memory-uow";

export type AppDeps = {
  bus: SovereignBus;
  sseManager: SseManager;
  fallbackSseRegistry: FallbackSseRegistry;
  uow: InMemoryUnitOfWork;
  guestSessionRepo: InMemoryGuestSessionRepository;
  intentSnapshotRepo: InMemoryIntentSnapshotRepository;
  moodReadModelRepo: InMemoryMoodReadModelRepository;
  outboxRepo: OutboxRepository;
  fallbackRepo: FallbackIncidentsReadModelRepository;
};

export function createExpressApp(deps: AppDeps): Express {
  const {
    bus,
    sseManager,
    fallbackSseRegistry,
    uow,
    guestSessionRepo,
    intentSnapshotRepo,
    moodReadModelRepo,
    outboxRepo,
    fallbackRepo,
  } = deps;

  // --- Application Flow Registration ---
  registerGuestSelectMoodFlow({
    bus,
    uow,
    guestSessionRepo,
    intentSnapshotRepo,
    outboxRepo,
    moodReadModelRepo,
  });

  const commandIngress = new CommandIngressService(bus);

  // --- Express Setup ---
  const app = express();

  // DOS Protection + CORS vary header
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Vary", "Origin");
    next();
  });
  app.use(cors(dynamicCorsDelegate));
  app.use(express.json({ limit: "100kb" }));

  // --- Health Checks ---
  app.get("/api/v1/health/public", (_req: Request, res: Response) => {
    res.json({ status: "OK", version: "1.0.0" });
  });

  app.get("/api/v1/health/god", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const payload = verifySessionToken(token);
      if (payload.role !== "admin" && (payload.role as string) !== "god") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }
      res.json({
        status: "SOVEREIGN_OS_ONLINE",
        version: "1.0.0",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(403).json({ error: `Forbidden: ${message}` });
    }
  });

  // --- Projections ---
  registerBoardroomProjections(bus);

  // --- Routes ---
  app.use("/api/v1", createIngressRouter(bus, commandIngress));
  app.use("/api/v1/boardroom", boardroomRouter);
  app.use("/api/v1/boardroom", cognitiveBoardroomRouter);
  app.use("/api/v1/streams", oracleStreamRouter);
  app.use("/api/v1/oracle", oracleActionMemoryRouter);
  app.use("/api/v1/oracle", oracleNodeSyncRouter);
  app.use("/api/v1/oracle", oracleGlobalAggregationRouter);
  app.use("/api/v1/oracle", oracleCrossNodeLearningRouter);
  app.use("/api/v1/oracle", oracleStrategySimulationRouter);
  app.use("/api/v1/oracle", oracleExecutionGuardRouter);
  app.use("/api/v1/oracle", oracleExecutionOutcomeRouter);
  app.use("/api/v1/oracle", oracleStatisticalForecastRouter);
  app.use("/api/v1/decision-kernel", oracleDecisionKernelRouter);
  app.use("/api/v1", telemetryRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", navRouter);
  app.use("/api/v1/rituals/pricing", pricingRouter);
  app.use("/api/v1/stream", streamRoutes);
  app.use("/api/v1/strategy", createStrategyRouter(bus));

  // SSE Core-State stream (injected sseManager — NOT singleton)
  app.get("/api/v1/core-state/stream", (req: Request, res: Response) => {
    sseManager.addClient(req, res);
  });

  registerCoreStateRoute(app);

  // Read model routes (injected intentSnapshotRepo — NOT re-instantiated)
  app.use("/api/v1/read", createReadRoutes(intentSnapshotRepo));
  app.use("/api/v1/read", createHistoryReadRouter());
  app.use("/", createFallbackIncidentsReadRouter({ repo: fallbackRepo }));

  // SSE fallback stream routes (injected registry — NOT re-instantiated)
  app.use("/api/v1/streams", createSseRoutes(intentSnapshotRepo));
  app.use("/", createFallbackSseRouter({ repo: fallbackRepo, registry: fallbackSseRegistry }));

  return app;
}
