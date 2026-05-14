import type {
  PortfolioCandidate,
  PortfolioConfig,
} from './optimizer.portfolio.contract.ts';
import type { PortfolioState } from './optimizer.portfolio.constraints.ts';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeDiversityPenalty(params: {
  candidate: PortfolioCandidate;
  state: PortfolioState;
  config: PortfolioConfig;
}): number {
  const familyCount =
    params.state.familyCounts.get(params.candidate.recommendationFamily) ?? 0;

  if (familyCount <= 0) {
    return 0;
  }

  return familyCount * params.config.diversityPenaltyPerExtraFamilyMember;
}

export function computeRiskPenalty(
  candidate: PortfolioCandidate
): number {
  const risk = candidate.riskScore ?? 0;
  return clamp(risk * 0.35, 0, 100);
}

export function computeMarginalGain(params: {
  candidate: PortfolioCandidate;
  state: PortfolioState;
  config: PortfolioConfig;
}): number {
  const blockedPenalty = params.candidate.allowed
    ? 0
    : params.config.blockedCandidatePenalty;

  const diversityPenalty = computeDiversityPenalty(params);
  const riskPenalty = computeRiskPenalty(params.candidate);

  return (
    params.candidate.finalBanditScore -
    diversityPenalty -
    riskPenalty -
    blockedPenalty
  );
}
