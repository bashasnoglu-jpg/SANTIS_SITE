import { z } from 'zod';

export const CandidateDecisionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  alignmentScore: z.number().min(0).max(1),
  riskScore: z.number().min(0).max(1),
  continuityDelta: z.number(),
  expectedDoubtDelta: z.number(),
  reason: z.string().min(1),
  metadata: z.record(z.unknown()).default({})
});

export type CandidateDecision = z.infer<typeof CandidateDecisionSchema>;

export const DecisionContextSchema = z.object({
  id: z.string().min(1),
  ts: z.number().int().positive(),
  candidates: z.array(CandidateDecisionSchema).min(1),
  requestedCandidateId: z.string().optional(),
  insistenceLevel: z.number().min(0).max(1).default(0),
  safetyRelevant: z.boolean().default(false),
  invariantRelevant: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({})
});

export type DecisionContext = z.infer<typeof DecisionContextSchema>;

export const DecisionPruningVerdictSchema = z.object({
  action: z.enum(['present_primary', 'present_bounded_alternative', 'veto_requested_option', 'require_truth_anchor']),
  selectedCandidateIds: z.array(z.string()),
  prunedCandidateIds: z.array(z.string()),
  reason: z.string(),
  truthAnchor: z.string().optional(),
  maxVisibleOptions: z.number().int().positive(),
  metadata: z.record(z.unknown()).default({})
});

export type DecisionPruningVerdict = z.infer<typeof DecisionPruningVerdictSchema>;

export function evaluateDecisionPruning(input: unknown): DecisionPruningVerdict {
  const parsed = DecisionContextSchema.safeParse(input);

  if (!parsed.success) {
    return {
      action: 'require_truth_anchor',
      selectedCandidateIds: [],
      prunedCandidateIds: [],
      reason: 'Decision context failed validation; use minimal truth anchor before proceeding.',
      truthAnchor: 'Decision context is incomplete.',
      maxVisibleOptions: 1,
      metadata: { issues: parsed.error.issues }
    };
  }

  const context = parsed.data;
  const sorted = [...context.candidates].sort((a, b) => {
    const aScore = a.alignmentScore - a.riskScore + a.continuityDelta - Math.max(0, a.expectedDoubtDelta);
    const bScore = b.alignmentScore - b.riskScore + b.continuityDelta - Math.max(0, b.expectedDoubtDelta);
    return bScore - aScore;
  });

  const primary = sorted[0];
  const requested = context.requestedCandidateId
    ? context.candidates.find((candidate) => candidate.id === context.requestedCandidateId)
    : undefined;

  if (requested && (context.safetyRelevant || context.invariantRelevant || requested.riskScore >= 0.75 || requested.continuityDelta < -0.1)) {
    return {
      action: 'veto_requested_option',
      selectedCandidateIds: [primary.id],
      prunedCandidateIds: context.candidates.filter((candidate) => candidate.id !== primary.id).map((candidate) => candidate.id),
      reason: 'Requested option violates safety, invariant, risk, or continuity constraints.',
      truthAnchor: `${requested.label} is not available because it weakens continuity or safety.`,
      maxVisibleOptions: 1,
      metadata: { requestedCandidateId: requested.id, riskScore: requested.riskScore, continuityDelta: requested.continuityDelta }
    };
  }

  if (requested && context.insistenceLevel >= 0.65) {
    return {
      action: 'present_bounded_alternative',
      selectedCandidateIds: [primary.id, requested.id].filter((id, index, list) => list.indexOf(id) === index),
      prunedCandidateIds: context.candidates
        .filter((candidate) => candidate.id !== primary.id && candidate.id !== requested.id)
        .map((candidate) => candidate.id),
      reason: 'Guest insistence is acknowledged without exposing the full option space.',
      truthAnchor: `${primary.label} remains the most aligned route; ${requested.label} is available as a bounded alternative.`,
      maxVisibleOptions: 2,
      metadata: { insistenceLevel: context.insistenceLevel }
    };
  }

  if (primary.expectedDoubtDelta > 0.2 || primary.alignmentScore < 0.7) {
    return {
      action: 'require_truth_anchor',
      selectedCandidateIds: [primary.id],
      prunedCandidateIds: context.candidates.filter((candidate) => candidate.id !== primary.id).map((candidate) => candidate.id),
      reason: 'Primary route needs a minimal truth anchor to prevent post-decision doubt.',
      truthAnchor: primary.reason,
      maxVisibleOptions: 1,
      metadata: { alignmentScore: primary.alignmentScore, expectedDoubtDelta: primary.expectedDoubtDelta }
    };
  }

  return {
    action: 'present_primary',
    selectedCandidateIds: [primary.id],
    prunedCandidateIds: context.candidates.filter((candidate) => candidate.id !== primary.id).map((candidate) => candidate.id),
    reason: 'Primary route is sufficiently aligned and low-doubt; suppress the remaining option space.',
    maxVisibleOptions: 1,
    metadata: { alignmentScore: primary.alignmentScore }
  };
}
