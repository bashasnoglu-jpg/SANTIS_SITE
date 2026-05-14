import type { ConstraintAwareBanditOutput } from './optimizer.bandit.constraint-aware.adapter.ts';
import type { PortfolioOutput } from './optimizer.portfolio.contract.ts';
import type {
  OptimizerOpsBlockedCandidate,
  OptimizerOpsResponse,
} from './optimizer.ops.contract.ts';

export function buildOptimizerOpsResponse(params: {
  experimentId: string;
  requestId: string;
  constrained: ConstraintAwareBanditOutput;
  portfolio: PortfolioOutput;
}): OptimizerOpsResponse {
  const blockedCandidates: OptimizerOpsBlockedCandidate[] = params.constrained.ranked
    .filter((candidate) => !candidate.constraints.allowed)
    .map((candidate) => ({
      recommendationId: candidate.recommendationId,
      variantId: candidate.variantId,
      recommendationFamily: candidate.recommendationFamily,
      finalBanditScore: candidate.finalBanditScore,
      blockedReasons: candidate.constraints.blockedReasons,
    }));

  return {
    generatedAt: new Date().toISOString(),
    experimentId: params.experimentId,
    requestId: params.requestId,
    telemetry: params.constrained.telemetry.summary,
    portfolio: {
      selected: params.portfolio.selected.map((item) => ({
        recommendationId: item.recommendationId,
        variantId: item.variantId,
        recommendationFamily: item.recommendationFamily,
        finalBanditScore: item.finalBanditScore,
        marginalGain: item.portfolio.marginalGain,
        cumulativeRiskScore: item.portfolio.cumulativeRiskScore,
      })),
      summary: params.portfolio.summary,
    },
    blockedCandidates,
  };
}
