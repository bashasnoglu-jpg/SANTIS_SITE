import type {
  LearningGuardDecision,
  LearningGuardInput,
  OptimizerLearningGuardConfig,
} from './optimizer.learning.guard.contract.ts';

export function evaluateLearningGuard(
  input: LearningGuardInput,
  config: OptimizerLearningGuardConfig
): LearningGuardDecision {
  const reasons: LearningGuardDecision['reasons'] = [];

  if (input.sampleCount < config.minSamplesRequired) {
    reasons.push('insufficient_samples');
  }

  if (input.confidenceScore < config.minConfidenceRequired) {
    reasons.push('low_confidence');
  }

  if (input.riskScore > config.maxRiskAllowed) {
    reasons.push('high_risk');
  }

  if (Math.abs(input.upliftScore) > config.maxAbsoluteUpliftAllowed) {
    reasons.push('uplift_anomaly');
  }

  if (Math.abs(input.finalScore) > config.maxAbsoluteFinalScoreAllowed) {
    reasons.push('final_score_anomaly');
  }

  return {
    accepted: reasons.length === 0,
    reasons,
  };
}
