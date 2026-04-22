type ApprovalMemoryRecord = {
  id: string; // mapped from proposalId
  tenantId: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_applied';
  title: string;
  summary: string;
  payload: {
    patch: {
      ops: Array<{
        op: 'set';
        path: string;
        value: unknown;
        previousValue?: unknown;
        reason?: string;
      }>;
    };
    scope?: {
      type: 'global' | 'segment' | 'canary';
      segmentId?: string;
      rolloutPercentage?: number;
    };
  };
};

export interface ApprovalMemorySource {
  getById(proposalId: string): Promise<any | null>;
}

export class OptimizerPolicyApprovalRepositoryAdapter {
  constructor(private readonly source: ApprovalMemorySource) {}

  async getById(proposalId: string): Promise<ApprovalMemoryRecord | null> {
    const record = await this.source.getById(proposalId);
    if (!record) return null;

    return {
      id: record.proposalId,
      tenantId: 'santis-tenant-1', // Defaulting since original schema didn't have tenantId at root
      status: record.status,
      title: record.title || `Proposal ${record.proposalId}`,
      summary: record.summary || '',
      payload: record.payload || {
        patch: { ops: [] },
        scope: { type: 'global' }
      }
    };
  }
}
