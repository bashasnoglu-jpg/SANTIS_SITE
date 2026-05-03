import { z } from 'zod';

export const PresenceContextSchema = z.object({
  id: z.string().min(1),
  ts: z.number().int().positive(),
  guestStateConfidence: z.number().min(0).max(1),
  requestedVisibility: z.enum(['ambient', 'subtle', 'explicit', 'clinical']),
  privacyMode: z.enum(['standard', 'high_privacy', 'observer_disabled']).default('standard'),
  consentLevel: z.enum(['ambient_only', 'operational', 'full_personalization']).default('ambient_only'),
  reason: z.string().min(1),
  metadata: z.record(z.unknown()).default({})
});

export type PresenceContext = z.infer<typeof PresenceContextSchema>;

export const PresenceVerdictSchema = z.object({
  visibility: z.enum(['ambient', 'subtle', 'explicit', 'clinical']),
  allowedSignals: z.array(z.enum(['light', 'temperature', 'sound', 'scent', 'surface', 'staff_prompt'])),
  disallowedSignals: z.array(z.enum(['biometric_inference', 'hidden_tracking', 'unexplained_personalization', 'persistent_identity_echo'])),
  reason: z.string(),
  disclosureRequired: z.boolean(),
  metadata: z.record(z.unknown()).default({})
});

export type PresenceVerdict = z.infer<typeof PresenceVerdictSchema>;

export function evaluatePresence(input: unknown): PresenceVerdict {
  const parsed = PresenceContextSchema.safeParse(input);

  if (!parsed.success) {
    return {
      visibility: 'clinical',
      allowedSignals: ['surface', 'staff_prompt'],
      disallowedSignals: ['biometric_inference', 'hidden_tracking', 'unexplained_personalization', 'persistent_identity_echo'],
      reason: 'Presence context failed validation. Use explicit, low-ambiguity interaction only.',
      disclosureRequired: true,
      metadata: { issues: parsed.error.issues }
    };
  }

  const context = parsed.data;

  if (context.privacyMode === 'observer_disabled') {
    return {
      visibility: 'explicit',
      allowedSignals: ['surface', 'staff_prompt'],
      disallowedSignals: ['biometric_inference', 'hidden_tracking', 'unexplained_personalization', 'persistent_identity_echo'],
      reason: 'Observer-disabled mode limits presence to explicit surfaces and staff prompts.',
      disclosureRequired: true,
      metadata: { privacyMode: context.privacyMode }
    };
  }

  if (context.privacyMode === 'high_privacy' || context.consentLevel === 'ambient_only') {
    return {
      visibility: 'ambient',
      allowedSignals: ['light', 'temperature', 'sound', 'surface'],
      disallowedSignals: ['biometric_inference', 'hidden_tracking', 'unexplained_personalization', 'persistent_identity_echo'],
      reason: 'Presence remains ambient and non-identifying under privacy-limited context.',
      disclosureRequired: false,
      metadata: { consentLevel: context.consentLevel }
    };
  }

  if (context.requestedVisibility === 'clinical') {
    return {
      visibility: 'clinical',
      allowedSignals: ['surface', 'staff_prompt'],
      disallowedSignals: ['biometric_inference', 'hidden_tracking', 'unexplained_personalization', 'persistent_identity_echo'],
      reason: 'Clinical visibility requires explicit surface-level communication.',
      disclosureRequired: true,
      metadata: { requestedVisibility: context.requestedVisibility }
    };
  }

  if (context.guestStateConfidence < 0.6) {
    return {
      visibility: 'subtle',
      allowedSignals: ['light', 'surface', 'staff_prompt'],
      disallowedSignals: ['biometric_inference', 'hidden_tracking', 'unexplained_personalization', 'persistent_identity_echo'],
      reason: 'Low confidence limits presence to subtle, reversible signals.',
      disclosureRequired: false,
      metadata: { guestStateConfidence: context.guestStateConfidence }
    };
  }

  return {
    visibility: context.requestedVisibility === 'explicit' ? 'explicit' : 'subtle',
    allowedSignals: ['light', 'temperature', 'sound', 'scent', 'surface', 'staff_prompt'],
    disallowedSignals: ['biometric_inference', 'hidden_tracking', 'unexplained_personalization', 'persistent_identity_echo'],
    reason: 'Presence approved within consent and privacy boundaries.',
    disclosureRequired: context.requestedVisibility === 'explicit',
    metadata: { guestStateConfidence: context.guestStateConfidence }
  };
}
