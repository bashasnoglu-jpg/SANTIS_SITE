/**
 * SANTIS OS — Runtime Context Factory
 * @description Single source of truth for all stateful runtime singletons.
 * All other bootstrap modules receive these instances via dependency injection.
 * NEVER instantiate stateful services (repos, registries, managers) outside this file.
 */

import { createPersistenceAdapters } from "../persistence/factory.js";
import { projectEvent } from "../projections/boardroom-projections.js";
import { SseManager } from "../services/sse-manager.js";
import { FallbackSseRegistry } from "../services/fallback-sse-registry.js";
import {
  InMemoryIntentSnapshotRepository,
  InMemoryMoodReadModelRepository,
  InMemoryGuestSessionRepository,
  InMemoryOutboxRepository,
} from "../infrastructure/in-memory-adapters.js";
import { InMemoryUnitOfWork } from "@santis/application/uow/in-memory-uow";
import type { FallbackIncidentsReadModelRepository } from "@santis/application/projections/fallback-incidents/repository";

export type RuntimeContext = Awaited<ReturnType<typeof createRuntimeContext>>;

export async function createRuntimeContext() {
  // 1. Persistence (Postgres veya InMemory — env bazlı)
  const { eventStore, outboxRepo, mode } = createPersistenceAdapters();
  console.log(`⚡ [Ingestion API] Booting Sovereign Backend in ${mode.toUpperCase()} mode...`);

  // 2. Event Replay — RAM'i geçmiş olaylarla doldur
  await eventStore.replay(projectEvent);

  // 3. SSE Manager — singleton, global heartbeat burada başlar (bir kez)
  const sseManager = new SseManager();

  // 4. Fallback SSE Registry — tenant-scoped, tek instance
  const fallbackSseRegistry = new FallbackSseRegistry();

  // 5. In-memory Read Model Repositories — aynı instance hem write hem read tarafına verilmeli
  const uow = new InMemoryUnitOfWork();
  const guestSessionRepo = new InMemoryGuestSessionRepository();
  const intentSnapshotRepo = new InMemoryIntentSnapshotRepository();
  const moodReadModelRepo = new InMemoryMoodReadModelRepository();

  // 6. Dev fallback repo — implements FallbackIncidentsReadModelRepository for structural compatibility
  const fallbackRepo: FallbackIncidentsReadModelRepository = {
    incrementFallbackIncident: async () => {},
    getSnapshot: async () => ({
      tenantId: "dev_tenant",
      window: "5m" as const,
      totalCount: 0,
      byReason: {
        webgpu_unavailable: 0,
        module_load_failed: 0,
        worker_timeout: 0,
        api_timeout: 0,
        device_constraint: 0,
      },
      byTransition: [],
      latestIncidentAt: null,
      lastTraceId: null,
      updatedAt: new Date().toISOString(),
    }),
  };

  return {
    eventStore,
    outboxRepo,
    mode,
    sseManager,
    fallbackSseRegistry,
    uow,
    guestSessionRepo,
    intentSnapshotRepo,
    moodReadModelRepo,
    fallbackRepo,
  };
}
