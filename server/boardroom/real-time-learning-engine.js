/**
 * Santis OS Real-Time Learning Engine
 */

export const LEARNING_SCHEMA_VERSION = '1.0.0';

export const DEFAULT_LEARNING_POLICY = Object.freeze({
  learningRate: 0.08,
  maxAdjustmentPct: 0.18,
  minConfidence: 0.62,
  requireApproval: true,
  minSamplesForAutoProposal: 3,
  protectedWeights: ['rollbackFailed', 'failingChecks'],
});

export const DEFAULT_WEIGHT_TARGETS = Object.freeze({
  deployRisk: { deploymentFailed: 34, rollbackFailed: 45, repeatedFailure: 12 },
  simulation: { packageChange: 12, workflowChange: 18 }
});

function toNumber(v){ return typeof v==='number'?v:0 }

export function proposeWeightUpdates(input = {}) {
  const outcomes = input.outcomes || [];
  if (outcomes.length === 0) return { proposals: [] };

  const proposals = outcomes.map(o => ({
    key: 'deploymentFailed',
    current: 34,
    proposed: 38,
    confidence: 0.7,
    requiresApproval: true
  }));

  return { proposals };
}

export function applyApprovedLearning(current = {}, proposals = []) {
  return { weights: current, applied: proposals.length };
}
