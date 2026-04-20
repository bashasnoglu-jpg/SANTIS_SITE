import { computePolicyWeight } from './optimizer.reinforcement.ts';
import type { FeedbackScore } from './optimizer.feedback.contract.ts';
import type {
  OptimizerCandidateRecommendation,
  OptimizerMemoryAdjustment,
} from './optimizer.adapter.contract.ts';

export interface BiasInjectionResult {
  adjustedScore: number;
  memory: OptimizerMemoryAdjustment;
}

export function injectMemoryBias(
  candidate: OptimizerCandidateRecommendation,
  scores: FeedbackScore[]
): BiasInjectionResult {
  const learnedWeight = computePolicyWeight(scores);

  // Weight 0..1 aralığında geliyor.
  // Bunu -0.25 .. +0.25 bandına çeviriyoruz.
  const memoryBiasDelta = (learnedWeight - 0.5) * 0.5;

  const adjustedScore = candidate.baseScore * (1 + memoryBiasDelta);

  return {
    adjustedScore,
    memory: {
      experimentId: candidate.experimentId,
      variantId: candidate.variantId,
      learnedWeight,
      memoryScoreCount: scores.length,
      memoryBiasDelta,
    },
  };
}
