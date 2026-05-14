import type { FileBackedContextualOptimizerMemory } from './optimizer.context.memory.file.ts';
import type { OptimizerContext } from './optimizer.context.contract.ts';
import type {
  AdaptOptimizerRecommendationsOutput,
  OptimizerAdaptedRecommendation,
  OptimizerCandidateRecommendation,
} from './optimizer.adapter.contract.ts';
import { computePolicyWeight } from './optimizer.reinforcement.ts';
import {
  prefetchHierarchicalContextualMemory,
  selectHierarchicalContextualMemoryFromPrefetch,
  type HierarchicalMemoryMeta
} from './optimizer.context.fallback.selector.ts';

export interface HierarchicalAdaptInput {
  candidates: OptimizerCandidateRecommendation[];
  context: OptimizerContext;
}

}

export interface HierarchicalAdaptedRecommendation
  extends OptimizerAdaptedRecommendation {
  hierarchicalMemory: HierarchicalMemoryMeta;
}

export interface HierarchicalAdaptOutput
  extends AdaptOptimizerRecommendationsOutput {
  ranked: HierarchicalAdaptedRecommendation[];
}

function getHierarchyStrength(level: HierarchicalMemoryMeta['matchedLevel']): number {
  switch (level) {
    case 'exact': return 1;
    case 'segment_device_latency': return 0.85;
    case 'segment_device': return 0.7;
    case 'segment_only': return 0.5;
    case 'global': return 0.25;
    default: return 0;
  }
}

export class HierarchicalOptimizerAdapter {
  constructor(
    private readonly memory: FileBackedContextualOptimizerMemory
  ) {}

  async adaptRecommendations(
    input: HierarchicalAdaptInput
  ): Promise<HierarchicalAdaptOutput> {
    const adapted: HierarchicalAdaptedRecommendation[] = [];

    const experimentIds = [...new Set(input.candidates.map(c => c.experimentId))];
    const prefetchedMemories: Record<string, any> = {};
    for (const expId of experimentIds) {
      prefetchedMemories[expId] = await prefetchHierarchicalContextualMemory(this.memory, expId, input.context);
    }

    for (const candidate of input.candidates) {
      const selected = selectHierarchicalContextualMemoryFromPrefetch(
        prefetchedMemories[candidate.experimentId],
        candidate.experimentId,
        input.context,
        candidate.variantId
      );

      const lightweightScores = selected.scores.map((score) => ({
        experimentId: score.experimentId,
        variantId: score.variantId,
        upliftScore: score.upliftScore,
        riskScore: score.riskScore,
        confidenceScore: score.confidenceScore,
        finalScore: score.finalScore,
      }));

      const hierarchyStrength = getHierarchyStrength(selected.matchedLevel);
      const learnedWeight = computePolicyWeight(lightweightScores);
      const memoryBiasDelta = (learnedWeight - 0.5) * 0.5 * hierarchyStrength;
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
        hierarchicalMemory: {
          matchedContextKey: selected.matchedContextKey,
          matchedLevel: selected.matchedLevel,
        },
      });
    }

    adapted.sort((a, b) => b.adjustedScore - a.adjustedScore);

    return {
      ranked: adapted,
    };
  }
}
