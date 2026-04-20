export const ROLLOUT_STAGES = [10, 25, 50, 100] as const;
export type RolloutStagePercent = typeof ROLLOUT_STAGES[number];

export type RolloutStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'rolled_back'
  | 'completed'
  | 'aborted';

export type RolloutDecision =
  | 'advance'
  | 'hold'
  | 'pause'
  | 'rollback'
  | 'complete';

export type RolloutTriggerReason =
  | 'manual_approval'
  | 'minimum_sample_not_met'
  | 'confidence_too_low'
  | 'latency_regression'
  | 'conversion_regression'
  | 'error_rate_regression'
  | 'guardrail_breach'
  | 'missing_metrics'
  | 'manual_pause'
  | 'manual_rollback'
  | 'healthy_progression';

export interface RolloutPlan {
  rolloutId: string;
  experimentId: string;
  winnerVariantId: string;
  controlVariantId: string;
  createdAt: string;
  createdBy: string;
  requiresHumanApprovalAt100: boolean;
  stages: RolloutStagePercent[];
  currentStage: RolloutStagePercent;
  status: RolloutStatus;
  baselinePolicyVersion: string;
  candidatePolicyVersion: string;
}

export interface RolloutGuardrails {
  minSampleSizePerStage: number;
  minConfidenceScore: number;
  maxRelativeLatencyIncreasePct: number;
  maxAbsoluteErrorRate: number;
  maxRelativeConversionDropPct: number;
  evaluationWindowMinutes: number;
  consecutiveHealthyWindowsRequired: number;
}

export interface RolloutHealthSnapshot {
  timestamp: string;
  stagePercent: RolloutStagePercent;
  sampleSize: number;
  confidenceScore: number;
  control: {
    conversionRate: number;
    errorRate: number;
    p95LatencyMs: number;
  };
  candidate: {
    conversionRate: number;
    errorRate: number;
    p95LatencyMs: number;
  };
}

export interface RolloutDecisionRecord {
  rolloutId: string;
  timestamp: string;
  fromStage: RolloutStagePercent;
  proposedDecision: RolloutDecision;
  finalDecision: RolloutDecision;
  reason: RolloutTriggerReason;
  notes?: string;
}

export const DEFAULT_ROLLOUT_GUARDRAILS: RolloutGuardrails = {
  minSampleSizePerStage: 500,
  minConfidenceScore: 85,
  maxRelativeLatencyIncreasePct: 15,
  maxAbsoluteErrorRate: 0.03,
  maxRelativeConversionDropPct: 8,
  evaluationWindowMinutes: 15,
  consecutiveHealthyWindowsRequired: 2,
};

export interface RolloutAuditEvent {
  eventId: string;
  rolloutId: string;
  timestamp: string;
  eventType:
    | 'rollout_started'
    | 'rollout_advanced'
    | 'rollout_held'
    | 'rollout_paused'
    | 'rollout_rolled_back'
    | 'rollout_completed';
  payload: Record<string, unknown>;
}
