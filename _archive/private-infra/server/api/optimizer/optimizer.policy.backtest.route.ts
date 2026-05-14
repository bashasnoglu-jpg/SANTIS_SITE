import type { Request, Response } from 'express';
import type { OptimizerPolicyApprovalStore } from '../../core/experiments/optimizer/optimizer.policy.approval.memory.ts';
import type { OptimizerDecisionSnapshotStore } from '../../core/experiments/optimizer/optimizer.ops.snapshot.store.ts';
import { OptimizerPolicyBacktestEngine } from '../../core/experiments/optimizer/optimizer.policy.backtest.engine.ts';

interface CreateOptimizerPolicyBacktestRouteDeps {
  approvalStore: OptimizerPolicyApprovalStore;
  snapshotStore: OptimizerDecisionSnapshotStore;
  backtestEngine: OptimizerPolicyBacktestEngine;
}

export function createOptimizerPolicyBacktestRoute(
  deps: CreateOptimizerPolicyBacktestRouteDeps
) {
  return async function optimizerPolicyBacktestRoute(
    req: Request,
    res: Response
  ): Promise<void> {
    const proposalId = String(req.query.proposalId ?? '').trim();
    const hours = Number(req.query.hours ?? 24);

    if (!proposalId) {
      res.status(400).json({ error: 'proposalId is required' });
      return;
    }

    const proposal = await deps.approvalStore.getById(proposalId);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    const now = Date.now();
    const from = new Date(now - hours * 60 * 60 * 1000).toISOString();
    const to = new Date(now).toISOString();

    const snapshots = await deps.snapshotStore.getRange({
      experimentId: proposal.experimentId,
      from,
      to,
      limit: 1000,
    });

    const result = deps.backtestEngine.runBacktest({
      proposal,
      snapshots,
      from,
      to,
    });

    res.status(200).json(result);
  };
}
