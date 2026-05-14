import type { FeedbackSignal } from './optimizer.feedback.contract.ts';
import type { OptimizerContext, ContextualFeedbackScore } from './optimizer.context.contract.ts';
import { buildContextKey } from './optimizer.context.key.ts';
import { analyzeFeedback } from './optimizer.feedback.analyzer.ts';

export function buildContextualFeedbackScore(
  signal: FeedbackSignal,
  context: OptimizerContext
): ContextualFeedbackScore {
  const analyzed = analyzeFeedback(signal);
  const contextKey = buildContextKey(signal.experimentId, context);

  return {
    experimentId: signal.experimentId,
    variantId: signal.variantId,
    contextKey,
    context,
    upliftScore: analyzed.upliftScore,
    riskScore: analyzed.riskScore,
    confidenceScore: analyzed.confidenceScore,
    finalScore: analyzed.finalScore,
    evaluatedAt: signal.evaluatedAt,
  };
}
