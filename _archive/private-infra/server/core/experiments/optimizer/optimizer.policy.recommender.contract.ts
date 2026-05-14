import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';

export type PolicyRecommendationPatchOp = {
  op: 'set';
  path: string;
  value: unknown;
  previousValue?: unknown;
  reason?: string;
};

export type PolicyRecommendationPatch = {
  ops: PolicyRecommendationPatchOp[];
};

export interface PolicyDeltaCandidate {
  candidateId: string;
  label: string;
  description: string;
  policy: OptimizerRuntimePolicy;
  changedFields: string[];
  patch: PolicyRecommendationPatch;
}

export interface PolicyRecommendationScore {
  averagePortfolioScoreDelta: number;
  averageRiskDelta: number;
  improvedScoreSnapshots: number;
  reducedRiskSnapshots: number;
  stabilityScore: number;
  overallScore: number;
}

export interface PolicyRecommendationResult {
  candidate: PolicyDeltaCandidate;
  score: PolicyRecommendationScore;
  rationale: string[];
}

export interface PolicyRecommenderResponse {
  experimentId: string;
  generatedAt: string;
  baselinePolicy: OptimizerRuntimePolicy;
  recommendations: PolicyRecommendationResult[];
}
