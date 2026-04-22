import type { OptimizerAnomaly } from './optimizer.ops.anomaly.contract.ts';
import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';

export type PolicyApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'auto_applied';

export interface OptimizerPolicyProposal {
  proposalId: string;
  experimentId: string;

  basePolicy: OptimizerRuntimePolicy;
  proposedPolicy: OptimizerRuntimePolicy;

  anomalies: OptimizerAnomaly[];
  changedFields: string[];

  requiresApproval: boolean;
  status: PolicyApprovalStatus;

  payload: {
    patch: any;
    scope?: any;
  };

  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectionReason: string | null;
}
