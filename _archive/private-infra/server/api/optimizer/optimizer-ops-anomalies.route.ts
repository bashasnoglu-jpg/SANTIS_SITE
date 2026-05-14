import type { Request, Response } from 'express';
import type { OptimizerDecisionSnapshotStore } from '../../core/experiments/optimizer/optimizer.ops.snapshot.store.ts';
import { buildOptimizerOpsTrendsResponse } from '../../core/experiments/optimizer/optimizer.ops.trends.mapper.ts';
import { detectOptimizerAnomalies } from '../../core/experiments/optimizer/optimizer.ops.anomaly.detector.ts';

interface CreateOptimizerOpsAnomaliesRouteDeps {
  snapshotStore: OptimizerDecisionSnapshotStore;
}

export function createOptimizerOpsAnomaliesRoute(
  deps: CreateOptimizerOpsAnomaliesRouteDeps
) {
  return async function optimizerOpsAnomaliesRoute(
    req: Request,
    res: Response
  ): Promise<void> {
    const experimentId = String(req.query.experimentId ?? '').trim();
    const hours = Number(req.query.hours ?? 1);

    if (!experimentId) {
      res.status(400).json({ error: 'experimentId is required' });
      return;
    }

    const now = Date.now();
    const from = new Date(now - hours * 60 * 60 * 1000).toISOString();
    const to = new Date(now).toISOString();

    const snapshots = await deps.snapshotStore.getRange({
      experimentId,
      from,
      to,
      limit: 500,
    });

    const trendResponse = buildOptimizerOpsTrendsResponse({
      experimentId,
      from,
      to,
      snapshots,
    });

    const anomalies = detectOptimizerAnomalies(trendResponse.points);

    res.status(200).json({ anomalies });
  };
}
