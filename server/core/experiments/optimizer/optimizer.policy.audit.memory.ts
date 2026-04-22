import type { OptimizerPolicyAuditEvent } from './optimizer.policy.audit.contract.ts';

export interface OptimizerPolicyAuditStore {
  append(event: OptimizerPolicyAuditEvent): Promise<void>;
  getLatest(experimentId: string): Promise<OptimizerPolicyAuditEvent | null>;
}

export class InMemoryOptimizerPolicyAuditStore
  implements OptimizerPolicyAuditStore
{
  private readonly events: OptimizerPolicyAuditEvent[] = [];

  async append(event: OptimizerPolicyAuditEvent): Promise<void> {
    this.events.push(event);

    if (this.events.length > 500) {
      this.events.splice(0, this.events.length - 500);
    }
  }

  async getLatest(experimentId: string): Promise<OptimizerPolicyAuditEvent | null> {
    const filtered = this.events.filter((item) => item.experimentId === experimentId);

    if (filtered.length === 0) {
      return null;
    }

    filtered.sort(
      (a, b) =>
        new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
    );

    return filtered[0] ?? null;
  }
}
