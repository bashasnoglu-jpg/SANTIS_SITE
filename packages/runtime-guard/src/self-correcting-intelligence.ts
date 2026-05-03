import { z } from 'zod';
import { CounterfactualRecordSchema, type CounterfactualRecord } from './autonomous-intelligence';

export const CounterfactualOutcomeSchema = z.object({
  recordId: z.string().min(1),
  observedAt: z.number().int().positive(),
  actualOutcome: z.enum([
    'no_break_observed',
    'break_observed',
    'near_miss_observed',
    'over_intervention_observed'
  ]),
  continuityIntegrityDelta: z.number(),
  flowDelta: z.number(),
  awarenessDelta: z.number(),
  notes: z.string().optional()
});

export type CounterfactualOutcome = z.infer<typeof CounterfactualOutcomeSchema>;

export const RecursiveProofSchema = z.object({
  proofId: z.string().min(1),
  createdAt: z.number().int().positive(),
  recordId: z.string().min(1),
  originalConfidence: z.number().min(0).max(1),
  calibratedConfidence: z.number().min(0).max(1),
  predictionQuality: z.enum(['underfit', 'calibrated', 'overfit']),
  recommendedAdjustment: z.enum([
    'none',
    'tighten_threshold',
    'relax_threshold',
    'reduce_pre_freeze_frequency',
    'increase_observation_window'
  ]),
  rationale: z.string().min(1)
});

export type RecursiveProof = z.infer<typeof RecursiveProofSchema>;

export function createRecursiveProof(record: CounterfactualRecord, outcome: CounterfactualOutcome): RecursiveProof {
  const parsedRecord = CounterfactualRecordSchema.parse(record);
  const parsedOutcome = CounterfactualOutcomeSchema.parse(outcome);

  const positiveContinuity = parsedOutcome.continuityIntegrityDelta >= 0;
  const positiveFlow = parsedOutcome.flowDelta >= 0;
  const positiveAwareness = parsedOutcome.awarenessDelta >= 0;

  let predictionQuality: RecursiveProof['predictionQuality'] = 'calibrated';
  let recommendedAdjustment: RecursiveProof['recommendedAdjustment'] = 'none';
  let calibratedConfidence = parsedRecord.confidence;
  let rationale = 'Prediction remained within acceptable calibration bounds.';

  if (parsedOutcome.actualOutcome === 'over_intervention_observed' || (!positiveFlow && positiveContinuity)) {
    predictionQuality = 'overfit';
    recommendedAdjustment = parsedRecord.preventedBy === 'pre_freeze'
      ? 'reduce_pre_freeze_frequency'
      : 'relax_threshold';
    calibratedConfidence = Math.max(0, parsedRecord.confidence - 0.08);
    rationale = 'Intervention protected continuity but degraded flow or appeared stronger than necessary.';
  }

  if (parsedOutcome.actualOutcome === 'break_observed' || (!positiveContinuity && parsedOutcome.actualOutcome !== 'no_break_observed')) {
    predictionQuality = 'underfit';
    recommendedAdjustment = 'tighten_threshold';
    calibratedConfidence = Math.min(1, parsedRecord.confidence + 0.08);
    rationale = 'Observed outcome indicates the prior risk estimate was too low or the intervention was insufficient.';
  }

  if (parsedOutcome.actualOutcome === 'near_miss_observed' && positiveContinuity && positiveFlow && positiveAwareness) {
    predictionQuality = 'calibrated';
    recommendedAdjustment = 'increase_observation_window';
    calibratedConfidence = Math.min(1, parsedRecord.confidence + 0.03);
    rationale = 'Near miss was contained without harming continuity, flow, or awareness.';
  }

  return RecursiveProofSchema.parse({
    proofId: `sci-${Date.now()}`,
    createdAt: Date.now(),
    recordId: parsedRecord.id,
    originalConfidence: parsedRecord.confidence,
    calibratedConfidence,
    predictionQuality,
    recommendedAdjustment,
    rationale
  });
}
