import type { OptimizerAnomaly } from './optimizer.ops.anomaly.contract.ts';
import {
  buildDefaultRuntimePolicy,
  type OptimizerRuntimePolicy,
} from './optimizer.policy.contract.ts';
import type { OptimizerPolicyStateStore } from './optimizer.policy.state.ts';
import { applyAnomalyMitigations } from './optimizer.policy.mitigation.ts';
import type { OptimizerPolicyAuditStore } from './optimizer.policy.audit.memory.ts';

export interface PolicyEngineEvaluationResult {
  policy: OptimizerRuntimePolicy;
  changedFields: string[];
  applied: boolean;
}

export class OptimizerPolicyEngine {
  constructor(
    private readonly stateStore: OptimizerPolicyStateStore,
    private readonly auditStore: OptimizerPolicyAuditStore
  ) {}

  async resolvePolicy(experimentId: string): Promise<OptimizerRuntimePolicy> {
    await this.stateStore.clearExpiredPolicies();

    const existing = await this.stateStore.getPolicy(experimentId);
    if (existing) {
      return existing;
    }

    return buildDefaultRuntimePolicy({ experimentId });
  }

  async evaluateAndMitigate(params: {
    experimentId: string;
    anomalies: OptimizerAnomaly[];
  }): Promise<PolicyEngineEvaluationResult> {
    const basePolicy = await this.resolvePolicy(params.experimentId);

    if (params.anomalies.length === 0) {
      return {
        policy: basePolicy,
        changedFields: [],
        applied: false,
      };
    }

    const mitigation = applyAnomalyMitigations({
      basePolicy,
      anomalies: params.anomalies,
    });

    await this.stateStore.setPolicy(mitigation.nextPolicy);

    await this.auditStore.append({
      experimentId: params.experimentId,
      anomalies: params.anomalies,
      changedFields: mitigation.changedFields,
      policy: mitigation.nextPolicy,
      evaluatedAt: new Date().toISOString(),
    });

    return {
      policy: mitigation.nextPolicy,
      changedFields: mitigation.changedFields,
      applied: mitigation.changedFields.length > 0,
    };
  }
}
