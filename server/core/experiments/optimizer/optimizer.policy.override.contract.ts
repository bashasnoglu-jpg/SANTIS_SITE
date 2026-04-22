import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';

export interface PolicyApprovalActionInput {
  proposalId: string;
  actor: string;
}

export interface PolicyRejectActionInput extends PolicyApprovalActionInput {
  reason: string;
}

export interface PolicyForceOverrideInput {
  experimentId: string;
  actor: string;
  policy: OptimizerRuntimePolicy;
  reason: string;
}
