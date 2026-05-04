import { db } from "../db.js";
import { eventStore } from "@santis/db";
import { SantisEvent, SantisEventSchema } from "@santis/event-dictionary";

export class PostgresEventStore {
  /**
   * 1. KAYIT (Append): Olayı silinmez deftere yazar.
   */
  async append(event: SantisEvent): Promise<void> {
    await db.insert(eventStore).values({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.sessionId || event.tenant?.hotelId || "system",
      payload: event.payload,
      traceId: event.traceId,
      occurredAt: new Date(event.occurredAt),
    });
  }

  /**
   * 2. ZAMANDA YOLCULUK (Replay): Tüm geçmişi okur ve projeksiyonları yeniden kurar.
   */
  async replay(hydrator: (event: SantisEvent) => void): Promise<number> {
    console.log("⏪ [Event Store] Akaşik Kayıtlar (Postgres) okunuyor... Zamanda yolculuk başlatıldı.");

    // In a real prod environment we'd use cursors/streams, but for now we fetch all ordered by occurredAt
    const events = await db.query.eventStore.findMany({
      orderBy: (eventStore, { asc }) => [asc(eventStore.occurredAt)]
    });

    let eventCount = 0;
    const start = performance.now();

    for (const row of events) {
      try {
        const event = toSantisEvent(row, "replayed-session", "REPLAY");
        hydrator(event);
        eventCount++;
      } catch (error) {
        console.error("🚨 [Event Store] Bozuk zaman çizgisi satırı atlandı:", error);
      }
    }

    const duration = (performance.now() - start).toFixed(2);
    console.log(`✅ [Event Store] ${eventCount} olay ${duration}ms içinde başarıyla re-hidrate edildi!`);
    return eventCount;
  }

  /**
   * 3. AKAŞİK KAYITLAR (History): GodMode için son olayları getirir
   */
  async getTail(limit: number = 50): Promise<SantisEvent[]> {
    const events = await db.query.eventStore.findMany({
      orderBy: (eventStore, { desc }) => [desc(eventStore.occurredAt)],
      limit
    });

    return events.reverse().map((row) => toSantisEvent(row, "tail-session", "TAIL"));
  }
}

type EventStoreRow = typeof eventStore.$inferSelect;

function toSantisEvent(row: EventStoreRow, sessionId: string, hotelCode: string): SantisEvent {
  return SantisEventSchema.parse({
    eventId: row.eventId,
    eventType: row.eventType,
    payload: row.payload,
    traceId: row.traceId,
    occurredAt: row.occurredAt.toISOString(),
    sessionId,
    tenant: {
      hotelId: "00000000-0000-0000-0000-000000000000",
      hotelCode,
      region: "EU",
      locale: "en",
      currency: "EUR",
      activePolicies: [],
      fallbackMode: false,
    },
    intent: {
      isReturningGuest: false,
      segment: "explorer",
      moodAffinity: [],
      premiumThreshold: 0,
    },
    schemaVersion: "v1",
  });
}
