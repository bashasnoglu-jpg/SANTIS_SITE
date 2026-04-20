import type { RolloutPlan, RolloutGuardrails } from './rollout.contract.ts';

export const DEFAULT_ROLLOUT_GUARDRAILS: RolloutGuardrails = {
  minSampleSizePerStage: 500,
  minConfidenceScore: 85,
  maxRelativeLatencyIncreasePct: 15,
  maxAbsoluteErrorRate: 0.03,
  maxRelativeConversionDropPct: 8,
  evaluationWindowMinutes: 15,
  consecutiveHealthyWindowsRequired: 2,
};

export function createBasePlan(overrides: Partial<RolloutPlan> = {}): RolloutPlan {
  return {
    rolloutId: 'rollout_test_1',
    experimentId: 'exp_quote_latency',
    winnerVariantId: 'variant_a',
    controlVariantId: 'control',
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    requiresHumanApprovalAt100: false,
    stages: [10, 25, 50, 100],
    currentStage: 10,
    status: 'scheduled',
    baselinePolicyVersion: 'v1.0.0',
    candidatePolicyVersion: 'v1.1.0',
    ...overrides,
  };
}
