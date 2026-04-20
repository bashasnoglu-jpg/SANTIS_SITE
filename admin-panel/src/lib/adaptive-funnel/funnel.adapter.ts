import type {
  AdaptiveFunnelInput,
  AdaptiveFunnelOutput,
} from './funnel.contract.ts';
import { defaultFunnelThresholds } from './funnel.rules.ts';
import { scoreServiceForFunnel } from './funnel.scoring.ts';

export function deriveAdaptiveRevenueFunnel(
  input: AdaptiveFunnelInput
): AdaptiveFunnelOutput {
  const explanationCodes: string[] = [];

  const degraded = input.snapshot.degraded;
  const abandonmentRisk = input.behavioral.abandonmentRisk ?? 0;
  const lowSlotSupply =
    input.snapshot.slots.length <= defaultFunnelThresholds.urgencyLowSlotThreshold;

  const sorted = [...input.snapshot.services]
    .map((service) => ({
      id: service.id,
      score: scoreServiceForFunnel({
        price: service.price,
        compareAtPrice: service.compareAtPrice,
        availabilityScore: service.availabilityScore,
        recommended: service.recommended,
        category: service.category,
      }),
    }))
    .sort((a, b) => b.score - a.score);

  const orderedServiceIds = sorted.map((x) => x.id);
  const promotedServiceId = orderedServiceIds[0];

  const shouldShowAnchorPrice =
    !degraded &&
    !input.decision.shouldSuppressAggressiveUpsell &&
    input.snapshot.services.some(
      (s) =>
        s.price != null &&
        s.compareAtPrice != null &&
        s.compareAtPrice > s.price
    );

  const shouldShowUrgencyBar =
    !degraded &&
    lowSlotSupply &&
    input.behavioral.slotSelectionCount > 0;

  const shouldShowRevenuePriorityBanner =
    !degraded &&
    !input.decision.shouldEscalateToHuman &&
    Boolean(promotedServiceId);

  const shouldEmphasizeConciergePath =
    input.decision.shouldOfferConciergeAssist ||
    abandonmentRisk >= defaultFunnelThresholds.highAbandonmentRisk;

  const shouldUseCompactLayout =
    input.decision.shouldReduceChoices ||
    input.snapshot.services.length >=
      defaultFunnelThresholds.compactLayoutServiceThreshold;

  const hiddenServiceIds = input.decision.shouldReduceChoices
    ? orderedServiceIds.slice(3)
    : [];

  if (shouldShowAnchorPrice) explanationCodes.push('ANCHOR_PRICE_ENABLED');
  if (shouldShowUrgencyBar) explanationCodes.push('URGENT_CAPACITY_SIGNAL');
  if (shouldEmphasizeConciergePath) {
    explanationCodes.push('CONCIERGE_PATH_EMPHASIZED');
  }
  if (input.decision.shouldReduceChoices) {
    explanationCodes.push('CHOICE_COMPRESSION_ACTIVE');
  }
  if (promotedServiceId) explanationCodes.push('HIGH_VALUE_SERVICE_PROMOTED');
  if (input.decision.shouldSuppressAggressiveUpsell) {
    explanationCodes.push('UPSSELL_SUPPRESSED');
  }
  if (degraded) explanationCodes.push('DEGRADED_FUNNEL_FALLBACK');

  return {
    orderedServiceIds,
    promotedServiceId,
    hiddenServiceIds,
    shouldShowAnchorPrice,
    shouldShowUrgencyBar,
    shouldShowRevenuePriorityBanner,
    shouldEmphasizeConciergePath,
    shouldUseCompactLayout,
    explanationCodes,
  };
}
