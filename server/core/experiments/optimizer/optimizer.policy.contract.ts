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

export interface OptimizerDefaultPolicyInput {
  experimentId: string;
}

export function buildDefaultRuntimePolicy(
  input: OptimizerDefaultPolicyInput
): OptimizerRuntimePolicy {
  return {
    experimentId: input.experimentId,

    maxRiskScoreAllowed: 30,
    maxTrafficSharePerVariant: 0.25,
    maxWinnersPerFamily: 1,
    minGuardrailScoreRequired: 0.8,

    minLearnedWeightForExploration: 0.55,
    maxExplorationBonus: 0.2,

    maxPortfolioSize: 3,
    maxTotalRiskScore: 45,

    source: 'default',
    reason: null,
    activatedAt: new Date().toISOString(),
    expiresAt: null,
  };
}
