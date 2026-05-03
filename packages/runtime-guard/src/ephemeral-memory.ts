import { z } from 'zod';

export const EphemeralStateSchema = z.object({
  sessionId: z.string().min(1),
  ts: z.number().int().positive(),
  stateVector: z.record(z.number()),
  consentLevel: z.enum(['ambient_only', 'operational', 'full_personalization']).default('ambient_only'),
  ttlMs: z.number().int().positive().max(6 * 60 * 60 * 1000).default(60 * 60 * 1000),
  metadata: z.record(z.unknown()).default({})
});

export type EphemeralState = z.infer<typeof EphemeralStateSchema>;

export const ResonanceEssenceSchema = z.object({
  createdAt: z.number().int().positive(),
  sourceSessionIdHash: z.string().min(1),
  retainedPattern: z.record(z.number()),
  discardedFields: z.array(z.string()),
  reidentificationRisk: z.enum(['low', 'blocked']),
  expiresAt: z.number().int().positive()
});

export type ResonanceEssence = z.infer<typeof ResonanceEssenceSchema>;

function hashSessionId(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return `session-hash-${hash.toString(16)}`;
}

export function createEphemeralState(input: unknown): EphemeralState {
  const parsed = EphemeralStateSchema.parse(input);
  return {
    ...parsed,
    metadata: {}
  };
}

export function distillResonanceEssence(state: EphemeralState): ResonanceEssence {
  const retainedPattern = Object.fromEntries(
    Object.entries(state.stateVector).map(([key, value]) => [key, Math.round(value * 100) / 100])
  );

  return ResonanceEssenceSchema.parse({
    createdAt: Date.now(),
    sourceSessionIdHash: hashSessionId(state.sessionId),
    retainedPattern,
    discardedFields: ['sessionId', 'metadata', 'identity', 'biometric_raw', 'personal_history'],
    reidentificationRisk: 'blocked',
    expiresAt: Date.now() + state.ttlMs
  });
}

export function shouldForgetEphemeralState(state: EphemeralState, now = Date.now()): boolean {
  return now - state.ts >= state.ttlMs;
}
