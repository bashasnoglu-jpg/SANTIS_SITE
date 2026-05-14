export type OptimizerUserSegment =
  | 'vip'
  | 'standard'
  | 'first_time'
  | 'returning'
  | 'unknown';

export type OptimizerDeviceType =
  | 'mobile'
  | 'desktop'
  | 'tablet'
  | 'unknown';

export type OptimizerLatencyTier =
  | 'low'
  | 'medium'
  | 'high'
  | 'unknown';

export interface OptimizerContext {
  segment: OptimizerUserSegment;
  device: OptimizerDeviceType;
  latencyTier: OptimizerLatencyTier;
  visitorType: 'first_time' | 'returning' | 'unknown';
}

export interface ContextualFeedbackScore {
  experimentId: string;
  variantId: string;
  contextKey: string;
  context: OptimizerContext;
  upliftScore: number;
  riskScore: number;
  confidenceScore: number;
  finalScore: number;
  evaluatedAt: string;
}
