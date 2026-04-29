/**
 * santis-oracle-revenue-playbook.js
 * Generates executive playbook suggestions from Oracle insights.
 */
export class SantisOracleRevenuePlaybook {
  generate(insights = [], metrics = {}) {
    const plays = [];
    const hasVipMomentum = insights.some((insight) => (
      insight.type === 'opportunity' && String(insight.message || '').toLowerCase().includes('vip')
    ));
    const hasRevenueSpike = insights.some((insight) => insight.type === 'anomaly');
    const bookings = Number(metrics.bookings || metrics.bookingCount || 0);
    const averageLeadValue = Number(metrics.averageLeadValue || 0);

    if (hasVipMomentum) {
      plays.push({
        title: 'Activate Sovereign Concierge follow-up',
        cadence: 'Within 2 hours',
        action: 'Route approved VIP actions to concierge follow-up and foreground Sovereign Couple rituals.',
      });
    }

    if (averageLeadValue >= 1000) {
      plays.push({
        title: 'Protect premium package focus',
        cadence: 'Today',
        action: 'Reduce low-value upsell exposure and keep premium ritual bundles visible in follow-up messaging.',
      });
    }

    if (hasRevenueSpike) {
      plays.push({
        title: 'Validate spike source before scaling',
        cadence: 'Before next campaign push',
        action: 'Check attribution, staffing capacity, and inventory constraints before increasing acquisition pressure.',
      });
    }

    if (bookings <= 2 && averageLeadValue > 0) {
      plays.push({
        title: 'Prioritize precision over reach',
        cadence: 'Next operating block',
        action: 'Focus on qualified follow-up quality instead of expanding broad funnel traffic.',
      });
    }

    return plays.slice(0, 3);
  }
}
