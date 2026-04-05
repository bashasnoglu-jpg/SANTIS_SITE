import type { SantisEvent } from '@santis/event-dictionary';
import type { SovereignBus } from '@santis/sovereign-bus';
import { clickhouse } from '../infrastructure/clickhouse';

/**
 * SANTIS PROJECTION ENGINE
 * 
 * Veritabanına sızan onaylanmış Canonical Event'leri (SSOT) anlık olarak yakalar,
 * küçük yığınlar (micro-batching) halinde ClickHouse veritabanına basar.
 * 
 * CQRS'in (Command Query Responsibility Segregation) "Data Writer" bileşenidir.
 */
export class ProjectionEngine {
  private batch: SantisEvent[] = [];
  private batchSize = 1000;
  private intervalMs = 2000;

  constructor(private readonly eventBus: SovereignBus) {
    this.startBatchProcessor();
    this.listenToDomainEvents();
  }

  private listenToDomainEvents() {
    // "*" ile Sistemdeki tüm valid eventlere abone olup yığına atıyoruz.
    this.eventBus.subscribeAll((event: SantisEvent) => {
      this.batch.push(event);
      if (this.batch.length >= this.batchSize) {
        this.flush();
      }
    });
  }

  private startBatchProcessor() {
    setInterval(() => this.flush(), this.intervalMs);
  }

  /**
   * Yığılan ham sinyalleri ClickHouse'a "Append-Only" olarak iter.
   */
  private async flush() {
    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];

    // ClickHouse'a stream insert (Yüksek I/O performansı için bulk insert)
    try {
      await clickhouse.insert({
        table: 'santis_raw_events',
        values: currentBatch.map(evt => ({
          event_id: evt.eventId,
          occurred_at: evt.occurredAt,
          tenant_id: evt.tenant.hotelId,
          tenant_code: evt.tenant.hotelCode,
          event_type: evt.eventType,
          guest_segment: evt.intent.segment,
          is_returning_guest: evt.intent.isReturningGuest ? 1 : 0,
          payload: JSON.stringify((evt as any).payload || {}), // Şematik payload
          schema_version: evt.schemaVersion
        })),
        format: 'JSONEachRow'
      });
      // Not: Clickhouse'a başarıyla yazan bir event, Materialized View
      // tarafından anında işlenerek "hotel_daily_kpis_mv" görünümünü günceller.
    } catch (error) {
      console.error('🔥 [L7 Projection Engine] ClickHouse Insert Fail:', error);
      // Fallback: Burada mesajlar Memory yerine Kafka DLQ veya Redis kuyruğuna düşürülmelidir
    }
  }
}
