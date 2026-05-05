import { db } from '@santis/db';
import { sovereignEvents } from '@santis/db/schema';
import { asc, gte, lte, and } from 'drizzle-orm';
import { BaseEvent } from '@santis/event-dictionary';

/**
 * SovereignReplayEngine
 * Santis OS'in geçmişini yeniden inşa eden ana motor.
 * Event tablosundan monotonic (seq) sırada veri okur.
 */
export class SovereignReplayEngine {
  /**
   * Belirli bir aralıktaki eventleri monotonic sırada getirir.
   */
  async getEventStream(options: { fromSeq?: number; toSeq?: number } = {}): Promise<BaseEvent[]> {
    const { fromSeq = 0, toSeq } = options;

    const filters = [gte(sovereignEvents.seq, fromSeq)];
    if (toSeq) {
      filters.push(lte(sovereignEvents.seq, toSeq));
    }

    const events = await db
      .select()
      .from(sovereignEvents)
      .where(and(...filters))
      .orderBy(asc(sovereignEvents.seq));

    // DB'deki JSONB metadata ve payload'ı BaseEvent yapısına mapliyoruz
    return events.map((e) => ({
      eventId: e.eventId,
      eventType: e.eventType as any,
      traceId: e.traceId,
      timestamp: e.timestamp.toISOString(),
      payload: e.payload,
      metadata: e.metadata,
      seq: e.seq, // Replay sırasında seq bilgisi kritik
    }));
  }

  /**
   * State Reconstruction (Hydration)
   * Bir state nesnesini, event stream'i üzerine uygulayarak günceller.
   */
  async hydrateState<T>(
    initialState: T,
    reducer: (state: T, event: BaseEvent) => T,
    options: { toSeq?: number } = {}
  ): Promise<{ state: T; lastSeq: number }> {
    const stream = await this.getEventStream({ toSeq: options.toSeq });
    
    let currentState = initialState;
    let lastSeq = 0;

    for (const event of stream) {
      currentState = reducer(currentState, event);
      lastSeq = event.seq || lastSeq;
    }

    return { state: currentState, lastSeq };
  }
}
