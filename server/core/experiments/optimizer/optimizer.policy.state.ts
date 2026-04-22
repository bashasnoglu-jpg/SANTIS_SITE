import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';

export interface OptimizerPolicyStateStore {
  getPolicy(experimentId: string): Promise<OptimizerRuntimePolicy | null>;
  setPolicy(policy: OptimizerRuntimePolicy): Promise<void>;
  clearExpiredPolicies(now?: string): Promise<void>;
}

export class InMemoryOptimizerPolicyStateStore
  implements OptimizerPolicyStateStore
{
  private readonly policies = new Map<string, OptimizerRuntimePolicy>();

  async getPolicy(experimentId: string): Promise<OptimizerRuntimePolicy | null> {
    const policy = this.policies.get(experimentId) ?? null;

    if (!policy) {
      return null;
    }

    if (policy.expiresAt && new Date(policy.expiresAt).getTime() <= Date.now()) {
      this.policies.delete(experimentId);
      return null;
    }

    return policy;
  }

  async setPolicy(policy: OptimizerRuntimePolicy): Promise<void> {
    this.policies.set(policy.experimentId, policy);
  }

  async clearExpiredPolicies(now = new Date().toISOString()): Promise<void> {
    const nowTs = new Date(now).getTime();

    for (const [experimentId, policy] of this.policies.entries()) {
      if (policy.expiresAt && new Date(policy.expiresAt).getTime() <= nowTs) {
        this.policies.delete(experimentId);
      }
    }
  }
}
