import type { OptimizerAnomaly } from './optimizer.ops.anomaly.contract.ts';
import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';

export interface ApprovalDecision {
  requiresApproval: boolean;
  reasons: string[];
}

export function evaluatePolicyApprovalRequirement(params: {
  anomalies: OptimizerAnomaly[];
  basePolicy: OptimizerRuntimePolicy;
  proposedPolicy: OptimizerRuntimePolicy;
  changedFields: string[];
}): ApprovalDecision {
  const reasons: string[] = [];

  const hasHighSeverity = params.anomalies.some(
    (anomaly) => anomaly.severity === 'high'
  );

  if (hasHighSeverity) {
    reasons.push('high_severity_anomaly');
  }

  const riskTighteningDelta =
    params.basePolicy.maxRiskScoreAllowed -
    params.proposedPolicy.maxRiskScoreAllowed;

  if (riskTighteningDelta >= 8) {
    reasons.push('large_risk_policy_shift');
  }

  const explorationDelta =
    params.basePolicy.maxExplorationBonus -
    params.proposedPolicy.maxExplorationBonus;

  if (explorationDelta >= 0.08) {
    reasons.push('large_exploration_shift');
  }

  const portfolioDelta =
    Math.abs(
      params.basePolicy.maxPortfolioSize - params.proposedPolicy.maxPortfolioSize
    );

  if (portfolioDelta >= 2) {
    reasons.push('large_portfolio_shift');
  }

  return {
    requiresApproval: reasons.length > 0,
    reasons,
  };
}
