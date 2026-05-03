import { z } from 'zod';

export const PurposeDecisionSchema = z.object({
  id: z.string().min(1),
  ts: z.number().int().positive(),
  proposedAction: z.string().min(1),
  expectedRevenueDelta: z.number().default(0),
  expectedFlowDelta: z.number().default(0),
  expectedContinuityDelta: z.number().default(0),
  expectedNoiseDelta: z.number().default(0),
  rationale: z.string().min(1),
  metadata: z.record(z.unknown()).default({})
});

export type PurposeDecision = z.infer<typeof PurposeDecisionSchema>;

export const PurposeVerdictSchema = z.object({
  status: z.enum(['allow', 'veto', 'requires_boardroom_review']),
  reason: z.string(),
  protectedPrinciple: z.enum([
    'continuum_integrity',
    'quiet_luxury',
    'truth_preservation',
    'guest_dignity',
    'operational_flow'
  ]),
  metadata: z.record(z.unknown()).default({})
});

export type PurposeVerdict = z.infer<typeof PurposeVerdictSchema>;

export function evaluateTeleologicalPurpose(input: unknown): PurposeVerdict {
  const parsed = PurposeDecisionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: 'veto',
      reason: 'Purpose decision failed schema validation.',
      protectedPrinciple: 'truth_preservation',
      metadata: { issues: parsed.error.issues }
    };
  }

  const decision = parsed.data;

  if (decision.expectedNoiseDelta > 0.2 && decision.expectedRevenueDelta > 0) {
    return {
      status: 'veto',
      reason: 'Revenue-positive action introduces unacceptable experiential noise.',
      protectedPrinciple: 'quiet_luxury',
      metadata: { expectedNoiseDelta: decision.expectedNoiseDelta, expectedRevenueDelta: decision.expectedRevenueDelta }
    };
  }

  if (decision.expectedContinuityDelta < -0.05) {
    return {
      status: 'veto',
      reason: 'Proposed action degrades Continuum integrity.',
      protectedPrinciple: 'continuum_integrity',
      metadata: { expectedContinuityDelta: decision.expectedContinuityDelta }
    };
  }

  if (decision.expectedFlowDelta < -0.1 && decision.expectedRevenueDelta > 0) {
    return {
      status: 'requires_boardroom_review',
      reason: 'Revenue improvement may reduce operational flow and requires human review.',
      protectedPrinciple: 'operational_flow',
      metadata: { expectedFlowDelta: decision.expectedFlowDelta, expectedRevenueDelta: decision.expectedRevenueDelta }
    };
  }

  return {
    status: 'allow',
    reason: 'Action aligns with protected Santis OS principles.',
    protectedPrinciple: 'truth_preservation',
    metadata: {}
  };
}
