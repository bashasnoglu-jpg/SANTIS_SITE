import { clickhouse } from './clickhouse';

export async function bootstrapClickHouseSchema() {
  console.log('🛡️ [L7 Boardroom] ClickHouse şemaları doğrulanıyor...');

  // 1. RAW EVENTS TABLOSU (Tek Gerçeklik Kaynağının Veri Ambarındaki Hali)
  // MergeTree motoru ile devasa verileri sıkıştırır ve saniyede milyonlarca satır yazmaya izin verir.
  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS default.santis_raw_events (
          event_id UUID,
          occurred_at DateTime64(3, 'UTC'),
          tenant_id UUID,
          tenant_code String,
          event_type LowCardinality(String),
          guest_segment LowCardinality(String),
          is_returning_guest UInt8,
          payload String,
          schema_version String
      ) 
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(occurred_at)
      ORDER BY (tenant_id, event_type, occurred_at)
    `,
  });

  // 2. DAILY KPI MATERIALIZED VIEW (Görünüm İzdüşümü)
  // Boardroom Ekranı asla milyarlarca satırlık Raw tablosunu yormaz!
  // Gelen verileri anında (stream-processing) günlük KPI olarak toplayıp ayrı bir tabloda tutar.
  await clickhouse.command({
    query: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS default.hotel_daily_kpis_mv
      ENGINE = AggregatingMergeTree()
      ORDER BY (tenant_id, date)
      AS SELECT
          tenant_id,
          tenant_code,
          toDate(occurred_at) AS date,
          
          count() AS total_events,
          countIf(event_type = 'experience.interaction.mood_selected') AS total_mood_selections,
          countIf(event_type = 'commerce.upsell.therapist_accepted') AS total_premium_upsells,
          sumIf(JSONExtractFloat(payload, 'upsellAmount'), event_type = 'commerce.upsell.therapist_accepted') AS total_upsell_revenue
      
      FROM default.santis_raw_events
      GROUP BY tenant_id, tenant_code, date
    `,
  });

  console.log('✅ [L7 Boardroom] ClickHouse şemaları hazır (Projection Ready).');
}
