import type { FeedbackScore } from './optimizer.feedback.contract.ts';
import type { FileBackedOptimizerMemory } from './optimizer.memory.file.ts';
import type { OptimizerCandidateRecommendation } from './optimizer.adapter.contract.ts';

export interface SelectedMemoryContext {
  experimentId: string;
  variantId: string;
  scores: FeedbackScore[];
}

export async function selectMemoryForRecommendation(
  memory: FileBackedOptimizerMemory,
  candidate: OptimizerCandidateRecommendation
): Promise<SelectedMemoryContext> {
  const scores = await memory.getScores(candidate.experimentId);

  const filtered = scores.filter(
    (score) => score.variantId === candidate.variantId
  );

  return {
    experimentId: candidate.experimentId,
    variantId: candidate.variantId,
    scores: filtered,
  };
}
