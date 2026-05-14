import type { PolicyBacktestResponse } from './optimizer.policy.backtest.contract.ts';
import type { PolicyRecommendationScore } from './optimizer.policy.recommender.contract.ts';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scorePolicyBacktest(
  backtest: PolicyBacktestResponse
): PolicyRecommendationScore {
  const summary = backtest.summary;
  const totalSnapshots = Math.max(1, summary.totalSnapshots);

  const scoreLift = summary.averagePortfolioScoreDelta;
  const riskLift = -summary.averageRiskDelta;

  const improvedRatio = summary.improvedScoreSnapshots / totalSnapshots;
  const reducedRiskRatio = summary.reducedRiskSnapshots / totalSnapshots;
  const worsenedRatio = summary.worsenedScoreSnapshots / totalSnapshots;
  const increasedRiskRatio = summary.increasedRiskSnapshots / totalSnapshots;

  const stabilityScore = clamp(
    1 - (worsenedRatio * 0.6 + increasedRiskRatio * 0.6),
    0,
    1
  );

  const overallScore =
    scoreLift * 0.45 +
    riskLift * 0.35 +
    improvedRatio * 10 +
    reducedRiskRatio * 8 +
    stabilityScore * 6;

  return {
    averagePortfolioScoreDelta: summary.averagePortfolioScoreDelta,
    averageRiskDelta: summary.averageRiskDelta,
    improvedScoreSnapshots: summary.improvedScoreSnapshots,
    reducedRiskSnapshots: summary.reducedRiskSnapshots,
    stabilityScore,
    overallScore,
  };
}
