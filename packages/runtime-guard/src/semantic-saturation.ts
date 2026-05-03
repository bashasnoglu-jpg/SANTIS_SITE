import { z } from 'zod';

export const MeaningEventSchema = z.object({
  id: z.string().min(1),
  ts: z.number().int().positive(),
  surface: z.enum(['guest_ui', 'concierge', 'therapist', 'room', 'boardroom']),
  intent: z.enum(['inform', 'persuade', 'explain', 'confirm', 'protect', 'clinical_disclosure']),
  narrativeLoad: z.number().min(0).max(1),
  meaningConfidence: z.number().min(0).max(1),
  requiresDisclosure: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({})
});

export type MeaningEvent = z.infer<typeof MeaningEventSchema>;

export const MeaningVerdictSchema = z.object({
  action: z.enum(['suppress_narrative', 'allow_silent_meaning', 'require_minimal_explanation', 'require_clinical_disclosure']),
  reason: z.string(),
  maxAllowedWords: z.number().int().nonnegative(),
  forbiddenPatterns: z.array(z.enum(['marketing_claim', 'mystic_language', 'over_explanation', 'persuasion_copy', 'performative_story'])),
  requiredProperties: z.array(z.enum(['truthful', 'minimal', 'reversible', 'non_persuasive', 'safety_relevant'])),
  metadata: z.record(z.unknown()).default({})
});

export type MeaningVerdict = z.infer<typeof MeaningVerdictSchema>;

export function evaluateSemanticSaturation(input: unknown): MeaningVerdict {
  const parsed = MeaningEventSchema.safeParse(input);

  if (!parsed.success) {
    return {
      action: 'require_minimal_explanation',
      reason: 'Meaning event failed validation; use minimal explicit explanation.',
      maxAllowedWords: 18,
      forbiddenPatterns: ['marketing_claim', 'mystic_language', 'over_explanation', 'persuasion_copy', 'performative_story'],
      requiredProperties: ['truthful', 'minimal', 'non_persuasive'],
      metadata: { issues: parsed.error.issues }
    };
  }

  const event = parsed.data;

  if (event.requiresDisclosure || event.intent === 'clinical_disclosure') {
    return {
      action: 'require_clinical_disclosure',
      reason: 'Disclosure is required for safety, consent, or clinical clarity.',
      maxAllowedWords: 42,
      forbiddenPatterns: ['marketing_claim', 'mystic_language', 'persuasion_copy', 'performative_story'],
      requiredProperties: ['truthful', 'minimal', 'safety_relevant', 'non_persuasive'],
      metadata: { surface: event.surface }
    };
  }

  if (event.intent === 'persuade' || event.narrativeLoad > 0.35) {
    return {
      action: 'suppress_narrative',
      reason: 'Persuasive or high-load narrative is not allowed on guest-facing Continuum surfaces.',
      maxAllowedWords: 0,
      forbiddenPatterns: ['marketing_claim', 'mystic_language', 'over_explanation', 'persuasion_copy', 'performative_story'],
      requiredProperties: ['truthful', 'minimal', 'non_persuasive'],
      metadata: { narrativeLoad: event.narrativeLoad }
    };
  }

  if (event.meaningConfidence < 0.65) {
    return {
      action: 'require_minimal_explanation',
      reason: 'Low meaning confidence requires a small truth anchor instead of silent interpretation.',
      maxAllowedWords: 14,
      forbiddenPatterns: ['marketing_claim', 'mystic_language', 'over_explanation', 'persuasion_copy', 'performative_story'],
      requiredProperties: ['truthful', 'minimal', 'reversible', 'non_persuasive'],
      metadata: { meaningConfidence: event.meaningConfidence }
    };
  }

  return {
    action: 'allow_silent_meaning',
    reason: 'Meaning is sufficiently carried by the environment and does not require narrative.',
    maxAllowedWords: 0,
    forbiddenPatterns: ['marketing_claim', 'mystic_language', 'over_explanation', 'persuasion_copy', 'performative_story'],
    requiredProperties: ['truthful', 'minimal', 'non_persuasive'],
    metadata: { meaningConfidence: event.meaningConfidence }
  };
}
