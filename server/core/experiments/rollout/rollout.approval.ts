export interface ApprovalRecord {
  rolloutId: string;
  requestedStage: 100;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
}

export class InMemoryRolloutApprovalStore {
  private readonly approvals = new Map<string, ApprovalRecord>();

  async requestApproval(input: {
    rolloutId: string;
    requestedStage: 100;
  }): Promise<void> {
    const current = this.approvals.get(input.rolloutId);

    if (current && current.requestedStage === input.requestedStage) {
      return;
    }

    this.approvals.set(input.rolloutId, {
      rolloutId: input.rolloutId,
      requestedStage: input.requestedStage,
      approved: false,
    });
  }

  async approve(input: {
    rolloutId: string;
    approvedAt: string;
    approvedBy: string;
  }): Promise<void> {
    const current = this.approvals.get(input.rolloutId) ?? {
      rolloutId: input.rolloutId,
      requestedStage: 100 as const,
      approved: false,
    };

    this.approvals.set(input.rolloutId, {
      ...current,
      approved: true,
      approvedAt: input.approvedAt,
      approvedBy: input.approvedBy,
    });
  }

  async hasApproval(rolloutId: string, requestedStage: 100): Promise<boolean> {
    const record = this.approvals.get(rolloutId);
    if (!record) return false;
    return record.requestedStage === requestedStage && record.approved === true;
  }
}
