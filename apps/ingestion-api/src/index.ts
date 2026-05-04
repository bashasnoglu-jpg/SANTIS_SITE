import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import type { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { dynamicCorsDelegate, isOriginAllowed } from "./security/origin-policy";
import { SantisEventEnvelope, EventPayloadRecord } from "./types";

import { SovereignBus } from "@santis/sovereign-bus";
import { registerCommandHandlers } from "./handlers/register-command-handlers";
import { CommandIngressService } from "./services/command-ingress";
import { createIngressRouter } from "./routes/ingress";
import { evaluateConciergeRules, deriveSignalFromDecision } from './decision-kernel';
import { broadcastToGodMode } from "./routes/sse-streams";
import { resolveWebSocketGatewayConfig } from "./config/websocket-gateway.config";
import { sseManager } from "./services/sse-manager.js";


import { createReadRoutes } from "./routes/read-queries";
import { createHistoryReadRouter } from "./routes/read-history";
import { createSseRoutes } from "./routes/sse-streams";
import { createFallbackIncidentsReadRouter } from "./routes/read-fallback-incidents";
import { createFallbackSseRouter } from "./routes/sse-fallback-streams";
import pricingRouter from "./routes/pricing.route";
import streamRoutes from "./routes/stream.route";
import { registerCoreStateRoute } from "./routes/core-state";
import { createStrategyRouter } from "./routes/strategy.js";

import { authRouter } from "./routes/auth.routes";
import { verifySessionToken, type SessionTokenPayload } from "./security/crypto-token";

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

import { projectEvent } from "./projections/boardroom-projections";

import { FallbackSseRegistry } from "./services/fallback-sse-registry";
import {
  InMemoryIntentSnapshotRepository,
  InMemoryMoodReadModelRepository,
  InMemoryGuestSessionRepository,
} from "../../../tests/helpers/in-memory-fakes";
import { InMemoryUnitOfWork } from "@santis/application/uow/in-memory-uow";
import { registerGuestSelectMoodFlow } from "@santis/application/bootstrap/register-guest-select-mood";

import { sendNack } from "./utils/http-contract";
import { createPersistenceAdapters } from "./persistence/factory.js";

type WebSocketUpgradeRequest = IncomingMessage & { session?: SessionTokenPayload };
type VerifyClientInfo = {
  origin?: string;
  req: WebSocketUpgradeRequest;
};
type VerifyClientCallback = (verified: boolean, code?: number, message?: string) => void;

async function bootstrap() {
  const { eventStore: EventStore, outboxRepo, mode } = createPersistenceAdapters();
  console.log(`⚡ [Ingestion API] Booting Sovereign Backend in ${mode.toUpperCase()} mode...`);

  // 1. ZAMANDA YOLCULUK: Geçmiş olayları diskten oku ve RAM'i doldur (Rehydration)
  await EventStore.replay(projectEvent);

  // 2. Core Altyapı
  const bus = new SovereignBus();
  registerCommandHandlers(bus);

  // --- WEBSOCKET GATEWAY (Port 8080) ---
  const wsConfig = resolveWebSocketGatewayConfig();
  const wss = new WebSocketServer({ 
    host: wsConfig.WS_HOST,
    port: wsConfig.WS_PORT,
    path: wsConfig.WS_PATH,
    verifyClient: (info: VerifyClientInfo, callback: VerifyClientCallback) => {
      const origin = info.origin;
      const isAllowed = origin && isOriginAllowed(origin, wsConfig.WS_ALLOWED_ORIGIN_PATTERNS);

      if (!isAllowed) {
        console.warn(JSON.stringify({
          event: "WS_CORS_REJECTED",
          severity: "WARNING",
          timestamp: new Date().toISOString(),
          origin: origin || "UNKNOWN"
        }));
        return callback(false, 403, "Forbidden Origin");
      }

      // Token check
      try {
        const urlObj = new URL(info.req.url || "", `http://${info.req.headers.host || "localhost"}`);
        const token = urlObj.searchParams.get("token");

        if (!token) {
          console.warn(`🚨 [Security] WS Rejected: Missing bearer query token`);
          return callback(false, 401, "Unauthorized - Missing Token");
        }

        const payload = verifySessionToken(token);
        // Extend info.req to store session context if needed later
        info.req.session = payload;
        
        callback(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`🚨 [Security] WS Rejected: Invalid or expired token -> ${message}`);
        return callback(false, 403, "Forbidden Token");
      }
    }
  });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log(`🔌 [WebSocket Gateway] İstemci bağlandı.`);
    ws.send(JSON.stringify({ type: "CONNECTION_ACK", message: "Sovereign WS Gateway Connected." }));
    
    ws.on('error', (err: Error) => {
      console.error('[WS Gateway] Hata:', err);
    });
  });

  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║  📡 WEBSOCKET GATEWAY ONLINE                      ║
  ║  Host: ${wsConfig.WS_HOST}
  ║  Port: ${wsConfig.WS_PORT}
  ║  Path: ${wsConfig.WS_PATH}
  ╚═══════════════════════════════════════════════════╝
  `);
  
  // 3. FIREHOSE: Bundan sonra olacak HER ŞEYİ silinmez deftere kaydet
  bus.addObserver({
    onEventPublished: async (event) => {
      await EventStore.append(event).catch(err => 
        console.error("🚨 [Event Store] Kritik Yazma Hatası!", err)
      );

      // --- Zeka Katmanı Entegrasyonu ---
      const payloadData = (event.payload || {}) as EventPayloadRecord;
      const metrics = {
        hesitation_index: Number(payloadData.hesitation_index || 0),
        abandon_risk: Number(payloadData.abandon_risk || 0),
        stress_index: Number(payloadData.stress_index || 0),
        therapist_stress: Number(payloadData.therapist_stress || 0),
      };
      
      const decision = evaluateConciergeRules(metrics);
      const signalType = deriveSignalFromDecision(decision);

      // God Mode Radar'a Fırlat
      broadcastToGodMode("EVENT_STREAM", {
        ...event,
        signalType,
        decision
      });

      // --- WEBSOCKET CANLI YAYINI (BROADCAST) ---
      // Frontend (Boardroom Pro) UI updaters ile eşleşen format
      let wsPayloadType = "TELEMETRY";
      let wsPayloadValue: unknown = 1; // Default sayım
      
      const evtType = (event as SantisEventEnvelope).eventType || (event as SantisEventEnvelope).type;

      // Event tipine göre payload hazırlama
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
      } else if (evtType === 'pricing.recommendation.created') {
         wsPayloadType = "ACTION_RAIL_UPDATE";
         wsPayloadValue = payloadData.id || 1;
      }


      const wsMessage = JSON.stringify({
          type: wsPayloadType,
          message: `Olay: ${evtType} (${signalType})`,
          payload: { value: wsPayloadValue },
          value: wsPayloadValue
      });

      // Bağlı olan tüm WS istemcilerine fırlat
      wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
              client.send(wsMessage);
          }
      });

      // --- SSE CORE-STATE BROADCAST (Zero-Drift Feed) ---
      if (["REVENUE_UPDATE", "RISK_SIGNAL", "STRATEGY_APPLY_ACK", "ACTION_RAIL_UPDATE"].includes(wsPayloadType)) {
        const scope: Parameters<typeof sseManager.broadcastPatch>[0] =
          wsPayloadType === "STRATEGY_APPLY_ACK"
            ? "strategy"
            : wsPayloadType === "ACTION_RAIL_UPDATE"
              ? "action_rail"
              : "revenue";
        sseManager.broadcastPatch(scope, {
          value: wsPayloadValue,
          eventType: evtType,
          occurredAt: event.occurredAt,
          traceId: event.traceId
        });
      }
    }
  });


  const uow = new InMemoryUnitOfWork();
  const guestSessionRepo = new InMemoryGuestSessionRepository();
  const intentSnapshotRepo = new InMemoryIntentSnapshotRepository();
  const moodReadModelRepo = new InMemoryMoodReadModelRepository();

  // Fake Fallback Repo
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

  // 2. Command Flow (UoW, Outbox, Bus) Kayıtları
  registerGuestSelectMoodFlow({
    bus,
    uow,
    guestSessionRepo,
    intentSnapshotRepo,
    outboxRepo,
    moodReadModelRepo,
  });

  // 3. Servisler & Registry'ler
  const commandIngress = new CommandIngressService(bus);
  const fallbackSseRegistry = new FallbackSseRegistry();

  // 4. Express App
  const app = express();

  // DOS Koruması: Raw Body parse limiti 100kb
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Vary", "Origin");
    next();
  });
  app.use(cors(dynamicCorsDelegate));
  app.use(express.json({ limit: "100kb" }));

  // --- HEALTH CHECK ---
  app.get("/api/v1/health/public", (req: Request, res: Response) => {
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
        timestamp: new Date().toISOString()
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(403).json({ error: `Forbidden: ${message}` });
    }
  });

  // 1. Otoriter Okuma Modellerini (Projections) Başlat
  registerBoardroomProjections(bus);

  // --- Otoriter Gümrük Kapısı (COMMAND ROTASI) ---
  app.use("/api/v1", createIngressRouter(bus, commandIngress));
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
  app.use("/api/v1/strategy", createStrategyRouter(bus));
  
  // Otoriter CoreState Stream (SSE)
  app.get("/api/v1/core-state/stream", (req: Request, res: Response) => {
    sseManager.addClient(req, res);
  });

  
  registerCoreStateRoute(app);

  // --- PROJECTION (OKUMA) ROTALARI ---
  app.use("/api/v1/read", createReadRoutes(intentSnapshotRepo));
  app.use("/api/v1/read", createHistoryReadRouter());
  app.use("/", createFallbackIncidentsReadRouter({ repo: fallbackRepo }));

  // --- SSE (CANLI AKIŞ) ROTALARI ---
  app.use("/api/v1/streams", createSseRoutes(intentSnapshotRepo));
  app.use("/", createFallbackSseRouter({ repo: fallbackRepo, registry: fallbackSseRegistry }));

  // --- DEAD-LETTER FALLBACK (Global Error Handler) ---
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers["x-trace-id"] as string) || "unknown-trace";
    
    console.error(`🚨 [Dead-Letter Queue] Kritik Sistem Hatası! Trace: ${traceId}`);
    console.error(err.stack);

    // Dış dünyaya asla stack trace sızdırmayız.
    return sendNack(res, traceId, { 
      type: "InternalSystemError", 
      message: "Otoriter sistem geçici olarak hizmet veremiyor. TraceID ile logları kontrol edin." 
    }, 500);
  });

  // 5. Sunucuyu Başlat (Orijinal limanımız port 3030)
  const PORT = process.env.PORT || 3030;
  const server = app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║  👑 SANTIS INGESTION GATEWAY v1.0                 ║
  ║  Zero-Trust Zod Parse | CQRS Dispatch             ║
  ╠═══════════════════════════════════════════════════╣
  ║  📡 Port: ${PORT}                                      ║
  ║  🛡️  Endpoint: POST /api/v1/commands              ║
  ╚═══════════════════════════════════════════════════╝
    `);
  });

  server.on('error', (e: NodeJS.ErrnoException) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\n❌ [Ingestion API] Port ${PORT} already in use.`);
      console.error(`Run: netstat -ano | findstr :${PORT}`);
      console.error(`Then: taskkill /PID <PID> /F\n`);
      process.exit(1);
    } else {
      console.error('❌ [Ingestion API] Server error:', e);
      process.exit(1);
    }
  });

  // WS Gateway moved to top of bootstrap

}

bootstrap().catch((err) => {
  console.error("🔥 [FATAL] Boot sequence failed:", err);
  process.exit(1);
});
