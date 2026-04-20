import type {
  RolloutAuditEvent,
  RolloutDecisionRecord,
  RolloutPlan,
} from './rollout.contract.ts';

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function mapDecisionToAuditEventType(
  decision: RolloutDecisionRecord['finalDecision']
): RolloutAuditEvent['eventType'] {
  switch (decision) {
    case 'advance':
      return 'rollout_advanced';
    case 'hold':
      return 'rollout_held';
    case 'pause':
      return 'rollout_paused';
    case 'rollback':
      return 'rollout_rolled_back';
    case 'complete':
      return 'rollout_completed';
    default: {
      const exhaustiveCheck: never = decision;
      return exhaustiveCheck;
    }
  }
}

export function createRolloutStartedAuditEvent(
  plan: RolloutPlan,
  timestamp: string
): RolloutAuditEvent {
  return {
    eventId: randomId('audit'),
    rolloutId: plan.rolloutId,
    timestamp,
    eventType: 'rollout_started',
    payload: {
      experimentId: plan.experimentId,
      winnerVariantId: plan.winnerVariantId,
      controlVariantId: plan.controlVariantId,
      currentStage: plan.currentStage,
      baselinePolicyVersion: plan.baselinePolicyVersion,
      candidatePolicyVersion: plan.candidatePolicyVersion,
    },
  };
}

export function createRolloutDecisionAuditEvent(
  planBefore: RolloutPlan,
  planAfter: RolloutPlan,
  record: RolloutDecisionRecord
): RolloutAuditEvent {
  return {
    eventId: randomId('audit'),
    rolloutId: record.rolloutId,
    timestamp: record.timestamp,
    eventType: mapDecisionToAuditEventType(record.finalDecision),
    payload: {
      fromStage: record.fromStage,
      toStage: planAfter.currentStage,
      previousStatus: planBefore.status,
      nextStatus: planAfter.status,
      proposedDecision: record.proposedDecision,
      finalDecision: record.finalDecision,
      reason: record.reason,
      notes: record.notes,
    },
  };
}
