export type DecisionExplanationCode =
  | 'DEGRADED_MODE'
  | 'HIGH_QUOTE_LATENCY'
  | 'MULTIPLE_SERVICE_OPENS'
  | 'NO_SLOT_CONFIDENCE'
  | 'QUOTE_FAILURE_DETECTED'
  | 'ABANDONMENT_RISK_HIGH'
  | 'LOW_SERVICE_SUPPLY'
  | 'LOW_SLOT_SUPPLY';

export type DecisionThresholds = {
  highQuoteLatencyMs: number;
  highAbandonmentRisk: number;
  reduceChoicesAfterServiceOpens: number;
  lowServiceSupplyThreshold: number;
  lowSlotSupplyThreshold: number;
  minHealthySlotConfidence: number;
  minStrictSlotConfidence: number;
};
