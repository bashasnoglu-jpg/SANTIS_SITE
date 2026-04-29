/**
 * santis-vip-behavior-inference.js
 * Infers behaviors and provides action suggestions based on VIP segment activity.
 */
export class VipBehaviorInference {
  constructor() {
    this.previousVipCount = 0;
  }

  analyze(metrics) {
    const insights = [];
    const { vipLeads, bookings } = metrics;

    if (vipLeads > this.previousVipCount) {
      insights.push({
        type: 'opportunity',
        severity: 'high',
        message: 'VIP yoğunluğu yükseliyor. Premium segment (Score ≥ 75) aktif. Sovereign Concierge hazırlığı yapın.',
      });
    }

    if (vipLeads > 0 && vipLeads / bookings >= 0.5) {
      insights.push({
         type: 'insight',
         severity: 'medium',
         message: 'Gelen leadlerin %50+ kadarı VIP. Bugünkü intent kalitesi revenue hacminden daha güçlü.',
      });
    }

    this.previousVipCount = vipLeads;
    return insights;
  }
}
