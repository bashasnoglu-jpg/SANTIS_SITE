import { PostgresEventStore } from "./event-store.postgres.js";
import { PostgresOutboxRepository } from "./outbox.postgres.js";
import { InMemoryOutboxRepository } from "../infrastructure/in-memory-adapters.js";
import { EventStore as InMemoryEventStore } from "../infrastructure/event-store.js";

// Currently index.ts has its own InMemoryEventStore mapped via static object `EventStore`.
// To support DI properly without rewriting too much of index.ts, we can return the objects here.

export function createPersistenceAdapters() {
  const isProd = process.env.NODE_ENV === "production";
  const mode = process.env.PERSISTENCE_MODE ?? "memory";

  if (isProd && mode !== "postgres") {
    throw new Error("Production requires PERSISTENCE_MODE=postgres");
  }

  if (mode === "postgres") {
    // 1. Check if DATABASE_URL is set as requested in Gate 3
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set for postgres persistence mode.");
    }

    return {
      eventStore: new PostgresEventStore(),
      outboxRepo: new PostgresOutboxRepository(),
      mode: "postgres" as const,
    };
  }

  // Fallback to memory
  return {
    eventStore: InMemoryEventStore,
    outboxRepo: new InMemoryOutboxRepository(),
    mode: "memory" as const,
  };
}
