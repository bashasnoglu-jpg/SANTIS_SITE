export interface PolicyBacktestReplayResult {
  snapshotSavedAt: string;
  deltas: {
    totalRiskDelta: number;
    totalPortfolioScoreDelta: number;
    selectedChanged: boolean;
  };
}

export interface PolicyBacktestSummary {
  totalSnapshots: number;
  improvedScoreSnapshots: number;
  worsenedScoreSnapshots: number;
  unchangedScoreSnapshots: number;
  reducedRiskSnapshots: number;
  increasedRiskSnapshots: number;
  averageRiskDelta: number;
  averagePortfolioScoreDelta: number;
  mostFrequentlyAddedSelectedVariantIds: string[];
  mostFrequentlyRemovedSelectedVariantIds: string[];
}

export interface PolicyBacktestResponse {
  experimentId: string;
  proposalId: string;
  from: string;
  to: string;
  generatedAt: string;
  replays: PolicyBacktestReplayResult[];
  summary: PolicyBacktestSummary;
}
