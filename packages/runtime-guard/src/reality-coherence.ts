import { z } from 'zod';

export const CoherenceEventSchema = z.object({
  id: z.string().min(1),
  ts: z.number().int().positive(),
  domain: z.enum(['boardroom', 'guest_ui', 'room', 'concierge', 'therapist', 'handoff', 'post_visit']),
  continuityDelta: z.number(),
  causalTraceId: z.string().min(1),
  externalized: z.boolean().default(false),
  identityBound: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({})
});

export type CoherenceEvent = z.infer<typeof CoherenceEventSchema>;

export const CoherenceVerdictSchema = z.object({
  action: z.enum(['allow_reflection', 'require_causal_trace', 'block_externalization', 'localize_to_property']),
  reason: z.string(),
  allowedScope: z.enum(['property', 'session', 'post_visit_generic', 'boardroom_only']),
  carryForward: z.enum(['none', 'generic_principle', 'anonymous_pattern']),
  metadata: z.record(z.unknown()).default({})
});

export type CoherenceVerdict = z.infer<typeof CoherenceVerdictSchema>;

export function evaluateRealityCoherence(input: unknown): CoherenceVerdict {
  const parsed = CoherenceEventSchema.safeParse(input);

  if (!parsed.success) {
    return {
      action: 'require_causal_trace',
      reason: 'Coherence event failed validation; require causal trace before propagation.',
      allowedScope: 'boardroom_only',
      carryForward: 'none',
      metadata: { issues: parsed.error.issues }
    };
  }

  const event = parsed.data;

  if (!event.causalTraceId || event.continuityDelta < -0.1) {
    return {
      action: 'require_causal_trace',
      reason: 'Negative continuity or missing causal trace cannot propagate across domains.',
      allowedScope: 'boardroom_only',
      carryForward: 'none',
      metadata: { continuityDelta: event.continuityDelta }
    };
  }

  if (event.externalized && event.identityBound) {
    return {
      action: 'block_externalization',
      reason: 'Identity-bound coherence must not leave the property or session boundary.',
      allowedScope: 'session',
      carryForward: 'none',
      metadata: { domain: event.domain }
    };
  }

  if (event.domain === 'post_visit') {
    return {
      action: 'localize_to_property',
      reason: 'Post-visit continuity may carry only generic principles, never identity-bound memory.',
      allowedScope: 'post_visit_generic',
      carryForward: 'generic_principle',
      metadata: { externalized: event.externalized }
    };
  }

  return {
    action: 'allow_reflection',
    reason: 'Coherence event may reflect within the property Continuum.',
    allowedScope: 'property',
    carryForward: 'anonymous_pattern',
    metadata: { causalTraceId: event.causalTraceId }
  };
}
