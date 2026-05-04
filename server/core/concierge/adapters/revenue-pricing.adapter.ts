export type RevenuePricingAction =
  | 'increase_price'
  | 'decrease_price'
  | 'suppress_upsell';

export type RevenuePricingDecision = {
  action: RevenuePricingAction;
  finalValue: number;
  reasoning?: string[];
};

export type RevenuePricingDecisionProvider = (
  sessionId: string
) => RevenuePricingDecision | undefined;

let decisionProvider: RevenuePricingDecisionProvider | undefined;

/**
 * Stateless price decorator for concierge snapshots.
 * The decision source is injected by the owning runtime to keep server/core
 * independent from app-level ingestion modules.
 */
export class RevenuePricingAdapter {
  static configure(provider: RevenuePricingDecisionProvider | undefined): void {
    decisionProvider = provider;
  }

  static applyRevenueLogic(originalPrice: number, sessionId: string): number {
    if (!sessionId || !decisionProvider) {
      return originalPrice;
    }

    const decision = decisionProvider(sessionId);
    if (!decision) {
      return originalPrice;
    }

    let finalPrice = originalPrice;

    if (decision.action === 'increase_price') {
      finalPrice = originalPrice * (1 + decision.finalValue);
    } else if (decision.action === 'decrease_price') {
      finalPrice = originalPrice * (1 - decision.finalValue);
    } else if (decision.action === 'suppress_upsell') {
      finalPrice = originalPrice;
    }

    finalPrice = Math.round(finalPrice * 100) / 100;

    if (finalPrice !== originalPrice) {
      console.log(JSON.stringify({
        level: 'info',
        event: 'REVENUE_PRICE_MODIFICATION',
        sessionId,
        original: originalPrice,
        modified: finalPrice,
        action: decision.action,
        reasons: decision.reasoning ?? [],
      }));
    }

    return finalPrice;
  }
}
