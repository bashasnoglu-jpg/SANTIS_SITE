import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { WebSocketServer } from "ws";

import { SovereignBus } from "@santis/sovereign-bus";
import { CommandIngressService } from "./services/command-ingress";
import { createIngressRouter } from "./routes/ingress";
import { evaluateConciergeRules, deriveSignalFromDecision } from './decision-kernel';
import { broadcastToGodMode } from "./routes/sse-streams";

import { createReadRoutes } from "./routes/read-queries";
import { createHistoryReadRouter } from "./routes/read-history";
import { createSseRoutes } from "./routes/sse-streams";
import { createFallbackIncidentsReadRouter } from "./routes/read-fallback-incidents";
import { createFallbackSseRouter } from "./routes/sse-fallback-streams";
import pricingRouter from "./routes/pricing.route";
import streamRoutes from "./routes/stream.route";
import { registerCoreStateRoute } from "./routes/core-state";
import { createCoreStateStreamRouter } from "./routes/core-state-stream";

import { boardroomRouter } from "./routes/boardroom";
import { oracleActionMemoryRouter } from "./oracle/oracle-action-memory.routes";
import { oracleNodeSyncRouter } from "./oracle/oracle-node-sync.routes";
import { oracleGlobalAggregationRouter } from "./oracle/oracle-global-aggregation.routes";
import { oracleCrossNodeLearningRouter } from "./oracle/oracle-cross-node-learning.routes";
import { oracleStrategySimulationRouter } from "./oracle/oracle-strategy-simulation.routes";
import { oracleExecutionGuardRouter } from "./oracle/oracle-execution-guard.routes";
import { oracleExecutionOutcomeRouter } from "./oracle/oracle-execution-outcome.routes";
import { oracleStatisticalForecastRouter } from "./oracle/oracle-statistical-forecast.routes";
import { oracleDecisionKernelRouter } from "./oracle/oracle-decision-kernel.routes";
import { telemetryRouter } from "./telemetry.routes";
import { navRouter } from "./routes/nav.routes";
import { registerBoardroomProjections } from "./projections/boardroom-projections";

import { EventStore } from "./infrastructure/event-store";
import { projectEvent } from "./projections/boardroom-projections";

import { FallbackSseRegistry } from "./services/fallback-sse-registry";
import {
  InMemoryIntentSnapshotRepository,
  InMemoryOutboxRepository,
  InMemoryMoodReadModelRepository,
  InMemoryGuestSessionRepository,
} from "../../../tests/helpers/in-memory-fakes";
import { InMemoryUnitOfWork } from "@santis/application/uow/in-memory-uow";
import { registerGuestSelectMoodFlow } from "@santis/application/bootstrap/register-guest-select-mood";

import { sendNack } from "./utils/http-contract";
import { createTechnicalDebtRouter } from "./routes/technical-debt.routes";

async function bootstrap() {
  console.log("⚡ [Ingestion API] Booting Sovereign Backend...");

  await EventStore.replay(projectEvent);

  const bus = new SovereignBus();

  const WS_PORT = process.env.WS_PORT || 8080;
  const wss = new WebSocketServer({ port: Number(WS_PORT) });
  
  wss.on('connection', (ws) => {
    console.log(`🔌 [WebSocket Gateway] İstemci bağlandı.`);
    ws.send(JSON.stringify({ type: "CONNECTION_ACK", message: "Sovereign WS Gateway Connected." }));
    ws.on('error', (err) => console.error('[WS Gateway] Hata:', err));
  });

  bus.addObserver({
    onEventPublished: async (event) => {
      await EventStore.append(event).catch(err => 
        console.error("🚨 [Event Store] Kritik Yazma Hatası!", err)
      );

      const payloadData = (event.payload || {}) as Record<string, any>;
      const metrics = {
        hesitation_index: Number(payloadData.hesitation_index || 0),
        abandon_risk: Number(payloadData.abandon_risk || 0),
        stress_index: Number(payloadData.stress_index || 0),
        therapist_stress: Number(payloadData.therapist_stress || 0),
      };
      
      const decision = evaluateConciergeRules(metrics);
      const signalType = deriveSignalFromDecision(decision);

      broadcastToGodMode("EVENT_STREAM", {
        ...event,
        signalType,
        decision
      });

      const wsMessage = JSON.stringify({ type: "TELEMETRY", payload: { value: 1 } });
      wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(wsMessage);
      });
    }
  });

  const uow = new InMemoryUnitOfWork();
  const guestSessionRepo = new InMemoryGuestSessionRepository();
  const intentSnapshotRepo = new InMemoryIntentSnapshotRepository();
  const outboxRepo = new InMemoryOutboxRepository();
  const moodReadModelRepo = new InMemoryMoodReadModelRepository();

  registerGuestSelectMoodFlow({ bus, uow, guestSessionRepo, intentSnapshotRepo, outboxRepo, moodReadModelRepo });

  const commandIngress = new CommandIngressService(bus);
  const fallbackSseRegistry = new FallbackSseRegistry();

  const app = express();
  app.use(cors({ origin: "*" })); 
  app.use(express.json({ limit: "100kb" })); 

  app.get("/api/v1/analytics/god/health", (_req, res) => {
    res.json({ status: "SOVEREIGN_OS_ONLINE", timestamp: new Date().toISOString() });
  });

  registerBoardroomProjections(bus);

  app.use("/api/v1", createIngressRouter(bus, commandIngress));
  app.use("/api/v1", createTechnicalDebtRouter());
  app.use("/api/v1/boardroom", boardroomRouter);
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
  app.use("/api/v1", navRouter);
  app.use("/api/v1/rituals/pricing", pricingRouter);
  app.use("/api/v1/stream", streamRoutes);
  
  registerCoreStateRoute(app);
  app.use("/api/v1", createCoreStateStreamRouter());

  app.use("/api/v1/read", createReadRoutes(intentSnapshotRepo));
  app.use("/api/v1/read", createHistoryReadRouter());
  app.use("/", createFallbackIncidentsReadRouter({ repo: fallbackSseRegistry }));

  app.use("/api/v1/streams", createSseRoutes(intentSnapshotRepo));
  app.use("/", createFallbackSseRouter({ repo: fallbackSseRegistry, registry: fallbackSseRegistry }));

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers["x-trace-id"] as string) || "unknown-trace";
    return sendNack(res, traceId, { type: "InternalSystemError", message: "System failure" }, 500);
  });

  const PORT = process.env.PORT || 3030;
  app.listen(PORT, () => console.log(`👑 Santis Ingestion running on ${PORT}`));
}

bootstrap();
