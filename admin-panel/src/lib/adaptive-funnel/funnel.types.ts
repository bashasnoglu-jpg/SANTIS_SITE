export type FunnelExplanationCode =
  | 'ANCHOR_PRICE_ENABLED'
  | 'URGENT_CAPACITY_SIGNAL'
  | 'CONCIERGE_PATH_EMPHASIZED'
  | 'CHOICE_COMPRESSION_ACTIVE'
  | 'HIGH_VALUE_SERVICE_PROMOTED'
  | 'UPSSELL_SUPPRESSED'
  | 'DEGRADED_FUNNEL_FALLBACK';

export type FunnelThresholds = {
  urgencyLowSlotThreshold: number;
  highAbandonmentRisk: number;
  highQuoteLatencyMs: number;
  compactLayoutServiceThreshold: number;
};
