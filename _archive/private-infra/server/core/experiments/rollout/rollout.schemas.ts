import { z } from 'zod';

export const RolloutStagePercentSchema = z.union([
  z.literal(10),
  z.literal(25),
  z.literal(50),
  z.literal(100),
]);

export const RolloutStatusSchema = z.enum([
  'draft',
  'scheduled',
  'running',
  'paused',
  'rolled_back',
  'completed',
  'aborted',
]);

export const RolloutDecisionSchema = z.enum([
  'advance',
  'hold',
  'pause',
  'rollback',
  'complete',
]);

export const RolloutTriggerReasonSchema = z.enum([
  'manual_approval',
  'minimum_sample_not_met',
  'confidence_too_low',
  'latency_regression',
  'conversion_regression',
  'error_rate_regression',
  'guardrail_breach',
  'missing_metrics',
  'manual_pause',
  'manual_rollback',
  'healthy_progression',
]);

export const RolloutPlanSchema = z.object({
  rolloutId: z.string().min(1),
  experimentId: z.string().min(1),
  winnerVariantId: z.string().min(1),
  controlVariantId: z.string().min(1),
  createdAt: z.string().datetime(),
  createdBy: z.string().min(1),
  requiresHumanApprovalAt100: z.boolean(),
  stages: z.array(RolloutStagePercentSchema).min(1),
  currentStage: RolloutStagePercentSchema,
  status: RolloutStatusSchema,
  baselinePolicyVersion: z.string().min(1),
  candidatePolicyVersion: z.string().min(1),
});

export const RolloutGuardrailsSchema = z.object({
  minSampleSizePerStage: z.number().int().positive(),
  minConfidenceScore: z.number().positive(),
  maxRelativeLatencyIncreasePct: z.number().nonnegative(),
  maxAbsoluteErrorRate: z.number().min(0).max(1),
  maxRelativeConversionDropPct: z.number().nonnegative(),
  evaluationWindowMinutes: z.number().int().positive(),
  consecutiveHealthyWindowsRequired: z.number().int().positive(),
});

export const RolloutHealthSnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  stagePercent: RolloutStagePercentSchema,
  sampleSize: z.number().int().nonnegative(),
  confidenceScore: z.number(),
  control: z.object({
    conversionRate: z.number().min(0).max(1),
    errorRate: z.number().min(0).max(1),
    p95LatencyMs: z.number().nonnegative(),
  }),
  candidate: z.object({
    conversionRate: z.number().min(0).max(1),
    errorRate: z.number().min(0).max(1),
    p95LatencyMs: z.number().nonnegative(),
  }),
});

export const RolloutDecisionRecordSchema = z.object({
  rolloutId: z.string().min(1),
  timestamp: z.string().datetime(),
  fromStage: RolloutStagePercentSchema,
  proposedDecision: RolloutDecisionSchema,
  finalDecision: RolloutDecisionSchema,
  reason: RolloutTriggerReasonSchema,
  notes: z.string().optional(),
});

export const RolloutAuditEventSchema = z.object({
  eventId: z.string().min(1),
  rolloutId: z.string().min(1),
  timestamp: z.string().datetime(),
  eventType: z.enum([
    'rollout_started',
    'rollout_advanced',
    'rollout_held',
    'rollout_paused',
    'rollout_rolled_back',
    'rollout_completed',
  ]),
  payload: z.record(z.unknown()),
});
