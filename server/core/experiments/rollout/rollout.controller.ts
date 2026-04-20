import type {
  RolloutPlan,
  RolloutGuardrails,
  RolloutHealthSnapshot,
  RolloutDecisionRecord,
} from './rollout.contract.ts';
import { evaluateRolloutDecision } from './rollout.decision.ts';
import { applyDecision } from './rollout.state-machine.ts';

export interface EvaluateRolloutInput {
  plan: RolloutPlan;
  guardrails: RolloutGuardrails;
  snapshot: RolloutHealthSnapshot;
  context: {
    healthyWindowCount: number;
    hasManualApproval: boolean;
  };
  nowIso: string;
}

export interface EvaluateRolloutOutput {
  nextPlan: RolloutPlan;
  decisionRecord: RolloutDecisionRecord;
}

export function evaluateAndApplyRollout(
  input: EvaluateRolloutInput
): EvaluateRolloutOutput {
  const result = evaluateRolloutDecision(
    input.plan,
    input.guardrails,
    input.snapshot,
    input.context.healthyWindowCount,
    input.context.hasManualApproval
  );

  const nextPlan = applyDecision(input.plan, result.decision);

  return {
    nextPlan,
    decisionRecord: {
      rolloutId: input.plan.rolloutId,
      timestamp: input.nowIso,
      fromStage: input.plan.currentStage,
      proposedDecision: result.decision,
      finalDecision: result.decision,
      reason: result.reason,
      notes: result.notes,
    },
  };
}
