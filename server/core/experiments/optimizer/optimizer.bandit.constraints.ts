import type {
  BanditCandidateConstraintInput,
  BanditConstraintBlockReason,
  BanditConstraintConfig,
  BanditConstraintDecision,
} from './optimizer.bandit.constraints.contract.ts';

function exceedsTrafficCap(
  projectedTrafficShare: number | null,
  maxTrafficSharePerVariant: number
): boolean {
  return projectedTrafficShare !== null &&
    projectedTrafficShare > maxTrafficSharePerVariant;
}

function exceedsRiskCeiling(
  riskScore: number | null,
  maxRiskScoreAllowed: number
): boolean {
  return riskScore !== null && riskScore > maxRiskScoreAllowed;
}

function violatesGuardrail(
  liveGuardrailScore: number | null,
  minGuardrailScoreRequired: number
): boolean {
  return liveGuardrailScore !== null &&
    liveGuardrailScore < minGuardrailScoreRequired;
}

export function evaluateBanditCandidateConstraints(
  input: BanditCandidateConstraintInput,
  config: BanditConstraintConfig
): BanditConstraintDecision {
  const reasons: BanditConstraintBlockReason[] = [];

  if (exceedsRiskCeiling(input.riskScore, config.maxRiskScoreAllowed)) {
    reasons.push('risk_ceiling_exceeded');
  }

  if (
    exceedsTrafficCap(
      input.projectedTrafficShare,
      config.maxTrafficSharePerVariant
    )
  ) {
    reasons.push('traffic_cap_exceeded');
  }

  if (
    violatesGuardrail(
      input.liveGuardrailScore,
      config.minGuardrailScoreRequired
    )
  ) {
    reasons.push('guardrail_score_too_low');
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}
