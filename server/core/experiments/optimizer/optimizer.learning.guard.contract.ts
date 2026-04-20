export interface OptimizerLearningGuardConfig {
  minSamplesRequired: number;
  minConfidenceRequired: number;
  maxRiskAllowed: number;
  maxAbsoluteUpliftAllowed: number;
  maxAbsoluteFinalScoreAllowed: number;
}

export interface LearningGuardInput {
  sampleCount: number;
  confidenceScore: number;
  riskScore: number;
  upliftScore: number;
  finalScore: number;
}

export type LearningBlockReason =
  | 'insufficient_samples'
  | 'low_confidence'
  | 'high_risk'
  | 'uplift_anomaly'
  | 'final_score_anomaly';

export interface LearningGuardDecision {
  accepted: boolean;
  reasons: LearningBlockReason[];
}
