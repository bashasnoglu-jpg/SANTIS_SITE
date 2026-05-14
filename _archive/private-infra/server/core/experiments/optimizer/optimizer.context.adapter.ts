import type { OptimizerContext } from './optimizer.context.contract.ts';
import type { FileBackedContextualOptimizerMemory } from './optimizer.context.memory.file.ts';
import type {
  AdaptOptimizerRecommendationsOutput,
  OptimizerAdaptedRecommendation,
  OptimizerCandidateRecommendation,
} from './optimizer.adapter.contract.ts';
import { computePolicyWeight } from './optimizer.reinforcement.ts';
import { selectContextualMemory } from './optimizer.context.selector.ts';

export interface AdaptContextualRecommendationsInput {
  candidates: OptimizerCandidateRecommendation[];
  context: OptimizerContext;
}

export class ContextualOptimizerAdapter {
  constructor(
    private readonly memory: FileBackedContextualOptimizerMemory
  ) {}

  async adaptRecommendations(
    input: AdaptContextualRecommendationsInput
  ): Promise<AdaptOptimizerRecommendationsOutput> {
    const adapted: OptimizerAdaptedRecommendation[] = [];

    for (const candidate of input.candidates) {
      const selected = await selectContextualMemory(
        this.memory,
        candidate.experimentId,
        input.context,
        candidate.variantId
      );

      const learnedWeight = computePolicyWeight(
        selected.scores.map((score) => ({
          experimentId: score.experimentId,
          variantId: score.variantId,
          upliftScore: score.upliftScore,
          riskScore: score.riskScore,
          confidenceScore: score.confidenceScore,
          finalScore: score.finalScore,
        }))
      );

      const memoryBiasDelta = (learnedWeight - 0.5) * 0.5;
      const adjustedScore = candidate.baseScore * (1 + memoryBiasDelta);

      adapted.push({
        ...candidate,
        adjustedScore,
        memory: {
          experimentId: candidate.experimentId,
          variantId: candidate.variantId,
          learnedWeight,
          memoryScoreCount: selected.scores.length,
          memoryBiasDelta,
        },
      });
    }

    adapted.sort((a, b) => b.adjustedScore - a.adjustedScore);

    return {
      ranked: adapted,
    };
  }
}
