import type { PolicyRecommenderResponse } from './optimizer.policy.recommender.contract.ts';

export interface OptimizerPolicyRecommenderStore {
  save(response: PolicyRecommenderResponse): Promise<void>;
  getLatest(experimentId: string): Promise<PolicyRecommenderResponse | null>;
}

export class InMemoryOptimizerPolicyRecommenderStore implements OptimizerPolicyRecommenderStore {
  private data = new Map<string, PolicyRecommenderResponse>();
  
  async save(response: PolicyRecommenderResponse): Promise<void> {
    this.data.set(response.experimentId, response);
  }
  
  async getLatest(experimentId: string): Promise<PolicyRecommenderResponse | null> {
    return this.data.get(experimentId) ?? null;
  }
}
