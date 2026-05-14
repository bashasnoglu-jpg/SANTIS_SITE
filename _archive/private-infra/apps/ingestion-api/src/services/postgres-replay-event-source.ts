import { eq, lte, asc, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eventStore } from '@santis/db';
import type { SantisEvent } from '@santis/event-dictionary';
import type { ReplayEvent, ReplayEventSource } from './replay-engine.js';

// ─── Schema type (Drizzle infer) ────────────────────────────────────────────

type EventStoreRow = typeof eventStore.$inferSelect;

// ─── Row → ReplayEvent mapper ─────────────────────────────────────────────────

function rowToReplayEvent(row: EventStoreRow): ReplayEvent {
  // The payload JSONB column stores the full SantisEvent body as written by the bus.
  // Spread it directly and attach the monotonic seq from the DB row.
  // This avoids manual field mapping and the resulting intent/payload type mismatches.
  const santisEvent = row.payload as unknown as SantisEvent;

  return {
    ...santisEvent,
    seq: row.seq,
  };
}


// ─── PostgresReplayEventSource ───────────────────────────────────────────────

/**
 * DI-injectable event source backed by the Drizzle `event_store` table.
 *
 * Dependency boundary:
 *   db instance is injected — PostgresReplayEventSource owns NO connection logic.
 *
 * Query contract:
 *   SELECT * FROM event_store WHERE seq <= $toSeq ORDER BY seq ASC
 *
 * This guarantees causal ordering for boardroomReducer.
 */
export class PostgresReplayEventSource implements ReplayEventSource {
  constructor(
    // Typed as `any` to avoid coupling to the exact Drizzle schema generic —
    // the caller (createRuntimeContext) passes the local db instance.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly db: NodePgDatabase<any>,
    private readonly defaultTenant: string = 'santis',
  ) {}

  async getEvents(options: { 
    fromSeq?: number; 
    toSeq?: number;
    tenantId?: string;
  }): Promise<ReplayEvent[]> {
    const { fromSeq = 0, toSeq, tenantId = this.defaultTenant } = options;

    try {
      let rows: EventStoreRow[];

      if (toSeq !== undefined) {
        rows = await this.db
          .select()
          .from(eventStore)
          .where(lte(eventStore.seq, toSeq))
          .orderBy(asc(eventStore.seq));
      } else {
        // No upper bound → full stream (for latest state hydration)
        rows = await this.db
          .select()
          .from(eventStore)
          .orderBy(asc(eventStore.seq));
      }

      // Apply fromSeq filter in-memory (seq >= fromSeq) — avoids compound index
      const filtered = fromSeq > 0
        ? rows.filter((r) => r.seq >= fromSeq)
        : rows;

      return filtered.map(rowToReplayEvent);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[PostgresReplayEventSource] Query failed: ${message}`);
      // Fail-open: return empty stream rather than crashing the replay endpoint
      return [];
    }
  }
}
