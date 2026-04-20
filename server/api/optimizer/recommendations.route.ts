import type { Request, Response } from 'express';
import { derivePolicyOptimizerOutput } from '../../core/concierge/optimizer/optimizer.adapter.ts';

export async function getOptimizerRecommendations(_req: Request, res: Response) {
  const observations: any[] = [];

  const output = derivePolicyOptimizerOutput({
    observations,
  });

  return res.status(200).json({
    ok: true,
    output,
  });
}
