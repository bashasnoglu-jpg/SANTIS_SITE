import type {
  ConciergeDecisionInput,
  ConciergeDecisionOutput,
} from './decision.contract';
import { defaultDecisionThresholds } from './decision.rules';
import { clamp01, hasQuoteFailures, isHighLatency, isLowSupply } from './decision.guards';

export function deriveAutonomousConciergeDecision(
  input: ConciergeDecisionInput
): ConciergeDecisionOutput {
  const explanationCodes: string[] = [];

  const degraded = input.snapshot.degraded;
  const highLatency = isHighLatency(
    input.telemetry.quoteLatencyMs,
    defaultDecisionThresholds.highQuoteLatencyMs
  );
  const quoteFailureDetected = hasQuoteFailures(input.behavioral.quoteFailureCount);
  const abandonmentRiskHigh =
    (input.behavioral.abandonmentRisk ?? 0) >=
    defaultDecisionThresholds.highAbandonmentRisk;

  const lowServiceSupply = isLowSupply(
    input.snapshot.serviceCount,
    defaultDecisionThresholds.lowServiceSupplyThreshold
  );

  const lowSlotSupply = isLowSupply(
    input.snapshot.slotCount,
    defaultDecisionThresholds.lowSlotSupplyThreshold
  );

  const shouldReduceChoices =
    degraded ||
    input.behavioral.serviceOpenCount >=
      defaultDecisionThresholds.reduceChoicesAfterServiceOpens ||
    abandonmentRiskHigh;

  const shouldEscalateToHuman =
    degraded || quoteFailureDetected || abandonmentRiskHigh;

  const shouldHideLowConfidenceSlots =
    degraded || lowSlotSupply || highLatency;

  const shouldPromoteTopService =
    !degraded &&
    !quoteFailureDetected &&
    !abandonmentRiskHigh &&
    input.snapshot.serviceCount > 0;

  const shouldShowUrgency =
    !degraded &&
    lowSlotSupply &&
    input.behavioral.slotSelectionCount > 0;

  const shouldOfferConciergeAssist =
    degraded || quoteFailureDetected || highLatency || abandonmentRiskHigh;

  const shouldSuppressAggressiveUpsell =
    degraded || highLatency || quoteFailureDetected;

  const maxVisibleServices = shouldReduceChoices ? 3 : 6;

  const minSlotConfidence = shouldHideLowConfidenceSlots
    ? defaultDecisionThresholds.minStrictSlotConfidence
    : defaultDecisionThresholds.minHealthySlotConfidence;

  if (degraded) explanationCodes.push('DEGRADED_MODE');
  if (highLatency) explanationCodes.push('HIGH_QUOTE_LATENCY');
  if (
    input.behavioral.serviceOpenCount >=
    defaultDecisionThresholds.reduceChoicesAfterServiceOpens
  ) {
    explanationCodes.push('MULTIPLE_SERVICE_OPENS');
  }
  if (lowSlotSupply) explanationCodes.push('LOW_SLOT_SUPPLY');
  if (lowServiceSupply) explanationCodes.push('LOW_SERVICE_SUPPLY');
  if (quoteFailureDetected) explanationCodes.push('QUOTE_FAILURE_DETECTED');
  if (abandonmentRiskHigh) explanationCodes.push('ABANDONMENT_RISK_HIGH');

  return {
    shouldReduceChoices,
    shouldEscalateToHuman,
    shouldHideLowConfidenceSlots,
    shouldPromoteTopService,
    shouldShowUrgency,
    shouldOfferConciergeAssist,
    shouldSuppressAggressiveUpsell,
    maxVisibleServices,
    minSlotConfidence: clamp01(minSlotConfidence),
    explanationCodes,
  };
}
