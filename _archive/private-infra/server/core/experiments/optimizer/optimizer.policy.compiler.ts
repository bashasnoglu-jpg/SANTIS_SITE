import { randomUUID } from 'node:crypto';
import type { OptimizerPolicyApprovalStore } from './optimizer.policy.approval.memory.ts';
import type { OptimizerCompiledProposal, OptimizerPolicyCompilerInput } from './optimizer.policy.compiler.contract.ts';

export class OptimizerPolicyCompiler {
  constructor(private readonly approvalStore: OptimizerPolicyApprovalStore) {}

  async compileToProposal(
    input: OptimizerPolicyCompilerInput
  ): Promise<OptimizerCompiledProposal> {
    const proposalId = randomUUID();
    const title = `[Optimizer Policy] ${input.recommendationTitle}`;
    
    const proposal = {
      proposalId,
      experimentId: input.experimentId,
      basePolicy: input.baselinePolicy,
      proposedPolicy: input.proposedPolicy,
      anomalies: [],
      changedFields: input.changedFields,
      requiresApproval: true,
      status: 'pending' as const,
      payload: {
        patch: input.patch,
        scope: { type: 'global' },
      },
      createdAt: new Date().toISOString(),
      decidedAt: null,
      decidedBy: null,
      rejectionReason: null,
    };

    await this.approvalStore.create(proposal);

    return {
      proposalId,
      status: proposal.status,
      title,
      summary: input.recommendationSummary,
      patch: input.patch,
      createdAt: proposal.createdAt,
    };
  }
}
