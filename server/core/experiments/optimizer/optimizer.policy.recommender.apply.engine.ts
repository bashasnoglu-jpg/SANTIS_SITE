import type { OptimizerPolicyCompiler } from './optimizer.policy.compiler.ts';
import type { OptimizerPolicyRecommenderStore } from './optimizer.policy.recommender.store.ts';

export class OptimizerPolicyRecommenderApplyEngine {
  constructor(
    private readonly recommendationStore: OptimizerPolicyRecommenderStore,
    private readonly compiler: OptimizerPolicyCompiler
  ) {}

  async applyRecommendation(
    experimentId: string,
    actorId: string,
    recommendationId: string
  ) {
    const snapshot = await this.recommendationStore.getLatest(experimentId);

    if (!snapshot) {
      throw new Error('No recommendation snapshot found for this experiment.');
    }

    const MAX_AGE_MS = 1000 * 60 * 30; // 30 mins
    const age = Date.now() - new Date(snapshot.generatedAt).getTime();
    if (age > MAX_AGE_MS) {
      throw new Error('Recommendation snapshot is stale. Please refresh recommendations.');
    }

    const recommendation = snapshot.recommendations.find(
      (item) => item.candidate.candidateId === recommendationId
    );

    if (!recommendation) {
      throw new Error(`Recommendation not found: ${recommendationId}`);
    }

    if (!recommendation.candidate.patch?.ops?.length) {
      throw new Error(`Recommendation ${recommendationId} is not compilable.`);
    }

    return this.compiler.compileToProposal({
      experimentId,
      actorId,
      recommendationId: recommendation.candidate.candidateId,
      recommendationKey: recommendation.candidate.label,
      recommendationTitle: recommendation.candidate.label,
      recommendationSummary: recommendation.candidate.description,
      patch: recommendation.candidate.patch,
      baselinePolicy: snapshot.baselinePolicy,
      proposedPolicy: recommendation.candidate.policy,
      changedFields: recommendation.candidate.changedFields,
    });
  }
}
