import type {
  PortfolioCandidate,
  PortfolioConfig,
  PortfolioSelectedCandidate,
} from './optimizer.portfolio.contract.ts';

export interface PortfolioState {
  selected: PortfolioSelectedCandidate[];
  totalRiskScore: number;
  familyCounts: Map<string, number>;
}

export function createEmptyPortfolioState(): PortfolioState {
  return {
    selected: [],
    totalRiskScore: 0,
    familyCounts: new Map<string, number>(),
  };
}

export function getCandidateRiskScore(candidate: PortfolioCandidate): number {
  return candidate.riskScore ?? 0;
}

export function canAddCandidateToPortfolio(params: {
  candidate: PortfolioCandidate;
  state: PortfolioState;
  config: PortfolioConfig;
}):
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | 'blocked_not_allowed'
        | 'blocked_portfolio_full'
        | 'blocked_family_cap'
        | 'blocked_total_risk';
      detail: string;
    } {
  const { candidate, state, config } = params;

  if (!candidate.allowed) {
    return {
      allowed: false,
      reason: 'blocked_not_allowed',
      detail: `Candidate blocked by prior policy: ${candidate.blockedReasons.join(', ')}`,
    };
  }

  if (state.selected.length >= config.maxPortfolioSize) {
    return {
      allowed: false,
      reason: 'blocked_portfolio_full',
      detail: `Portfolio already reached max size ${config.maxPortfolioSize}.`,
    };
  }

  const familyCount = state.familyCounts.get(candidate.recommendationFamily) ?? 0;

  if (familyCount >= config.maxPerFamily) {
    return {
      allowed: false,
      reason: 'blocked_family_cap',
      detail: `Family ${candidate.recommendationFamily} already has ${familyCount} item(s).`,
    };
  }

  const nextRisk = state.totalRiskScore + getCandidateRiskScore(candidate);

  if (nextRisk > config.maxTotalRiskScore) {
    return {
      allowed: false,
      reason: 'blocked_total_risk',
      detail: `Adding candidate would raise total risk to ${nextRisk}, above limit ${config.maxTotalRiskScore}.`,
    };
  }

  return { allowed: true };
}

export function applyCandidateToPortfolioState(
  state: PortfolioState,
  candidate: PortfolioSelectedCandidate
): PortfolioState {
  const nextFamilyCounts = new Map(state.familyCounts);
  const nextCount =
    (nextFamilyCounts.get(candidate.recommendationFamily) ?? 0) + 1;

  nextFamilyCounts.set(candidate.recommendationFamily, nextCount);

  return {
    selected: [...state.selected, candidate],
    totalRiskScore: candidate.portfolio.cumulativeRiskScore,
    familyCounts: nextFamilyCounts,
  };
}
