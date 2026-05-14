import type {
  PolicySimulationDiff,
  PolicySimulationScenarioResult,
} from './optimizer.policy.simulation.contract.ts';

function subtract(left: string[], right: string[]): string[] {
  const rightSet = new Set(right);
  return left.filter((item) => !rightSet.has(item));
}

export function buildPolicySimulationDiff(params: {
  baseline: PolicySimulationScenarioResult;
  simulated: PolicySimulationScenarioResult;
}): PolicySimulationDiff {
  return {
    addedAllowedVariantIds: subtract(
      params.simulated.allowedVariantIds,
      params.baseline.allowedVariantIds
    ),
    removedAllowedVariantIds: subtract(
      params.baseline.allowedVariantIds,
      params.simulated.allowedVariantIds
    ),
    addedSelectedVariantIds: subtract(
      params.simulated.selectedVariantIds,
      params.baseline.selectedVariantIds
    ),
    removedSelectedVariantIds: subtract(
      params.baseline.selectedVariantIds,
      params.simulated.selectedVariantIds
    ),
    totalRiskDelta:
      params.simulated.totalRiskScore - params.baseline.totalRiskScore,
    totalPortfolioScoreDelta:
      params.simulated.totalPortfolioScore -
      params.baseline.totalPortfolioScore,
  };
}
