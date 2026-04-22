import type {
  OptimizerPolicyProposal,
  PolicyApprovalStatus,
} from './optimizer.policy.approval.contract.ts';

export interface OptimizerPolicyApprovalStore {
  create(proposal: OptimizerPolicyProposal): Promise<void>;
  update(proposal: OptimizerPolicyProposal): Promise<void>;
  getById(proposalId: string): Promise<OptimizerPolicyProposal | null>;
  getPending(experimentId?: string): Promise<OptimizerPolicyProposal[]>;
}

export class InMemoryOptimizerPolicyApprovalStore
  implements OptimizerPolicyApprovalStore
{
  private readonly proposals = new Map<string, OptimizerPolicyProposal>();

  async create(proposal: OptimizerPolicyProposal): Promise<void> {
    this.proposals.set(proposal.proposalId, proposal);
  }

  async update(proposal: OptimizerPolicyProposal): Promise<void> {
    this.proposals.set(proposal.proposalId, proposal);
  }

  async getById(proposalId: string): Promise<OptimizerPolicyProposal | null> {
    return this.proposals.get(proposalId) ?? null;
  }

  async getPending(experimentId?: string): Promise<OptimizerPolicyProposal[]> {
    const items = [...this.proposals.values()].filter((proposal) => {
      if (proposal.status !== 'pending') {
        return false;
      }

      if (experimentId && proposal.experimentId !== experimentId) {
        return false;
      }

      return true;
    });

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return items;
  }
}
