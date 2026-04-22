export interface OptimizerOpsTrendPoint {
  timestamp: string;
  totalCandidates: number;
  allowedCandidates: number;
  blockedCandidates: number;
  explorationRate: number;
  totalPortfolioScore: number;
  totalPortfolioRisk: number;
  selectedCount: number;
}

export interface OptimizerOpsBlockedReasonTrendPoint {
  timestamp: string;
  blockedReasonCounts: Record<string, number>;
}

export interface OptimizerOpsTrendsResponse {
  experimentId: string;
  from: string;
  to: string;
  generatedAt: string;
  points: OptimizerOpsTrendPoint[];
  blockedReasonPoints: OptimizerOpsBlockedReasonTrendPoint[];
}
