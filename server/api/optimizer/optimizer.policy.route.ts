import type { Request, Response } from 'express';
import type { OptimizerPolicyEngineV33 } from '../../core/experiments/optimizer/optimizer.policy.engine.v33.ts';
import type { OptimizerPolicyAuditStore } from '../../core/experiments/optimizer/optimizer.policy.audit.memory.ts';

interface CreateOptimizerPolicyRouteDeps {
  policyEngine: OptimizerPolicyEngineV33;
  auditStore: OptimizerPolicyAuditStore;
}

export function createOptimizerPolicyRoute(
  deps: CreateOptimizerPolicyRouteDeps
) {
  return async function optimizerPolicyRoute(
    req: Request,
    res: Response
  ): Promise<void> {
    const experimentId = String(req.query.experimentId ?? '').trim();

    if (!experimentId) {
      res.status(400).json({ error: 'experimentId is required' });
      return;
    }

    const policy = await deps.policyEngine.resolvePolicy(experimentId);
    const latestAudit = await deps.auditStore.getLatest(experimentId);

    res.status(200).json({
      experimentId,
      policy,
      latestAudit,
      generatedAt: new Date().toISOString(),
    });
  };
}
