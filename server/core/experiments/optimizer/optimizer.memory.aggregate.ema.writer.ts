import type { OptimizerContext, ContextualFeedbackScore } from './optimizer.context.contract.ts';
import { FileBackedEMAOptimizerMemory } from './optimizer.memory.aggregate.ema.file.ts';
import { buildAggregatedMemoryWriteInstructions } from './optimizer.memory.aggregate.builder.ts';

export class EMAOptimizerMemoryWriter {
  constructor(private readonly memory: FileBackedEMAOptimizerMemory) {}

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
      await this.memory.merge({
        experimentId: instruction.experimentId,
        variantId: instruction.variantId,
        contextKey: instruction.contextKey,
        level: instruction.level,
        signal: {
          uplift: instruction.signal.upliftScore,
          risk: instruction.signal.riskScore,
          confidence: instruction.signal.confidenceScore,
          final: instruction.signal.finalScore,
          evaluatedAt: instruction.signal.evaluatedAt,
        },
      });
    }
  }
}
