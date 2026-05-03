import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { WebSocketServer } from "ws";

import { SovereignBus } from "@santis/sovereign-bus";
import { registerCommandHandlers } from "./handlers/register-command-handlers";
import { CommandIngressService } from "./services/command-ingress";
import { createIngressRouter } from "./routes/ingress";
import { evaluateConciergeRules, deriveSignalFromDecision } from './decision-kernel';
import { broadcastToGodMode } from "./routes/sse-streams";
import { resolveWebSocketGatewayConfig } from "./config/websocket-gateway.config";

import { createReadRoutes } from "./routes/read-queries";
import { createHistoryReadRouter } from "./routes/read-history";
import { createSseRoutes } from "./routes/sse-streams";
import { createFallbackIncidentsReadRouter } from "./routes/read-fallback-incidents";
import { createFallbackSseRouter } from "./routes/sse-fallback-streams";
import pricingRouter from "./routes/pricing.route";
import streamRoutes from "./routes/stream.route";
import { registerCoreStateRoute } from "./routes/core-state";
import { createCoreStateStreamRouter } from "./routes/core-state-stream";

import { authRouter } from "./routes/auth.routes";
import { verifySessionToken } from "./security/crypto-token";

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
  registerCommandHandlers(bus);

  const wsConfig = resolveWebSocketGatewayConfig();
  const wss = new WebSocketServer({ 
    host: wsConfig.WS_HOST,
    port: wsConfig.WS_PORT,
    path: wsConfig.WS_PATH,
    verifyClient: (info, callback) => {
      const origin = info.origin;
      const isAllowedExact = origin && wsConfig.WS_ALLOWED_ORIGINS.includes(origin);
      const isAllowedPattern = origin && wsConfig.WS_ALLOWED_ORIGIN_PATTERNS.some(pattern => new RegExp(pattern).test(origin));

      if (!isAllowedExact && !isAllowedPattern) {
        console.warn(`🚨 [Security] WS Rejected: Unauthorized origin -> ${origin || 'UNKNOWN'}`);
        return callback(false, 403, "Forbidden Origin");
      }

      try {
        const urlObj = new URL(info.req.url || "", `http://${info.req.headers.host || "localhost"}`);
        const token = urlObj.searchParams.get("token");

        if (!token) {
          console.warn(`🚨 [Security] WS Rejected: Missing bearer query token`);
          return callback(false, 401, "Unauthorized - Missing Token");
        }

        const payload = verifySessionToken(token);
        (info.req as any).session = payload;
        callback(true);
      } catch (err: any) {
        console.warn(`🚨 [Security] WS Rejected: Invalid or expired token -> ${err.message}`);
        return callback(false, 403, "Forbidden Token");
      }
    }
  });
  
  wss.on('connection', (ws) => {
    console.log(`🔌 [WebSocket Gateway] İstemci bağlandı.`);
    ws.send(JSON.stringify({ type: "CONNECTION_ACK", message: "Sovereign WS Gateway Connected." }));
    ws.on('error', (err) => console.error('[WS Gateway] Hata:', err));
  });

  console.log(`\n📡 WEBSOCKET GATEWAY ONLINE | ${wsConfig.WS_HOST}:${wsConfig.WS_PORT}${wsConfig.WS_PATH}\n`);
  
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

      let wsPayloadType = "TELEMETRY";
      let wsPayloadValue: any = 1;
      const evtType = (event as any).eventType || (event as any).type;

      if (evtType === 'GuestCheckoutCompleted' || evtType === 'RevenueGenerated' || evtType === 'commerce.upsell.therapist_accepted' || evtType === 'commerce.checkout.completed') {
         wsPayloadType = "REVENUE_UPDATE";
         wsPayloadValue = payloadData.totalAmount || payloadData.amount || payloadData.revenue || payloadData.upsellAmount || Math.floor(Math.random() * 500) + 150;
      } else if (decision.includes('risk') || decision.includes('escalate')) {
         wsPayloadType = "RISK_SIGNAL";
         wsPayloadValue = Math.floor(metrics.abandon_risk * 100) || 85;
      } else if (evtType === 'boardroom.oracle.executed') {
         wsPayloadType = "ORACLE_LOOPBACK_ACK";
         wsPayloadValue = payloadData.actionId || 1;
      } else if (evtType === 'boardroom.strategy.applied') {
         wsPayloadType = "STRATEGY_APPLY_ACK";
         wsPayloadValue = payloadData.recommendationId || payloadData.sessionId || "strategy-unknown";
      }

      const wsMessage = JSON.stringify({
          type: wsPayloadType,
          message: `Olay: ${evtType} (${signalType})`,
          payload: { value: wsPayloadValue },
          value: wsPayloadValue
      });

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
  
  const fallbackRepo = {
      incrementFallbackIncident: async () => {},
      getSnapshot: async () => ({
          tenantId: "dev_tenant",
          window: "5m" as const,
          totalCount: 0,
          byReason: { webgpu_unavailable: 0, module_load_failed: 0, worker_timeout: 0, api_timeout: 0, device_constraint: 0 },
          byTransition: [],
          latestIncidentAt: null,
          lastTraceId: null,
          updatedAt: new Date().toISOString()
      })
  };

  registerGuestSelectMoodFlow({
    bus,
    uow,
    guestSessionRepo,
    intentSnapshotRepo,
    outboxRepo,
    moodReadModelRepo,
  });

  const commandIngress = new CommandIngressService(bus);
  const fallbackSseRegistry = new FallbackSseRegistry();

  const app = express();
  app.use(cors({ origin: "*" })); 
  app.use(express.json({ limit: "100kb" })); 

  app.get("/api/v1/analytics/god/health", (_req: Request, res: Response) => {
    res.json({
      status: "SOVEREIGN_OS_ONLINE",
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
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
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", navRouter);
  app.use("/api/v1/rituals/pricing", pricingRouter);
  app.use("/api/v1/stream", streamRoutes);
  
  registerCoreStateRoute(app);
  app.use("/api/v1", createCoreStateStreamRouter());

  app.use("/api/v1/read", createReadRoutes(intentSnapshotRepo));
  app.use("/api/v1/read", createHistoryReadRouter());
  app.use("/", createFallbackIncidentsReadRouter({ repo: fallbackRepo }));

  app.use("/api/v1/streams", createSseRoutes(intentSnapshotRepo));
  app.use("/", createFallbackSseRouter({ repo: fallbackRepo, registry: fallbackSseRegistry }));

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers["x-trace-id"] as string) || "unknown-trace";
    console.error(`🚨 [Dead-Letter Queue] Kritik Sistem Hatası! Trace: ${traceId}`);
    console.error(err.stack);
    return sendNack(res, traceId, { 
      type: "InternalSystemError", 
      message: "Otoriter sistem geçici olarak hizmet veremiyor. TraceID ile logları kontrol edin." 
    }, 500);
  });

  const PORT = process.env.PORT || 3030;
  const server = app.listen(PORT, () => console.log(`👑 Santis Ingestion running on ${PORT}`));

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\n❌ [Ingestion API] Port ${PORT} already in use.`);
      process.exit(1);
    }
    console.error('❌ [Ingestion API] Server error:', e);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error("🔥 [FATAL] Boot sequence failed:", err);
  process.exit(1);
});
