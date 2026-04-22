import {
  OptimizerPolicyRolloutRecord,
} from './optimizer.policy.rollout.contract.ts';

export interface OptimizerPolicyRolloutStore {
  create(record: OptimizerPolicyRolloutRecord): Promise<void>;
  update(record: OptimizerPolicyRolloutRecord): Promise<void>;
  getById(rolloutId: string): Promise<OptimizerPolicyRolloutRecord | null>;
  listRunning(): Promise<OptimizerPolicyRolloutRecord[]>;
}

export class InMemoryOptimizerPolicyRolloutStore
  implements OptimizerPolicyRolloutStore
{
  private readonly records = new Map<string, OptimizerPolicyRolloutRecord>();

  async create(record: OptimizerPolicyRolloutRecord): Promise<void> {
    this.records.set(record.rolloutId, record);
  }

  async update(record: OptimizerPolicyRolloutRecord): Promise<void> {
    this.records.set(record.rolloutId, record);
  }

  async getById(rolloutId: string): Promise<OptimizerPolicyRolloutRecord | null> {
    return this.records.get(rolloutId) ?? null;
  }

  async listRunning(): Promise<OptimizerPolicyRolloutRecord[]> {
    return [...this.records.values()].filter(
      (item) => item.status === 'running',
    );
  }
}
