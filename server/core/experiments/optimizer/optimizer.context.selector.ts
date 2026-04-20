import type { FileBackedContextualOptimizerMemory } from './optimizer.context.memory.file.ts';
import type { OptimizerContext, ContextualFeedbackScore } from './optimizer.context.contract.ts';
import { buildContextKey } from './optimizer.context.key.ts';

export interface ContextSelectionResult {
  contextKey: string;
  scores: ContextualFeedbackScore[];
}

export async function selectContextualMemory(
  memory: FileBackedContextualOptimizerMemory,
  experimentId: string,
  context: OptimizerContext,
  variantId: string
): Promise<ContextSelectionResult> {
  const contextKey = buildContextKey(experimentId, context);
  const scores = await memory.getScoresByContextKey(contextKey);

  return {
    contextKey,
    scores: scores.filter((score) => score.variantId === variantId),
  };
}
