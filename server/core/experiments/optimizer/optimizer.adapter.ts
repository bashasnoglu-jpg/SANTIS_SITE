import type {
  AdaptOptimizerRecommendationsInput,
  AdaptOptimizerRecommendationsOutput,
  OptimizerAdaptedRecommendation,
} from './optimizer.adapter.contract.ts';
import type { FileBackedOptimizerMemory } from './optimizer.memory.file.ts';
import { selectMemoryForRecommendation } from './optimizer.memory.selector.ts';
import { injectMemoryBias } from './optimizer.bias-injection.ts';

export class OptimizerAdapter {
  constructor(
    private readonly memory: FileBackedOptimizerMemory
  ) {}

  async adaptRecommendations(
    input: AdaptOptimizerRecommendationsInput
  ): Promise<AdaptOptimizerRecommendationsOutput> {
    const adapted: OptimizerAdaptedRecommendation[] = [];

    for (const candidate of input.candidates) {
      const memoryContext = await selectMemoryForRecommendation(
        this.memory,
        candidate
      );

      const bias = injectMemoryBias(candidate, memoryContext.scores);

      adapted.push({
        ...candidate,
        adjustedScore: bias.adjustedScore,
        memory: bias.memory,
      });
    }

    adapted.sort((a, b) => b.adjustedScore - a.adjustedScore);

    return {
      ranked: adapted,
    };
  }
}
