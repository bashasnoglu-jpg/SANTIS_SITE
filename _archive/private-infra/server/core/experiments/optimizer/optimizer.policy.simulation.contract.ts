import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';

export interface PolicySimulationCandidate {
  recommendationId: string;
  variantId: string;
  recommendationFamily: string;

  finalBanditScore: number;
  riskScore: number | null;
  projectedTrafficShare: number | null;
  liveGuardrailScore: number | null;

  currentlyAllowed: boolean;
  currentBlockedReasons: string[];
}

export interface PolicySimulationSnapshotInput {
  experimentId: string;
  candidates: PolicySimulationCandidate[];
}

export interface PolicySimulationScenarioResult {
  policy: OptimizerRuntimePolicy;
  allowedVariantIds: string[];
  blocked: Array<{
    variantId: string;
    blockedReasons: string[];
  }>;
  selectedVariantIds: string[];
  totalRiskScore: number;
  totalPortfolioScore: number;
}

export interface PolicySimulationDiff {
  addedAllowedVariantIds: string[];
  removedAllowedVariantIds: string[];
  addedSelectedVariantIds: string[];
  removedSelectedVariantIds: string[];
  totalRiskDelta: number;
  totalPortfolioScoreDelta: number;
}

export interface PolicySimulationResponse {
  experimentId: string;
  proposalId: string;
  generatedAt: string;
  baseline: PolicySimulationScenarioResult;
  simulated: PolicySimulationScenarioResult;
  diff: PolicySimulationDiff;
}
