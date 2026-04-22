import type { OptimizerAnomaly } from './optimizer.ops.anomaly.contract.ts';
import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';

export interface OptimizerPolicyAuditEvent {
  experimentId: string;
  anomalies: OptimizerAnomaly[];
  changedFields: string[];
  policy: OptimizerRuntimePolicy;
  evaluatedAt: string;
}
