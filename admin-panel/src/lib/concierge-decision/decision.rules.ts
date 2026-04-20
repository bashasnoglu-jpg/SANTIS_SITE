import type { DecisionThresholds } from './decision.types';

export const defaultDecisionThresholds: DecisionThresholds = {
  highQuoteLatencyMs: 1200,
  highAbandonmentRisk: 0.65,
  reduceChoicesAfterServiceOpens: 3,
  lowServiceSupplyThreshold: 3,
  lowSlotSupplyThreshold: 2,
  minHealthySlotConfidence: 0.55,
  minStrictSlotConfidence: 0.75,
};
