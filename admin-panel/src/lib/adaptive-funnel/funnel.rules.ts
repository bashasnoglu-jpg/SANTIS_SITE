import type { FunnelThresholds } from './funnel.types.ts';

export const defaultFunnelThresholds: FunnelThresholds = {
  urgencyLowSlotThreshold: 2,
  highAbandonmentRisk: 0.65,
  highQuoteLatencyMs: 1200,
  compactLayoutServiceThreshold: 4,
};
