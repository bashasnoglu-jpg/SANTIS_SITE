/**
 * santis-oracle-confidence-engine.js
 * Converts raw Oracle insights into decision-grade recommendations.
 */
export class SantisOracleConfidenceEngine {
  constructor() {
    this.severityWeight = {
      high: 24,
      medium: 14,
      low: 7,
    };
  }

  enrich(insights, metrics = {}) {
    return insights.map((insight) => {
      const evidenceTrail = this.buildEvidenceTrail(insight, metrics);
      const confidenceScore = this.calculateConfidence(insight, metrics, evidenceTrail);
      const riskLevel = this.resolveRiskLevel(insight, confidenceScore, metrics);
      const suggestedAction = this.resolveSuggestedAction(insight, riskLevel, confidenceScore);

      return {
        ...insight,
        id: this.createInsightId(insight),
        confidenceScore,
        evidenceTrail,
        riskLevel,
        suggestedAction,
      };
    });
  }

  calculateConfidence(insight, metrics, evidenceTrail) {
    const severityScore = this.severityWeight[insight.severity] || this.severityWeight.low;
    const signalScore = Math.min(evidenceTrail.length * 12, 36);
    const volumeScore = this.getVolumeScore(metrics);
    const typeScore = insight.type === 'opportunity' ? 10 : 6;
    const score = 34 + severityScore + signalScore + volumeScore + typeScore;

    return Math.max(52, Math.min(96, score));
  }

  getVolumeScore(metrics) {
    const bookings = Number(metrics.bookings || metrics.bookingCount || 0);
    const revenue = Number(metrics.revenue || metrics.totalRevenue || 0);

    if (bookings >= 5 || revenue >= 5000) return 14;
    if (bookings >= 2 || revenue >= 1500) return 8;
    if (bookings > 0 || revenue > 0) return 4;

    return 0;
  }

  buildEvidenceTrail(insight, metrics) {
    const evidence = [];
    const revenue = Number(metrics.revenue || metrics.totalRevenue || 0);
    const bookings = Number(metrics.bookings || metrics.bookingCount || 0);
    const vipLeads = Number(metrics.vipLeads || this.getVipSegmentCount(metrics) || 0);
    const averageLeadValue = Number(metrics.averageLeadValue || this.resolveAverageLeadValue(metrics));

    if (averageLeadValue > 0) {
      evidence.push(`Avg lead value: €${Math.round(averageLeadValue).toLocaleString('en-US')}`);
    }

    if (vipLeads > 0) {
      evidence.push(`VIP signal: ${vipLeads} premium lead${vipLeads === 1 ? '' : 's'}`);
    }

    if (bookings > 0) {
      evidence.push(`Booking velocity: ${bookings} active handoff${bookings === 1 ? '' : 's'}`);
    }

    if (revenue > 0) {
      evidence.push(`Pipeline value: €${Math.round(revenue).toLocaleString('en-US')}`);
    }

    if (insight.type === 'anomaly') {
      evidence.push('Signal class: revenue anomaly');
    }

    if (insight.type === 'opportunity') {
      evidence.push('Signal class: conversion opportunity');
    }

    return evidence.slice(0, 4);
  }

  resolveRiskLevel(insight, confidenceScore, metrics) {
    const bookings = Number(metrics.bookings || metrics.bookingCount || 0);

    if (insight.severity === 'high' && confidenceScore >= 84) return 'high';
    if (insight.type === 'anomaly' && confidenceScore >= 78) return 'high';
    if (bookings <= 1 && insight.type === 'opportunity') return 'medium';
    if (confidenceScore >= 70) return 'medium';

    return 'low';
  }

  resolveSuggestedAction(insight, riskLevel, confidenceScore) {
    if (insight.type === 'opportunity' && riskLevel === 'high') {
      return 'Start Sovereign Concierge follow-up within 10 minutes.';
    }

    if (insight.type === 'opportunity') {
      return 'Prepare premium follow-up and keep VIP inventory visible.';
    }

    if (insight.type === 'anomaly' && riskLevel === 'high') {
      return 'Verify campaign source and reserve capacity for high-value demand.';
    }

    if (insight.type === 'anomaly') {
      return 'Monitor the next handoff before changing pricing or capacity.';
    }

    if (confidenceScore >= 82) {
      return 'Escalate to Boardroom review and assign an owner.';
    }

    return 'Keep the signal on watch and wait for one more confirming event.';
  }

  resolveAverageLeadValue(metrics) {
    const revenue = Number(metrics.revenue || metrics.totalRevenue || 0);
    const bookings = Number(metrics.bookings || metrics.bookingCount || 0);

    return bookings > 0 ? revenue / bookings : 0;
  }

  getVipSegmentCount(metrics) {
    return Array.isArray(metrics.vipSegments) ? metrics.vipSegments.length : 0;
  }

  createInsightId(insight) {
    const source = `${insight.type || 'signal'}:${insight.severity || 'low'}:${insight.message}`;
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
      hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
    }

    return `oracle-action-${Math.abs(hash).toString(36)}`;
  }
}
