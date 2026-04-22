import type { OptimizerRuntimePolicy } from './optimizer-policy';

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

export type CompileRecommendationResponse = {
  ok: boolean;
  proposal?: {
    proposalId: string;
    status: 'pending' | 'approved' | 'rejected' | 'auto_applied';
    title: string;
    summary: string;
    createdAt: string;
  };
  error?: string;
};
