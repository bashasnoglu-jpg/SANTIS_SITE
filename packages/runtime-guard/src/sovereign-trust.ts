import { z } from 'zod';

export const TrustInteractionSchema = z.object({
  id: z.string().min(1),
  ts: z.number().int().positive(),
  interventionFrequency: z.number().min(0).max(1),
  alignmentScore: z.number().min(0).max(1),
  continuityRisk: z.number().min(0).max(1),
  requestedControlSurface: z.enum(['ambient', 'bounded_choice', 'explicit_choice', 'manual_override']),
  safetyRelevant: z.boolean().default(false),
  invariantRelevant: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({})
});

export type TrustInteraction = z.infer<typeof TrustInteractionSchema>;

export const TrustVerdictSchema = z.object({
  action: z.enum(['preserve_agency', 'narrow_control_surface', 'require_truth_anchor', 'escalate_to_governance']),
  reason: z.string(),
  allowedControlSurface: z.enum(['ambient', 'bounded_choice', 'explicit_choice', 'manual_override']),
  trustSignal: z.enum(['stable', 'guarded', 'strained', 'requires_review']),
  metadata: z.record(z.unknown()).default({})
});

export type TrustVerdict = z.infer<typeof TrustVerdictSchema>;

export function evaluateSovereignTrust(input: unknown): TrustVerdict {
  const parsed = TrustInteractionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      action: 'require_truth_anchor',
      reason: 'Trust interaction failed validation; use minimal explanation and bounded choice.',
      allowedControlSurface: 'bounded_choice',
      trustSignal: 'guarded',
      metadata: { issues: parsed.error.issues }
    };
  }

  const interaction = parsed.data;

  if (interaction.safetyRelevant || interaction.invariantRelevant || interaction.continuityRisk >= 0.75) {
    return {
      action: 'escalate_to_governance',
      reason: 'Control request touches safety, invariant, or high continuity risk.',
      allowedControlSurface: 'bounded_choice',
      trustSignal: 'requires_review',
      metadata: { continuityRisk: interaction.continuityRisk }
    };
  }

  if (interaction.requestedControlSurface === 'manual_override') {
    return {
      action: 'narrow_control_surface',
      reason: 'Manual override is not a guest-facing trust surface; provide bounded explicit choice instead.',
      allowedControlSurface: 'explicit_choice',
      trustSignal: 'strained',
      metadata: { requestedControlSurface: interaction.requestedControlSurface }
    };
  }

  if (interaction.interventionFrequency > 0.55 || interaction.alignmentScore < 0.55) {
    return {
      action: 'require_truth_anchor',
      reason: 'High intervention frequency or low alignment requires a truth anchor before reducing control surface.',
      allowedControlSurface: 'explicit_choice',
      trustSignal: 'guarded',
      metadata: { interventionFrequency: interaction.interventionFrequency, alignmentScore: interaction.alignmentScore }
    };
  }

  if (interaction.interventionFrequency < 0.2 && interaction.alignmentScore >= 0.8) {
    return {
      action: 'preserve_agency',
      reason: 'Trust is stable; preserve agency while allowing the interface to recede.',
      allowedControlSurface: interaction.requestedControlSurface === 'explicit_choice' ? 'bounded_choice' : interaction.requestedControlSurface,
      trustSignal: 'stable',
      metadata: { alignmentScore: interaction.alignmentScore }
    };
  }

  return {
    action: 'preserve_agency',
    reason: 'Agency can remain visible while trust continues to stabilize.',
    allowedControlSurface: interaction.requestedControlSurface,
    trustSignal: 'stable',
    metadata: {}
  };
}
