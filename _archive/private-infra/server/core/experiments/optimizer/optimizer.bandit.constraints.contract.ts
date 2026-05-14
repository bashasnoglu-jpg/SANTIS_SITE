export interface BanditConstraintConfig {
  maxRiskScoreAllowed: number;
  maxTrafficSharePerVariant: number;
  maxWinnersPerFamily: number;
  minGuardrailScoreRequired: number;
}

export const DEFAULT_BANDIT_CONSTRAINT_CONFIG: BanditConstraintConfig = {
  maxRiskScoreAllowed: 30,
  maxTrafficSharePerVariant: 0.25,
  maxWinnersPerFamily: 1,
  minGuardrailScoreRequired: 0.8,
};

export interface BanditCandidateConstraintInput {
  recommendationId: string;
  experimentId: string;
  variantId: string;
  recommendationFamily: string;

  riskScore: number | null;
  projectedTrafficShare: number | null;
  liveGuardrailScore: number | null;
}

export type BanditConstraintBlockReason =
  | 'risk_ceiling_exceeded'
  | 'traffic_cap_exceeded'
  | 'family_fairness_exceeded'
  | 'guardrail_score_too_low';

export interface BanditConstraintDecision {
  allowed: boolean;
  reasons: BanditConstraintBlockReason[];
}
