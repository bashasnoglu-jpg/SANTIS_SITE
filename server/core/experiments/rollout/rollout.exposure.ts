import type { RolloutPlan } from './rollout.contract.ts';

export interface ResolveRolloutExposureInput {
  visitorId: string;
  experimentId: string;
  plan: RolloutPlan;
}

export interface ResolveRolloutExposureOutput {
  arm: 'control' | 'candidate';
  stagePercent: number;
  matched: boolean;
  bucket: number;
}

function stableHash(input: string): number {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

export function resolveRolloutExposure(
  input: ResolveRolloutExposureInput
): ResolveRolloutExposureOutput {
  const bucket = stableHash(`${input.experimentId}:${input.visitorId}`) % 100;
  const matched = bucket < input.plan.currentStage;

  return {
    arm: matched ? 'candidate' : 'control',
    stagePercent: input.plan.currentStage,
    matched,
    bucket,
  };
}
