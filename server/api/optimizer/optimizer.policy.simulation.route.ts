import type { Request, Response } from 'express';
import type { OptimizerPolicyApprovalStore } from '../../core/experiments/optimizer/optimizer.policy.approval.memory.ts';
import type { OptimizerDecisionSnapshotStore } from '../../core/experiments/optimizer/optimizer.ops.snapshot.store.ts';
import { OptimizerPolicySimulationEngine } from '../../core/experiments/optimizer/optimizer.policy.simulation.engine.ts';

interface CreateOptimizerPolicySimulationRouteDeps {
  approvalStore: OptimizerPolicyApprovalStore;
  snapshotStore: OptimizerDecisionSnapshotStore;
  simulationEngine: OptimizerPolicySimulationEngine;
}

export function createOptimizerPolicySimulationRoute(
  deps: CreateOptimizerPolicySimulationRouteDeps
) {
  return async function optimizerPolicySimulationRoute(
    req: Request,
    res: Response
  ): Promise<void> {
    const proposalId = String(req.query.proposalId ?? '').trim();

    if (!proposalId) {
      res.status(400).json({ error: 'proposalId is required' });
      return;
    }

    const proposal = await deps.approvalStore.getById(proposalId);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    const snapshot = await deps.snapshotStore.getLatest({
      experimentId: proposal.experimentId,
    });

    if (!snapshot) {
      res.status(404).json({ error: 'No optimizer snapshot found for proposal experiment' });
      return;
    }

    const candidates = snapshot.constrained.ranked.map((candidate) => ({
      recommendationId: candidate.recommendationId,
      variantId: candidate.variantId,
      recommendationFamily: candidate.recommendationFamily,
      finalBanditScore: candidate.finalBanditScore,
      riskScore: candidate.constraintSignals?.riskScore ?? null,
      projectedTrafficShare:
        candidate.constraintSignals?.projectedTrafficShare ?? null,
      liveGuardrailScore:
        candidate.constraintSignals?.liveGuardrailScore ?? null,
      currentlyAllowed: candidate.constraints.allowed,
      currentBlockedReasons: candidate.constraints.blockedReasons,
    }));

    const result = deps.simulationEngine.simulateProposal({
      proposal,
      snapshot: {
        experimentId: proposal.experimentId,
        candidates,
      },
    });

    res.status(200).json(result);
  };
}
