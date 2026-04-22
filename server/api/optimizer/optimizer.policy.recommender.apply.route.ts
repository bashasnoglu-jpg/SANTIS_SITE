import type { Request, Response } from 'express';
import type { OptimizerPolicyRecommenderApplyEngine } from '../../core/experiments/optimizer/optimizer.policy.recommender.apply.engine.ts';

interface CreateOptimizerPolicyRecommenderApplyRouteDeps {
  applyEngine: OptimizerPolicyRecommenderApplyEngine;
}

export function createOptimizerPolicyRecommenderApplyRoute(
  deps: CreateOptimizerPolicyRecommenderApplyRouteDeps
) {
  return async function optimizerPolicyRecommenderApplyRoute(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { experimentId, recommendationId } = req.body;
      const actorId = 'boardroom.operator'; // Hardcoded for this iteration

      if (!experimentId || !recommendationId) {
        res.status(400).json({ ok: false, error: 'experimentId and recommendationId are required' });
        return;
      }

      const proposal = await deps.applyEngine.applyRecommendation(
        experimentId,
        actorId,
        recommendationId
      );

      res.status(200).json({
        ok: true,
        proposal,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error during compilation';
      res.status(400).json({ ok: false, error: msg });
    }
  };
}
