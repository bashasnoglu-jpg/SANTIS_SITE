import type { ContextualFeedbackScore } from './optimizer.context.contract.ts';
import type {
  LearningBlockReason,
  LearningGuardDecision,
} from './optimizer.learning.guard.contract.ts';

export interface ContextualLearningDecision {
  accepted: boolean;
  reasons: LearningBlockReason[];
  score: ContextualFeedbackScore;
}

export function buildContextualLearningDecision(
  score: ContextualFeedbackScore,
  guard: LearningGuardDecision
): ContextualLearningDecision {
  return {
    accepted: guard.accepted,
    reasons: guard.reasons,
    score,
  };
}
