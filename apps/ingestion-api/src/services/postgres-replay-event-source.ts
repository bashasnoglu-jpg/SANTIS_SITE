import { eq, lte, asc, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eventStore } from '@santis/db';
import type { SantisEvent } from '@santis/event-dictionary';
import type { ReplayEvent, ReplayEventSource } from './replay-engine.js';

// ─── Schema type (Drizzle infer) ────────────────────────────────────────────

type EventStoreRow = typeof eventStore.$inferSelect;

// ─── Row → ReplayEvent mapper ─────────────────────────────────────────────────

function rowToReplayEvent(row: EventStoreRow): ReplayEvent {
  const payload = row.payload as Record<string, unknown>;

  // Reconstruct a SantisEvent-compatible envelope from the stored row.
  // The payload JSONB column holds the full event body as written by the bus.
  const event: ReplayEvent = {
    eventId:      row.eventId,
    eventType:    row.eventType as SantisEvent['eventType'],
    occurredAt:   row.occurredAt.toISOString(),
    traceId:      row.traceId,
    // Scalar fields from payload (best-effort, may be absent for older events)
    sessionId:    typeof payload['sessionId'] === 'string' ? payload['sessionId'] : 'unknown',
    tenant:       row.tenantId,
    intent:       typeof payload['intent']    === 'string' ? payload['intent']    : 'system',
    schemaVersion: typeof payload['schemaVersion'] === 'string' ? payload['schemaVersion'] : 'v1',
    payload:      (payload['payload'] ?? payload) as SantisEvent['payload'],
    // Attach monotonic seq for replay ordering
    seq:          row.seq,
  } as ReplayEvent;

  return event;
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
