import type { Request, Response } from 'express';
import { deriveGovernanceScoreboard } from '../../core/concierge/governance/governance.adapter.ts';

export async function getGovernanceScoreboard(_req: Request, res: Response) {
  const exposures: any[] = [];
  const outcomes: any[] = [];

  const scoreboard = deriveGovernanceScoreboard({
    exposures,
    outcomes,
  });

  return res.status(200).json({
    ok: true,
    scoreboard,
  });
}
