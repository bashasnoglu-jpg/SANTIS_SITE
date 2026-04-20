import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { GovernanceOutcomeSchema } from '../../core/concierge/governance/governance.schemas.ts';

export async function postGovernanceOutcome(req: Request, res: Response) {
  try {
    const payload = GovernanceOutcomeSchema.parse(req.body);

    console.log('[governance.outcome]', payload);

    return res.status(202).json({
      ok: true,
      accepted: true,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        ok: false,
        error: 'BAD_GOVERNANCE_OUTCOME',
        issues: error.issues,
      });
    }

    return res.status(500).json({
      ok: false,
      error: 'GOVERNANCE_OUTCOME_FAILED',
    });
  }
}
