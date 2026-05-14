import type { PolicyRecommendationPatch } from './optimizer.policy.recommender.contract.ts';
import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';

export type OptimizerPolicyCompilerInput = {
  experimentId: string;
  actorId: string;
  recommendationId: string;
  recommendationKey: string;
  recommendationTitle: string;
  recommendationSummary: string;
  patch: PolicyRecommendationPatch;
  baselinePolicy: OptimizerRuntimePolicy;
  proposedPolicy: OptimizerRuntimePolicy;
  changedFields: string[];
};

export type OptimizerCompiledProposal = {
  proposalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_applied';
  title: string;
  summary: string;
  patch: PolicyRecommendationPatch;
  createdAt: string;
};

export type CompileRecommendationRequest = {
  experimentId: string;
  recommendationId: string;
};

export type CompileRecommendationResponse = {
  ok: boolean;
  proposal?: OptimizerCompiledProposal;
  error?: string;
};
