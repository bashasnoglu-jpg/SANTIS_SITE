/**
 * santis-revenue-anomaly-detector.js
 * Analyzes revenue streams to detect spikes, drop-offs, and unusual intent patterns.
 */
export class RevenueAnomalyDetector {
  constructor(baseline = { avgLeadValue: 800, minBookingsForTrend: 2 }) {
    this.baseline = baseline;
    this.history = [];
  }

  analyze(metrics) {
    const insights = [];
    const { revenue, averageLeadValue, bookings } = metrics;

    if (bookings === 0) return insights;

    // 1. High value anomaly
    if (averageLeadValue > this.baseline.avgLeadValue * 1.5) {
      insights.push({
        type: 'anomaly',
        severity: 'high',
        message: 'Average lead value normal bant dışına çıktı. Yüksek değerli paket/upsell hacmi tespit edildi.',
      });
    }

    // 2. Low volume / High value pattern
    if (bookings < this.baseline.minBookingsForTrend && averageLeadValue > this.baseline.avgLeadValue) {
       insights.push({
        type: 'opportunity',
        severity: 'medium',
        message: 'Düşük hacimli fakat yüksek intent kalitesi var. Concierge sıcak teması önerilir.',
      });
    }

    // 3. Velocity anomaly
    if (this.history.length > 0) {
      const prevRevenue = this.history[this.history.length - 1].revenue;
      if (revenue > prevRevenue * 2 && prevRevenue > 0) {
        insights.push({
          type: 'anomaly',
          severity: 'high',
          message: 'Anlık %100+ revenue sıçraması (Spike). Pazarlama kampanyası veya toplu rezervasyon etkisi olabilir.',
        });
      }
    }

    this.history.push({ ts: Date.now(), revenue, bookings });
    // Keep history small
    if (this.history.length > 10) this.history.shift();

    return insights;
  }
}
