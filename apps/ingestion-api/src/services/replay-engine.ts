import type { SantisEvent } from '@santis/event-dictionary';

export type ReplayEvent = SantisEvent & {
  seq?: number;
};

export type ReplayEventSource = (options: {
  fromSeq?: number;
  toSeq?: number;
}) => Promise<ReplayEvent[]>;

/**
 * SovereignReplayEngine
 *
 * Legacy DB-backed replay is intentionally quarantined until the canonical
 * event-store adapter is restored. The engine is now dependency-injected so
 * routes can compile without binding to stale @santis/db exports.
 */
export class SovereignReplayEngine {
  constructor(private readonly eventSource: ReplayEventSource = async () => []) {}

  /**
   * Belirli bir aralıktaki eventleri monotonic sırada getirir.
   */
  async getEventStream(options: { fromSeq?: number; toSeq?: number } = {}): Promise<ReplayEvent[]> {
    const { fromSeq = 0, toSeq } = options;
    const events = await this.eventSource({ fromSeq, toSeq });

    return [...events].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  }

  /**
   * State Reconstruction (Hydration)
   * Bir state nesnesini, event stream'i üzerine uygulayarak günceller.
   */
  async hydrateState<T>(
    initialState: T,
    reducer: (state: T, event: ReplayEvent) => T,
    options: { toSeq?: number } = {}
  ): Promise<{ state: T; lastSeq: number }> {
    const stream = await this.getEventStream({ toSeq: options.toSeq });

    let currentState = initialState;
    let lastSeq = 0;

    for (const event of stream) {
      currentState = reducer(currentState, event);
      lastSeq = event.seq ?? lastSeq;
    }

    return { state: currentState, lastSeq };
  }
}
