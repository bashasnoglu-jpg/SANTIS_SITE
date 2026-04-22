export interface PortfolioCandidate {
  recommendationId: string;
  experimentId: string;
  variantId: string;
  title: string;
  summary: string;
  recommendationFamily: string;

  finalBanditScore: number;
  riskScore: number | null;
  allowed: boolean;
  blockedReasons: string[];

  exploitationScore: number;
  explorationScore: number;
  posteriorScore: number;
}

export interface PortfolioConfig {
  maxPortfolioSize: number;
  maxTotalRiskScore: number;
  maxPerFamily: number;
  diversityPenaltyPerExtraFamilyMember: number;
  blockedCandidatePenalty: number;
}

export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
  maxPortfolioSize: 3,
  maxTotalRiskScore: 60,
  maxPerFamily: 1,
  diversityPenaltyPerExtraFamilyMember: 12,
  blockedCandidatePenalty: 1000,
};

export interface PortfolioSelectionReason {
  type:
    | 'selected'
    | 'blocked_not_allowed'
    | 'blocked_portfolio_full'
    | 'blocked_family_cap'
    | 'blocked_total_risk'
    | 'dominated_by_higher_marginal_gain';
  detail: string;
}

export interface PortfolioSelectedCandidate extends PortfolioCandidate {
  portfolio: {
    selected: boolean;
    marginalGain: number;
    cumulativeRiskScore: number;
    selectionReason: PortfolioSelectionReason;
  };
}

export interface PortfolioOutput {
  selected: PortfolioSelectedCandidate[];
  ranked: PortfolioSelectedCandidate[];
  summary: {
    selectedCount: number;
    totalRiskScore: number;
    totalPortfolioScore: number;
    familyCounts: Record<string, number>;
  };
}
