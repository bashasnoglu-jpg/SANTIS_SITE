import { z } from 'zod';

export const RuntimeSeveritySchema = z.enum(['soft_sync', 'stabilize', 'freeze']);
export type RuntimeSeverity = z.infer<typeof RuntimeSeveritySchema>;

export const RuntimeGuardDecisionSchema = z.object({
  status: z.enum(['pass', 'soft_sync', 'stabilize', 'flow_freeze']),
  reason: z.string(),
  severity: RuntimeSeveritySchema,
  invariant: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type RuntimeGuardDecision = z.infer<typeof RuntimeGuardDecisionSchema>;

export const CoreStateRuntimeSchema = z.object({
  sessionId: z.string().min(1),
  guestIntent: z.enum(['reset', 'recover', 'beauty', 'performance', 'connection']).optional(),
  selectedRitualId: z.string().optional(),
  hesitationIndex: z.number().min(0).max(100).optional(),
  conciergeMode: z.enum(['silent', 'suggest', 'handoff']).optional(),
  boardroom: z.object({
    revenueToday: z.number().min(0).optional(),
    vipSessions: z.number().min(0).optional(),
    hesitationAlerts: z.number().min(0).optional(),
    demandLevel: z.enum(['low', 'normal', 'high']).optional()
  }).partial().optional()
});

export type CoreStateRuntime = z.infer<typeof CoreStateRuntimeSchema>;

export function pass(reason = 'Runtime contract valid'): RuntimeGuardDecision {
  return { status: 'pass', severity: 'soft_sync', reason, metadata: {} };
}

export function flowFreeze(reason: string, invariant: string, metadata: Record<string, unknown> = {}): RuntimeGuardDecision {
  return { status: 'flow_freeze', severity: 'freeze', reason, invariant, metadata };
}

export function softSync(reason: string, invariant: string, metadata: Record<string, unknown> = {}): RuntimeGuardDecision {
  return { status: 'soft_sync', severity: 'soft_sync', reason, invariant, metadata };
}

export function validateCoreStateRuntime(input: unknown): RuntimeGuardDecision {
  const parsed = CoreStateRuntimeSchema.safeParse(input);

  if (!parsed.success) {
    return flowFreeze('CoreState payload failed runtime schema validation', 'CORE_STATE_SCHEMA_INVALID', {
      issues: parsed.error.issues
    });
  }

  const state = parsed.data;

  if (state.guestIntent === 'recover' && state.conciergeMode === 'suggest' && state.hesitationIndex !== undefined && state.hesitationIndex > 85) {
    return softSync('High hesitation during recovery intent requires reduced-choice surface', 'RECOVERY_HIGH_HESITATION_REDUCE_CHOICE', {
      hesitationIndex: state.hesitationIndex
    });
  }

  if (state.boardroom?.demandLevel === 'high' && state.conciergeMode === 'silent' && (state.boardroom?.hesitationAlerts ?? 0) > 0) {
    return softSync('High demand with hesitation alerts should surface Boardroom attention', 'DEMAND_HESITATION_ATTENTION_REQUIRED', {
      demandLevel: state.boardroom.demandLevel,
      hesitationAlerts: state.boardroom.hesitationAlerts
    });
  }

  return pass();
}
