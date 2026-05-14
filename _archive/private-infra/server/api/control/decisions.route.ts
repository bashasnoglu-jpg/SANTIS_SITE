import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { OperatorDecisionPayloadSchema } from '../../core/concierge/control/operator.schemas.ts';

export async function postOperatorDecision(req: Request, res: Response) {
  try {
    const payload = OperatorDecisionPayloadSchema.parse(req.body);

    console.log('[control.operatorDecision]', {
      actionId: payload.actionId,
      operatorId: payload.operatorId,
      decision: payload.decision,
      reason: payload.reason ?? null,
      ts: payload.ts,
    });

    return res.status(202).json({
      ok: true,
      accepted: true,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        ok: false,
        error: 'BAD_OPERATOR_DECISION',
        issues: error.issues,
      });
    }

    return res.status(500).json({
      ok: false,
      error: 'OPERATOR_DECISION_FAILED',
    });
  }
}
