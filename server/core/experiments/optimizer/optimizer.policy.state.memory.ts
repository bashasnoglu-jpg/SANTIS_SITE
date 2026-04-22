export type OptimizerPolicyDocument = {
  tenantId: string;
  policy: Record<string, unknown>;
  updatedAt: string;
};

export interface OptimizerPolicyStateRepository {
  getPolicy(tenantId: string): Promise<OptimizerPolicyDocument>;
  savePolicy(input: OptimizerPolicyDocument): Promise<void>;
}

export class InMemoryOptimizerPolicyStateRepository
  implements OptimizerPolicyStateRepository
{
  private readonly docs = new Map<string, OptimizerPolicyDocument>();

  async getPolicy(tenantId: string): Promise<OptimizerPolicyDocument> {
    const existing = this.docs.get(tenantId);
    if (existing) return existing;

    const seed: OptimizerPolicyDocument = {
      tenantId,
      policy: {},
      updatedAt: new Date().toISOString(),
    };
    this.docs.set(tenantId, seed);
    return seed;
  }

  async savePolicy(input: OptimizerPolicyDocument): Promise<void> {
    this.docs.set(input.tenantId, input);
  }
}
