import type {
  PolicyBacktestReplayResult,
  PolicyBacktestSummary,
} from './optimizer.policy.backtest.contract.ts';

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topKeysByCount(counter: Record<string, number>, limit = 5): string[] {
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

export function buildPolicyBacktestSummary(
  replays: PolicyBacktestReplayResult[]
): PolicyBacktestSummary {
  const addedCounts: Record<string, number> = {};
  const removedCounts: Record<string, number> = {};

  let improvedScoreSnapshots = 0;
  let worsenedScoreSnapshots = 0;
  let unchangedScoreSnapshots = 0;
  let reducedRiskSnapshots = 0;
  let increasedRiskSnapshots = 0;

  for (const replay of replays) {
    const scoreDelta = replay.deltas.totalPortfolioScoreDelta;
    const riskDelta = replay.deltas.totalRiskDelta;

    if (scoreDelta > 0) improvedScoreSnapshots += 1;
    else if (scoreDelta < 0) worsenedScoreSnapshots += 1;
    else unchangedScoreSnapshots += 1;

    if (riskDelta < 0) reducedRiskSnapshots += 1;
    else if (riskDelta > 0) increasedRiskSnapshots += 1;

    const baselineSelected = new Set(replay.baseline.selectedVariantIds);
    const simulatedSelected = new Set(replay.simulated.selectedVariantIds);

    for (const variantId of replay.simulated.selectedVariantIds) {
      if (!baselineSelected.has(variantId)) {
        addedCounts[variantId] = (addedCounts[variantId] ?? 0) + 1;
      }
    }

    for (const variantId of replay.baseline.selectedVariantIds) {
      if (!simulatedSelected.has(variantId)) {
        removedCounts[variantId] = (removedCounts[variantId] ?? 0) + 1;
      }
    }
  }

  return {
    totalSnapshots: replays.length,
    improvedScoreSnapshots,
    worsenedScoreSnapshots,
    unchangedScoreSnapshots,
    reducedRiskSnapshots,
    increasedRiskSnapshots,
    averageRiskDelta: average(replays.map((item) => item.deltas.totalRiskDelta)),
    averagePortfolioScoreDelta: average(
      replays.map((item) => item.deltas.totalPortfolioScoreDelta)
    ),
    mostFrequentlyAddedSelectedVariantIds: topKeysByCount(addedCounts),
    mostFrequentlyRemovedSelectedVariantIds: topKeysByCount(removedCounts),
  };
}
