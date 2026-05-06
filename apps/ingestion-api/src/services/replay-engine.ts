import type { SantisEvent } from '@santis/event-dictionary';

export type ReplayEvent = SantisEvent & {
  seq: number; // monotonic — guaranteed by event_store serial column
};

<<<<<<< HEAD
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


=======
export type ReplayEventSource = (options: {
  fromSeq?: number;
  toSeq?: number;
}) => Promise<ReplayEvent[]>;
>>>>>>> c0d39d7d (fix(ingestion-api): resolve merge conflicts — keep origin/main refactors + Sprint B hard-fail guard)

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
<<<<<<< HEAD
  async getEventStream(options: {
    fromSeq?: number;
    toSeq?: number;
    tenantId?: string;
  } = {}): Promise<ReplayEvent[]> {
    const events = await this.eventSource.getEvents(options);
    // DB already orders by seq ASC — defensive sort here as safety net
    return [...events].sort((a, b) => a.seq - b.seq);
=======
  async getEventStream(options: { fromSeq?: number; toSeq?: number } = {}): Promise<ReplayEvent[]> {
    const { fromSeq = 0, toSeq } = options;
    const events = await this.eventSource({ fromSeq, toSeq });

    return [...events].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
>>>>>>> c0d39d7d (fix(ingestion-api): resolve merge conflicts — keep origin/main refactors + Sprint B hard-fail guard)
  }

  /**
   * State Reconstruction (Hydration)
   * Bir state nesnesini, event stream'i üzerine uygulayarak günceller.
   */
  async hydrateState<T>(
    initialState: T,
    reducer: (state: T, event: ReplayEvent) => T,
<<<<<<< HEAD
    options: { toSeq?: number; tenantId?: string } = {}
=======
    options: { toSeq?: number } = {}
>>>>>>> c0d39d7d (fix(ingestion-api): resolve merge conflicts — keep origin/main refactors + Sprint B hard-fail guard)
  ): Promise<{ state: T; lastSeq: number }> {
    const stream = await this.getEventStream(options);

    let currentState = initialState;
    let lastSeq = 0;

    for (const event of stream) {
      currentState = reducer(currentState, event);
<<<<<<< HEAD
      lastSeq = event.seq;
=======
      lastSeq = event.seq ?? lastSeq;
>>>>>>> c0d39d7d (fix(ingestion-api): resolve merge conflicts — keep origin/main refactors + Sprint B hard-fail guard)
    }

    return { state: currentState, lastSeq };
  }
}
