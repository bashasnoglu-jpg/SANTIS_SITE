import type { Request, Response } from 'express';
import type { OptimizerDecisionSnapshotStore } from '../../core/experiments/optimizer/optimizer.ops.snapshot.store.ts';
import type { OptimizerPolicyEngineV33 } from '../../core/experiments/optimizer/optimizer.policy.engine.v33.ts';
import { OptimizerPolicyRecommenderEngine } from '../../core/experiments/optimizer/optimizer.policy.recommender.engine.ts';

interface CreateOptimizerPolicyRecommenderRouteDeps {
  snapshotStore: OptimizerDecisionSnapshotStore;
  policyEngine: OptimizerPolicyEngineV33;
  recommenderEngine: OptimizerPolicyRecommenderEngine;
}

export function createOptimizerPolicyRecommenderRoute(
  deps: CreateOptimizerPolicyRecommenderRouteDeps
) {
  return async function optimizerPolicyRecommenderRoute(
    req: Request,
    res: Response
  ): Promise<void> {
    const experimentId = String(req.query.experimentId ?? '').trim();
    const hours = Number(req.query.hours ?? 24);

    if (!experimentId) {
      res.status(400).json({ error: 'experimentId is required' });
      return;
    }

    const now = Date.now();
    const from = new Date(now - hours * 60 * 60 * 1000).toISOString();
    const to = new Date(now).toISOString();

    const baselinePolicy = await deps.policyEngine.resolvePolicy(experimentId);

    const snapshots = await deps.snapshotStore.getRange({
      experimentId,
      from,
      to,
      limit: 1000,
    });

    const result = await deps.recommenderEngine.recommend({
      experimentId,
      baselinePolicy,
      snapshots,
      from,
      to,
    });

    res.status(200).json(result);
  };
}
