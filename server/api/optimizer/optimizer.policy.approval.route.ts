import type { Request, Response } from 'express';
import type { OptimizerPolicyEngineV33 } from '../../core/experiments/optimizer/optimizer.policy.engine.v33.ts';
import type { OptimizerPolicyApprovalStore } from '../../core/experiments/optimizer/optimizer.policy.approval.memory.ts';

interface CreateOptimizerPolicyApprovalRouteDeps {
  policyEngine: OptimizerPolicyEngineV33;
  approvalStore: OptimizerPolicyApprovalStore;
}

export function createOptimizerPolicyApprovalRoute(
  deps: CreateOptimizerPolicyApprovalRouteDeps
) {
  return {
    listPending: async (req: Request, res: Response): Promise<void> => {
      const experimentId = String(req.query.experimentId ?? '').trim() || undefined;
      const items = await deps.approvalStore.getPending(experimentId);
      res.status(200).json({ items });
    },

    approve: async (req: Request, res: Response): Promise<void> => {
      const proposalId = String(req.body?.proposalId ?? '').trim();
      const actor = String(req.body?.actor ?? 'unknown').trim();

      if (!proposalId) {
        res.status(400).json({ error: 'proposalId is required' });
        return;
      }

      const proposal = await deps.policyEngine.approveProposal({
        proposalId,
        actor,
      });

      res.status(200).json({ proposal });
    },

    reject: async (req: Request, res: Response): Promise<void> => {
      const proposalId = String(req.body?.proposalId ?? '').trim();
      const actor = String(req.body?.actor ?? 'unknown').trim();
      const reason = String(req.body?.reason ?? '').trim();

      if (!proposalId || !reason) {
        res.status(400).json({ error: 'proposalId and reason are required' });
        return;
      }

      const proposal = await deps.policyEngine.rejectProposal({
        proposalId,
        actor,
        reason,
      });

      res.status(200).json({ proposal });
    },
  };
}
