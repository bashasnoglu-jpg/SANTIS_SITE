import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { SovereignBus } from "../../../packages/sovereign-bus/src/index.js";
import { CommandIngressService } from "./services/command-ingress.js";
import { createIngressRouter } from "./routes/ingress.js";

import { createReadRoutes } from "./routes/read-queries.js";
import { createSseRoutes } from "./routes/sse-streams.js";
import { createFallbackIncidentsReadRouter } from "./routes/read-fallback-incidents.js";
import { createFallbackSseRouter } from "./routes/sse-fallback-streams.js";

import { boardroomRouter } from "./routes/boardroom.js";
import { registerBoardroomProjections } from "./projections/boardroom-projections.js";

import { EventStore } from "./infrastructure/event-store.js";
import { projectEvent } from "./projections/boardroom-projections.js";

import { FallbackSseRegistry } from "./services/fallback-sse-registry.js";
import {
  InMemoryIntentSnapshotRepository,
  InMemoryOutboxRepository,
  InMemoryMoodReadModelRepository,
  InMemoryGuestSessionRepository,
} from "../../../tests/helpers/in-memory-fakes.js";
import { InMemoryUnitOfWork } from "../../../packages/application/src/uow/in-memory-uow.js";
import { registerGuestSelectMoodFlow } from "../../../packages/application/src/bootstrap/register-guest-select-mood.js";

import { sendNack } from "./utils/http-contract.js";

async function bootstrap() {
  console.log("⚡ [Ingestion API] Booting Sovereign Backend...");

  // 1. ZAMANDA YOLCULUK: Geçmiş olayları diskten oku ve RAM'i doldur (Rehydration)
  await EventStore.replay(projectEvent);

  // 2. Core Altyapı
  const bus = new SovereignBus();
  
  // 3. FIREHOSE: Bundan sonra olacak HER ŞEYİ silinmez deftere kaydet
  bus.addObserver({
    onEventPublished: async (event) => {
      await EventStore.append(event).catch(err => 
        console.error("🚨 [Event Store] Kritik Yazma Hatası!", err)
      );
    }
  });

  const uow = new InMemoryUnitOfWork();
  const guestSessionRepo = new InMemoryGuestSessionRepository();
  const intentSnapshotRepo = new InMemoryIntentSnapshotRepository();
  const outboxRepo = new InMemoryOutboxRepository();
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
  const commandIngress = new CommandIngressService(bus.commands);
  const fallbackSseRegistry = new FallbackSseRegistry();

  // 4. Express App
  const app = express();
  
  // DOS Koruması: Raw Body parse limiti 100kb
  app.use(cors({ origin: "*" })); 
  app.use(express.json({ limit: "100kb" })); 

  // --- HEALTH CHECK ---
  app.get("/api/v1/analytics/god/health", (req, res) => {
    res.json({
      status: "SOVEREIGN_OS_ONLINE",
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // 1. Otoriter Okuma Modellerini (Projections) Başlat
  registerBoardroomProjections(bus);

  // --- Otoriter Gümrük Kapısı (COMMAND ROTASI) ---
  app.use("/api/v1", createIngressRouter(bus));
  app.use("/api/v1/boardroom", boardroomRouter);

  // --- PROJECTION (OKUMA) ROTALARI ---
  app.use("/api/v1/read", createReadRoutes(intentSnapshotRepo));
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

  // 5. Sunucuyu Başlat (Orijinal limanımız port 8080)
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
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
}

bootstrap().catch((err) => {
  console.error("🔥 [FATAL] Boot sequence failed:", err);
  process.exit(1);
});
