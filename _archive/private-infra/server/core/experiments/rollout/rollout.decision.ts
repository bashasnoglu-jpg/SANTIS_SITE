import type {
  RolloutDecision,
  RolloutGuardrails,
  RolloutHealthSnapshot,
  RolloutTriggerReason,
  RolloutPlan,
} from './rollout.contract.ts';
import { deriveRolloutMetrics } from './rollout.metrics.ts';
import { getNextStage } from './rollout.state-machine.ts';

export interface RolloutDecisionResult {
  decision: RolloutDecision;
  reason: RolloutTriggerReason;
  notes?: string;
}

export function evaluateRolloutDecision(
  plan: RolloutPlan,
  guardrails: RolloutGuardrails,
  snapshot: RolloutHealthSnapshot,
  healthyWindowCount: number,
  hasManualApproval: boolean
): RolloutDecisionResult {
  if (!snapshot) {
    return { decision: 'pause', reason: 'missing_metrics' };
  }

  if (snapshot.sampleSize < guardrails.minSampleSizePerStage) {
    return { decision: 'hold', reason: 'minimum_sample_not_met' };
  }

  if (snapshot.confidenceScore < guardrails.minConfidenceScore) {
    return { decision: 'hold', reason: 'confidence_too_low' };
  }

  const derived = deriveRolloutMetrics(snapshot);

  if (
    derived.relativeLatencyIncreasePct >
    guardrails.maxRelativeLatencyIncreasePct
  ) {
    return { decision: 'rollback', reason: 'latency_regression' };
  }

  if (
    derived.relativeConversionDropPct >
    guardrails.maxRelativeConversionDropPct
  ) {
    return { decision: 'rollback', reason: 'conversion_regression' };
  }

  if (derived.candidateErrorRate > guardrails.maxAbsoluteErrorRate) {
    return { decision: 'rollback', reason: 'error_rate_regression' };
  }

  if (healthyWindowCount < guardrails.consecutiveHealthyWindowsRequired) {
    return { decision: 'hold', reason: 'healthy_progression', notes: 'Waiting for consecutive healthy windows.' };
  }

  const nextStage = getNextStage(plan.currentStage);

  if (!nextStage) {
    return { decision: 'complete', reason: 'healthy_progression' };
  }

  if (nextStage === 100 && plan.requiresHumanApprovalAt100 && !hasManualApproval) {
    return { decision: 'hold', reason: 'manual_approval' };
  }

  return { decision: 'advance', reason: 'healthy_progression' };
}
