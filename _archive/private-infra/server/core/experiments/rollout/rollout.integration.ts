import type { RolloutPlan, RolloutStagePercent } from './rollout.contract.ts';
import { RolloutPlanSchema } from './rollout.schemas.ts';
import { createRolloutStartedAuditEvent } from './rollout.audit.ts';

export interface ExperimentEvaluationResult {
  experimentId: string;
  winnerVariantId: string;
  controlVariantId: string;
  confidenceScore: number;
  recommendedAction: 'keep_control' | 'promote_winner' | 'needs_more_data';
  evaluatedAt: string;
}

export interface InitializeRolloutFromEvaluationInput {
  evaluation: ExperimentEvaluationResult;
  createdBy: string;
  baselinePolicyVersion: string;
  candidatePolicyVersion: string;
  requiresHumanApprovalAt100: boolean;
  defaultStages?: RolloutStagePercent[];
  confidenceThreshold?: number;
  initialStatus?: 'scheduled' | 'running';
}

export interface InitializeRolloutFromEvaluationOutput {
  shouldStartRollout: boolean;
  plan: RolloutPlan | null;
  reason:
    | 'winner_not_promotable'
    | 'winner_is_control'
    | 'insufficient_confidence'
    | 'rollout_ready';
}

export interface RolloutRepository {
  savePlan(plan: RolloutPlan): Promise<void>;
  saveAuditEvent(event: ReturnType<typeof createRolloutStartedAuditEvent>): Promise<void>;
}

const DEFAULT_STAGES: RolloutStagePercent[] = [10, 25, 50, 100];
const DEFAULT_CONFIDENCE_THRESHOLD = 85;

function buildRolloutId(input: {
  experimentId: string;
  winnerVariantId: string;
  evaluatedAt: string;
}): string {
  const compactTime = input.evaluatedAt.replace(/[:.]/g, '-');
  return `rollout_${input.experimentId}_${input.winnerVariantId}_${compactTime}`;
}

export function initializeRolloutFromEvaluation(
  input: InitializeRolloutFromEvaluationInput
): InitializeRolloutFromEvaluationOutput {
  const {
    evaluation,
    createdBy,
    baselinePolicyVersion,
    candidatePolicyVersion,
    requiresHumanApprovalAt100,
    defaultStages = DEFAULT_STAGES,
    confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
    initialStatus = 'scheduled',
  } = input;

  if (evaluation.recommendedAction !== 'promote_winner') {
    return {
      shouldStartRollout: false,
      plan: null,
      reason: 'winner_not_promotable',
    };
  }

  if (evaluation.winnerVariantId === evaluation.controlVariantId) {
    return {
      shouldStartRollout: false,
      plan: null,
      reason: 'winner_is_control',
    };
  }

  if (evaluation.confidenceScore < confidenceThreshold) {
    return {
      shouldStartRollout: false,
      plan: null,
      reason: 'insufficient_confidence',
    };
  }

  const plan = RolloutPlanSchema.parse({
    rolloutId: buildRolloutId({
      experimentId: evaluation.experimentId,
      winnerVariantId: evaluation.winnerVariantId,
      evaluatedAt: evaluation.evaluatedAt,
    }),
    experimentId: evaluation.experimentId,
    winnerVariantId: evaluation.winnerVariantId,
    controlVariantId: evaluation.controlVariantId,
    createdAt: evaluation.evaluatedAt,
    createdBy,
    requiresHumanApprovalAt100,
    stages: defaultStages,
    currentStage: defaultStages[0] ?? 10,
    status: initialStatus,
    baselinePolicyVersion,
    candidatePolicyVersion,
  });

  return {
    shouldStartRollout: true,
    plan,
    reason: 'rollout_ready',
  };
}

export interface StartRolloutFromEvaluationInput
  extends InitializeRolloutFromEvaluationInput {
  repository: RolloutRepository;
  nowIso?: string;
}

export async function startRolloutFromEvaluation(
  input: StartRolloutFromEvaluationInput
): Promise<InitializeRolloutFromEvaluationOutput> {
  const result = initializeRolloutFromEvaluation(input);

  if (!result.shouldStartRollout || !result.plan) {
    return result;
  }

  await input.repository.savePlan(result.plan);

  const startedAudit = createRolloutStartedAuditEvent(
    result.plan,
    input.nowIso ?? result.plan.createdAt
  );

  await input.repository.saveAuditEvent(startedAudit);

  return result;
}
