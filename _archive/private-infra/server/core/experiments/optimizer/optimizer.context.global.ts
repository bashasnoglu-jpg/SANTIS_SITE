import type {
  ContextualFeedbackScore,
  OptimizerContext,
} from './optimizer.context.contract.ts';
import type { FeedbackSignal } from './optimizer.feedback.contract.ts';
import { analyzeFeedback } from './optimizer.feedback.analyzer.ts';
import { buildContextKey } from './optimizer.context.key.ts';

export function buildExactContextualFeedbackScore(
  signal: FeedbackSignal,
  context: OptimizerContext
): ContextualFeedbackScore {
  const analyzed = analyzeFeedback(signal);

  return {
    experimentId: signal.experimentId,
    variantId: signal.variantId,
    contextKey: buildContextKey(signal.experimentId, context),
    context,
    upliftScore: analyzed.upliftScore,
    riskScore: analyzed.riskScore,
    confidenceScore: analyzed.confidenceScore,
    finalScore: analyzed.finalScore,
    evaluatedAt: signal.evaluatedAt,
  };
}

export function buildGlobalContextualFeedbackScore(
  signal: FeedbackSignal
): ContextualFeedbackScore {
  const analyzed = analyzeFeedback(signal);

  return {
    experimentId: signal.experimentId,
    variantId: signal.variantId,
    contextKey: `${signal.experimentId}|global`,
    context: {
      segment: 'unknown',
      device: 'unknown',
      latencyTier: 'unknown',
      visitorType: 'unknown',
    },
    upliftScore: analyzed.upliftScore,
    riskScore: analyzed.riskScore,
    confidenceScore: analyzed.confidenceScore,
    finalScore: analyzed.finalScore,
    evaluatedAt: signal.evaluatedAt,
  };
}
