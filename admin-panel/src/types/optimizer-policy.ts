export interface OptimizerRuntimePolicy {
  experimentId: string;
  maxRiskScoreAllowed: number;
  maxTrafficSharePerVariant: number;
  maxWinnersPerFamily: number;
  minGuardrailScoreRequired: number;
  minLearnedWeightForExploration: number;
  maxExplorationBonus: number;
  maxPortfolioSize: number;
  maxTotalRiskScore: number;
  source: 'default' | 'auto_mitigated';
  reason: string | null;
  activatedAt: string;
  expiresAt: string | null;
}

export interface OptimizerPolicyAuditEvent {
  experimentId: string;
  changedFields: string[];
  evaluatedAt: string;
}

export interface OptimizerPolicyResponse {
  experimentId: string;
  policy: OptimizerRuntimePolicy;
  latestAudit: OptimizerPolicyAuditEvent | null;
  generatedAt: string;
}
