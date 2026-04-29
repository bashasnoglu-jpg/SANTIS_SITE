/**
 * santis-oracle-strategic-alerts.js
 * Converts calibrated Oracle signals into strategic Boardroom alerts.
 */
export class SantisOracleStrategicAlerts {
  generate(insights = [], metrics = {}) {
    const alerts = [];
    const vipLeads = Number(metrics.vipLeads || this.getVipSegmentCount(metrics) || 0);
    const bookings = Number(metrics.bookings || metrics.bookingCount || 0);
    const averageLeadValue = Number(metrics.averageLeadValue || 0);
    const highConfidenceOpportunity = insights.find((insight) => (
      insight.type === 'opportunity' && Number(insight.confidenceScore || 0) >= 80
    ));
    const highRiskAnomaly = insights.find((insight) => (
      insight.type === 'anomaly' && insight.riskLevel === 'high'
    ));

    if (vipLeads > 0 && bookings > 0 && vipLeads / bookings >= 0.5) {
      alerts.push({
        level: 'high',
        title: 'VIP intent is outpacing volume',
        detail: 'Premium demand quality is stronger than raw booking count. Treat this as a high-value conversion window.',
      });
    }

    if (highConfidenceOpportunity) {
      alerts.push({
        level: 'medium',
        title: 'Concierge window is active',
        detail: `${highConfidenceOpportunity.confidenceScore}% confidence on a premium opportunity. Keep human approval in the loop before execution.`,
      });
    }

    if (highRiskAnomaly) {
      alerts.push({
        level: 'high',
        title: 'Revenue pattern needs executive review',
        detail: 'A high-risk anomaly is present. Validate campaign source, team capacity, and premium inventory before scaling exposure.',
      });
    }

    if (averageLeadValue >= 1200 && bookings <= 2 && bookings > 0) {
      alerts.push({
        level: 'medium',
        title: 'Low-volume high-value window',
        detail: 'A small number of leads is carrying outsized value. Prioritize precision follow-up over broad upsell exposure.',
      });
    }

    return alerts.slice(0, 3);
  }

  getVipSegmentCount(metrics) {
    return Array.isArray(metrics.vipSegments) ? metrics.vipSegments.length : 0;
  }
}
