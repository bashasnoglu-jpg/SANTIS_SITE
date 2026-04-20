import type {
  RolloutPlan,
  RolloutDecision,
  RolloutStagePercent,
} from './rollout.contract.ts';

const STAGE_ORDER: RolloutStagePercent[] = [10, 25, 50, 100];

export function getNextStage(current: RolloutStagePercent): RolloutStagePercent | null {
  const index = STAGE_ORDER.indexOf(current);
  if (index === -1) return null;
  return STAGE_ORDER[index + 1] ?? null;
}

export function canAdvance(plan: RolloutPlan): boolean {
  return plan.status === 'running';
}

export function applyDecision(
  plan: RolloutPlan,
  decision: RolloutDecision
): RolloutPlan {
  switch (decision) {
    case 'advance': {
      const next = getNextStage(plan.currentStage);
      if (!next) {
        return { ...plan, status: 'completed' };
      }
      return { ...plan, currentStage: next, status: 'running' };
    }

    case 'hold':
      return { ...plan, status: 'running' };

    case 'pause':
      return { ...plan, status: 'paused' };

    case 'rollback':
      return { ...plan, status: 'rolled_back', currentStage: 10 };

    case 'complete':
      return { ...plan, status: 'completed' };

    default: {
      const exhaustive: never = decision;
      return exhaustive;
    }
  }
}
