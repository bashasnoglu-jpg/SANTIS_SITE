import { clickhouse } from '../infrastructure/clickhouse';

export interface DailyExecutiveKPI {
  tenantCode: string;
  date: string;
  totalMoodSelections: number;
  totalPremiumUpsells: number;
  totalUpsellRevenue: number;
}

/**
 * THE BOARDROOM READ MODEL
 * 
 * CEO ve C-Level yöneticilerin "God's Eye" ekranına veri döndüren Okuma Katmanı (CQRS - Read).
 * Asla hesaplama yapmaz; her saniye güncellenen ClickHouse "Materialized View" projeksiyonunu
 * doğrudan okuyarak milisaniyelik raporlar üretir.
 */
export class BoardroomReadModel {
  
  /**
   * Bir otelin günlük executive KPI'larını inanılmaz bir hızla döndürür.
   */
  static async getHotelDailyKPIs(tenantId: string, dateStr: string): Promise<DailyExecutiveKPI | null> {
    const result = await clickhouse.query({
      query: `
        SELECT 
            tenant_code as tenantCode,
            toString(date) as date,
            sumMerge(total_mood_selections) as totalMoodSelections,
            sumMerge(total_premium_upsells) as totalPremiumUpsells,
            sumMerge(total_upsell_revenue) as totalUpsellRevenue
        FROM default.hotel_daily_kpis_mv
        WHERE tenant_id = {tenant_id: UUID} AND date = {date: Date}
        GROUP BY tenantCode, date
      `,
      query_params: {
        tenant_id: tenantId,
        date: dateStr
      }
    });

    const rows = await result.json<{data: DailyExecutiveKPI[]}>();
    return rows.data[0] || null;
  }

  /**
   * Bölgedeki tüm otellerin (EU, MEA) performansını anlık yan yana karşılaştırır.
   */
  static async getRegionalLeaderboard(dateStr: string): Promise<DailyExecutiveKPI[]> {
    const result = await clickhouse.query({
      query: `
        SELECT 
            tenant_code as tenantCode,
            sumMerge(total_upsell_revenue) as totalUpsellRevenue,
            sumMerge(total_premium_upsells) as totalPremiumUpsells
        FROM default.hotel_daily_kpis_mv
        WHERE date = {date: Date}
        GROUP BY tenantCode
        ORDER BY totalUpsellRevenue DESC
      `,
      query_params: { date: dateStr }
    });

    const rows = await result.json<{data: DailyExecutiveKPI[]}>();
    return rows.data;
  }
}
