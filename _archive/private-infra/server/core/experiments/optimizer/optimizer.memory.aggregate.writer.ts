import type { OptimizerContext } from './optimizer.context.contract.ts';
import type { ContextualFeedbackScore } from './optimizer.context.contract.ts';
import { FileBackedAggregatedOptimizerMemory } from './optimizer.memory.aggregate.file.ts';
import { buildAggregatedMemoryWriteInstructions } from './optimizer.memory.aggregate.builder.ts';

export class AggregatedOptimizerMemoryWriter {
  constructor(
    private readonly memory: FileBackedAggregatedOptimizerMemory
  ) {}

  async appendFromContextualScore(
    score: ContextualFeedbackScore,
    context: OptimizerContext
  ): Promise<void> {
    const instructions = buildAggregatedMemoryWriteInstructions({
      experimentId: score.experimentId,
      variantId: score.variantId,
      context,
      signal: {
        experimentId: score.experimentId,
        variantId: score.variantId,
        upliftScore: score.upliftScore,
        riskScore: score.riskScore,
        confidenceScore: score.confidenceScore,
        finalScore: score.finalScore,
        evaluatedAt: score.evaluatedAt,
      },
    });

    for (const instruction of instructions) {
      await this.memory.mergeSignal(instruction);
    }
  }
}
