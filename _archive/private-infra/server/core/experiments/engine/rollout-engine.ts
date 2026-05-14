import { assignVariant } from './experiment-assignment.ts';
import type { ExperimentDefinition } from '../contracts/experiment.contract.ts';
import type { RolloutPlan } from '../rollout/rollout.contract.ts';
import { resolveRolloutExposure } from '../rollout/rollout.exposure.ts';

export interface PromptGovernance {
  policyVersion?: string;
  [key: string]: any;
}

export interface ExperimentAssignment {
  variantId: string;
  bucket: number;
}

export interface ExperimentResolverDeps {
  getActiveRolloutByExperimentId(experimentId: string): Promise<RolloutPlan | null>;
  assignExperiment(input: {
    visitorId: string;
    experimentId: string;
  }): ExperimentAssignment;
  resolvePolicyVersion(variantId: string): PromptGovernance | null;
}

export interface ResolvePolicyWithExperimentInput {
  visitorId: string;
  experimentId: string;
  basePolicy: PromptGovernance;
}

export interface ResolvePolicyWithExperimentOutput {
  resolvedPolicy: PromptGovernance;
  source:
    | 'baseline'
    | 'experiment_split'
    | 'rollout_control'
    | 'rollout_candidate';
  rolloutStagePercent?: number;
  assignedVariantId?: string;
}

function isActiveRolloutStatus(status: RolloutPlan['status']): boolean {
  return status === 'scheduled' || status === 'running';
}

export async function resolvePolicyWithExperimentAsync(
  deps: ExperimentResolverDeps,
  input: ResolvePolicyWithExperimentInput
): Promise<ResolvePolicyWithExperimentOutput> {
  const activeRollout = await deps.getActiveRolloutByExperimentId(input.experimentId);

  if (activeRollout && isActiveRolloutStatus(activeRollout.status)) {
    const exposure = resolveRolloutExposure({
      visitorId: input.visitorId,
      experimentId: input.experimentId,
      plan: activeRollout,
    });

    if (exposure.arm === 'candidate') {
      const candidatePolicy =
        deps.resolvePolicyVersion(activeRollout.candidatePolicyVersion) ??
        input.basePolicy;

      return {
        resolvedPolicy: candidatePolicy,
        source: 'rollout_candidate',
        rolloutStagePercent: exposure.stagePercent,
        assignedVariantId: activeRollout.winnerVariantId,
      };
    }

    const baselinePolicy =
      deps.resolvePolicyVersion(activeRollout.baselinePolicyVersion) ??
      input.basePolicy;

    return {
      resolvedPolicy: baselinePolicy,
      source: 'rollout_control',
      rolloutStagePercent: exposure.stagePercent,
      assignedVariantId: activeRollout.controlVariantId,
    };
  }

  const assignment = deps.assignExperiment({
    visitorId: input.visitorId,
    experimentId: input.experimentId,
  });

  if (!assignment.variantId || assignment.variantId === 'control') {
    return {
      resolvedPolicy: input.basePolicy,
      source: 'baseline',
      assignedVariantId: 'control',
    };
  }

  const splitPolicy = deps.resolvePolicyVersion(assignment.variantId) ?? input.basePolicy;

  return {
    resolvedPolicy: splitPolicy,
    source: 'experiment_split',
    assignedVariantId: assignment.variantId,
  };
}

// ── Legacy Compatibility for V1.8 Smoke Tests ──
export function resolvePolicyWithExperiment(input: {
  basePolicy: Record<string, any>;
  experiments: ExperimentDefinition[];
  visitorId: string;
}) {
  let finalPolicy = { ...input.basePolicy };

  for (const exp of input.experiments) {
    if (exp.status !== 'running') continue;

    const variant = assignVariant(exp, input.visitorId);

    const variantPolicy = exp.variants[variant];

    if (variantPolicy) {
      finalPolicy = {
        ...finalPolicy,
        ...variantPolicy
      };
    }
  }

  return finalPolicy;
}
