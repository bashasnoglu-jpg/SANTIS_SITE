export type PolicyApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'auto_applied';

export interface OptimizerPolicyProposal {
  proposalId: string;
  experimentId: string;
  changedFields: string[];
  requiresApproval: boolean;
  status: PolicyApprovalStatus;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectionReason: string | null;
}
