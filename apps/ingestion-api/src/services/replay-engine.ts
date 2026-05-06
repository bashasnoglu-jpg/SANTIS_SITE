import type { SantisEvent } from '@santis/event-dictionary';

export type ReplayEvent = SantisEvent & {
  seq: number; // monotonic — guaranteed by event_store serial column
};

/**
 * ReplayEventSource contract.
 * Implemented by PostgresReplayEventSource (production) and
 * the default async () => [] stub (test / boot-safe fallback).
 */
export interface ReplayEventSource {
  getEvents(options: { fromSeq?: number; toSeq?: number }): Promise<ReplayEvent[]>;
}

/** Convenience: wrap a plain function as a ReplayEventSource */
export function fnSource(
  fn: (opts: { fromSeq?: number; toSeq?: number }) => Promise<ReplayEvent[]>,
): ReplayEventSource {
  return { getEvents: fn };
}



/**
 * SovereignReplayEngine
 *
 * Legacy DB-backed replay is intentionally quarantined until the canonical
 * event-store adapter is restored. The engine is now dependency-injected so
 * routes can compile without binding to stale @santis/db exports.
 */
export class SovereignReplayEngine {
  constructor(
    private readonly eventSource: ReplayEventSource = fnSource(async () => []),
  ) {}

  /**
   * Belirli bir aralıktaki eventleri monotonic sırada getirir.
   */
  async getEventStream(options: {
    fromSeq?: number;
    toSeq?: number;
    tenantId?: string;
  } = {}): Promise<ReplayEvent[]> {
    const events = await this.eventSource.getEvents(options);
    // DB already orders by seq ASC — defensive sort here as safety net
    return [...events].sort((a, b) => a.seq - b.seq);
  }

  /**
   * State Reconstruction (Hydration)
   * Bir state nesnesini, event stream'i üzerine uygulayarak günceller.
   */
  async hydrateState<T>(
    initialState: T,
    reducer: (state: T, event: ReplayEvent) => T,
    options: { toSeq?: number; tenantId?: string } = {}
  ): Promise<{ state: T; lastSeq: number }> {
    const stream = await this.getEventStream(options);

    let currentState = initialState;
    let lastSeq = 0;

    for (const event of stream) {
      currentState = reducer(currentState, event);
      lastSeq = event.seq;
    }

    return { state: currentState, lastSeq };
  }
}
