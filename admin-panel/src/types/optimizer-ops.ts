export interface OptimizerOpsBlockedCandidate {
  recommendationId: string;
  variantId: string;
  recommendationFamily: string;
  finalBanditScore: number;
  blockedReasons: string[];
}

export interface OptimizerOpsSelectedSlateItem {
  recommendationId: string;
  variantId: string;
  recommendationFamily: string;
  finalBanditScore: number;
  marginalGain: number;
  cumulativeRiskScore: number;
}

export interface OptimizerOpsTelemetrySummary {
  totalCandidates: number;
  allowedCandidates: number;
  blockedCandidates: number;
  explorationRate: number;
  blockedReasonCounts: Record<string, number>;
  familyExposureCounts: Record<string, number>;
}

export interface OptimizerOpsPortfolioSummary {
  selectedCount: number;
  totalRiskScore: number;
  totalPortfolioScore: number;
  familyCounts: Record<string, number>;
}

export interface OptimizerOpsResponse {
  generatedAt: string;
  experimentId: string;
  requestId: string;
  telemetry: OptimizerOpsTelemetrySummary;
  portfolio: {
    selected: OptimizerOpsSelectedSlateItem[];
    summary: OptimizerOpsPortfolioSummary;
  };
  blockedCandidates: OptimizerOpsBlockedCandidate[];
}
