import type { OptimizerDecisionSnapshot } from './optimizer.ops.snapshot.store.ts';
import type {
  OptimizerOpsBlockedReasonTrendPoint,
  OptimizerOpsTrendPoint,
  OptimizerOpsTrendsResponse,
} from './optimizer.ops.trends.contract.ts';

export function buildOptimizerOpsTrendsResponse(params: {
  experimentId: string;
  from: string;
  to: string;
  snapshots: OptimizerDecisionSnapshot[];
}): OptimizerOpsTrendsResponse {
  const points: OptimizerOpsTrendPoint[] = params.snapshots.map((snapshot) => ({
    timestamp: snapshot.savedAt,
    totalCandidates: snapshot.constrained.telemetry.summary.totalCandidates,
    allowedCandidates: snapshot.constrained.telemetry.summary.allowedCandidates,
    blockedCandidates: snapshot.constrained.telemetry.summary.blockedCandidates,
    explorationRate: snapshot.constrained.telemetry.summary.explorationRate,
    totalPortfolioScore: snapshot.portfolio.summary.totalPortfolioScore,
    totalPortfolioRisk: snapshot.portfolio.summary.totalRiskScore,
    selectedCount: snapshot.portfolio.summary.selectedCount,
  }));

  const blockedReasonPoints: OptimizerOpsBlockedReasonTrendPoint[] =
    params.snapshots.map((snapshot) => ({
      timestamp: snapshot.savedAt,
      blockedReasonCounts:
        snapshot.constrained.telemetry.summary.blockedReasonCounts,
    }));

  return {
    experimentId: params.experimentId,
    from: params.from,
    to: params.to,
    generatedAt: new Date().toISOString(),
    points,
    blockedReasonPoints,
  };
}
