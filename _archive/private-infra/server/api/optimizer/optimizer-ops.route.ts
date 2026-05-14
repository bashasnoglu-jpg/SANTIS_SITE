import type { Request, Response } from 'express';
import { buildOptimizerOpsResponse } from '../../core/experiments/optimizer/optimizer.ops.mapper.ts';

interface OptimizerOpsRouteDeps {
  getLatestOptimizerDecisionSnapshot: (params: {
    experimentId: string;
    requestId?: string;
  }) => Promise<{
    requestId: string;
    constrained: any;
    portfolio: any;
  } | null>;
}

export function createOptimizerOpsRoute(deps: OptimizerOpsRouteDeps) {
  return async function optimizerOpsRoute(
    req: Request,
    res: Response
  ): Promise<void> {
    const experimentId = String(req.query.experimentId ?? '').trim();
    const requestId = String(req.query.requestId ?? '').trim();

    if (!experimentId) {
      res.status(400).json({
        error: 'experimentId is required',
      });
      return;
    }

    const snapshot = await deps.getLatestOptimizerDecisionSnapshot({
      experimentId,
      requestId: requestId || undefined,
    });

    if (!snapshot) {
      res.status(404).json({
        error: 'No optimizer snapshot found',
      });
      return;
    }

    const payload = buildOptimizerOpsResponse({
      experimentId,
      requestId: snapshot.requestId,
      constrained: snapshot.constrained,
      portfolio: snapshot.portfolio,
    });

    res.status(200).json(payload);
  };
}
