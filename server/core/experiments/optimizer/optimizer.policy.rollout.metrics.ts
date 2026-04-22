import {
  OptimizerRolloutMetricsSnapshot,
  OptimizerRolloutScope,
} from './optimizer.policy.rollout.contract.ts';

export interface OptimizerPolicyRolloutMetricsProvider {
  getSnapshot(input: {
    tenantId: string;
    scope: OptimizerRolloutScope;
    since: string;
    until: string;
  }): Promise<OptimizerRolloutMetricsSnapshot>;
}

export class NoopOptimizerPolicyRolloutMetricsProvider
  implements OptimizerPolicyRolloutMetricsProvider
{
  async getSnapshot(): Promise<OptimizerRolloutMetricsSnapshot> {
    return {
      timestamp: new Date().toISOString(),
      sampleSize: 0,
      scoreDelta: 0,
      riskDelta: 0,
      stabilityDelta: 0,
    };
  }
}
