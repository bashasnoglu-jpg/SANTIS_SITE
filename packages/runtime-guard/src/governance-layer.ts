import { z } from 'zod';

export const GovernanceActorSchema = z.object({
  actorId: z.string().min(1),
  role: z.enum(['architect', 'commander', 'operator', 'system']),
  scopes: z.array(z.enum([
    'runtime_override',
    'pricing_review',
    'clinical_review',
    'manual_mode',
    'purpose_veto_review',
    'observer_only'
  ])).default([])
});

export type GovernanceActor = z.infer<typeof GovernanceActorSchema>;

export const GovernanceRequestSchema = z.object({
  requestId: z.string().min(1),
  ts: z.number().int().positive(),
  actor: GovernanceActorSchema,
  requestedAction: z.enum([
    'approve_runtime_override',
    'approve_purpose_exception',
    'enter_manual_mode',
    'exit_manual_mode',
    'acknowledge_flow_freeze',
    'dismiss_recommendation'
  ]),
  reason: z.string().min(12),
  affectedScope: z.enum(['runtime', 'pricing', 'clinical', 'purpose', 'operations']),
  metadata: z.record(z.unknown()).default({})
});

export type GovernanceRequest = z.infer<typeof GovernanceRequestSchema>;

export const GovernanceVerdictSchema = z.object({
  status: z.enum(['approved', 'denied', 'requires_dual_control', 'observer_mode']),
  reason: z.string(),
  auditRequired: z.boolean().default(true),
  expiresAt: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type GovernanceVerdict = z.infer<typeof GovernanceVerdictSchema>;

const ACTION_SCOPE: Record<GovernanceRequest['requestedAction'], GovernanceActor['scopes'][number]> = {
  approve_runtime_override: 'runtime_override',
  approve_purpose_exception: 'purpose_veto_review',
  enter_manual_mode: 'manual_mode',
  exit_manual_mode: 'manual_mode',
  acknowledge_flow_freeze: 'runtime_override',
  dismiss_recommendation: 'observer_only'
};

export function evaluateGovernanceRequest(input: unknown): GovernanceVerdict {
  const parsed = GovernanceRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: 'denied',
      reason: 'Governance request failed schema validation.',
      auditRequired: true,
      metadata: { issues: parsed.error.issues }
    };
  }

  const request = parsed.data;
  const requiredScope = ACTION_SCOPE[request.requestedAction];
  const hasScope = request.actor.scopes.includes(requiredScope);

  if (!hasScope) {
    return {
      status: 'denied',
      reason: 'Actor does not have the required governance scope.',
      auditRequired: true,
      metadata: { requiredScope, actorScopes: request.actor.scopes }
    };
  }

  if (request.requestedAction === 'enter_manual_mode') {
    return {
      status: 'requires_dual_control',
      reason: 'Manual mode requires dual authorization and immutable audit.',
      auditRequired: true,
      expiresAt: request.ts + 15 * 60 * 1000,
      metadata: { affectedScope: request.affectedScope }
    };
  }

  if (request.requestedAction === 'approve_purpose_exception' && request.affectedScope === 'clinical') {
    return {
      status: 'requires_dual_control',
      reason: 'Clinical purpose exceptions require dual review.',
      auditRequired: true,
      expiresAt: request.ts + 10 * 60 * 1000,
      metadata: { affectedScope: request.affectedScope }
    };
  }

  return {
    status: 'approved',
    reason: 'Governance request approved within actor scope.',
    auditRequired: true,
    expiresAt: request.ts + 15 * 60 * 1000,
    metadata: { requiredScope }
  };
}

export function enterObserverMode(reason: string): GovernanceVerdict {
  return {
    status: 'observer_mode',
    reason,
    auditRequired: true,
    metadata: {
      mode: 'observer',
      behavior: 'System does not mutate decisions, but records deviations and counterfactual risk for Boardroom review.'
    }
  };
}
