import { randomUUID } from 'node:crypto';
import type { OptimizerDecisionSnapshot } from './optimizer.ops.snapshot.store.ts';
import type { OptimizerRuntimePolicy } from './optimizer.policy.contract.ts';
import type {
  PolicyRecommendationResult,
  PolicyRecommenderResponse,
} from './optimizer.policy.recommender.contract.ts';
import { generatePolicyDeltaCandidates } from './optimizer.policy.recommender.generator.ts';
import { scorePolicyBacktest } from './optimizer.policy.recommender.scorer.ts';
import { OptimizerPolicyBacktestEngine } from './optimizer.policy.backtest.engine.ts';
import type { OptimizerPolicyRecommenderStore } from './optimizer.policy.recommender.store.ts';

export class OptimizerPolicyRecommenderEngine {
  constructor(
    private readonly backtestEngine: OptimizerPolicyBacktestEngine,
    private readonly store: OptimizerPolicyRecommenderStore
  ) {}

  async recommend(params: {
    experimentId: string;
    baselinePolicy: OptimizerRuntimePolicy;
    snapshots: OptimizerDecisionSnapshot[];
    from: string;
    to: string;
  }): PolicyRecommenderResponse {
    const candidates = generatePolicyDeltaCandidates(params.baselinePolicy);

    const recommendations: PolicyRecommendationResult[] = candidates.map((candidate) => {
      const pseudoProposal = {
        proposalId: randomUUID(),
        experimentId: params.experimentId,
        basePolicy: params.baselinePolicy,
        proposedPolicy: candidate.policy,
        anomalies: [],
        changedFields: candidate.changedFields,
        requiresApproval: true,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        decidedAt: null,
        decidedBy: null,
        rejectionReason: null,
      };

      const backtest = this.backtestEngine.runBacktest({
        proposal: pseudoProposal,
        snapshots: params.snapshots,
        from: params.from,
        to: params.to,
      });

      const score = scorePolicyBacktest(backtest);
      const rationale: string[] = [];

      if (score.averagePortfolioScoreDelta > 0) {
        rationale.push(
          `Average portfolio score improves by ${score.averagePortfolioScoreDelta.toFixed(2)}.`
        );
      } else if (score.averagePortfolioScoreDelta < 0) {
        rationale.push(
          `Average portfolio score drops by ${Math.abs(
            score.averagePortfolioScoreDelta
          ).toFixed(2)}.`
        );
      }

      if (score.averageRiskDelta < 0) {
        rationale.push(
          `Average risk decreases by ${Math.abs(score.averageRiskDelta).toFixed(2)}.`
        );
      } else if (score.averageRiskDelta > 0) {
        rationale.push(
          `Average risk increases by ${score.averageRiskDelta.toFixed(2)}.`
        );
      }

      rationale.push(
        `${score.improvedScoreSnapshots} snapshot(s) improved score; ${score.reducedRiskSnapshots} reduced risk.`
      );

      rationale.push(`Stability score: ${score.stabilityScore.toFixed(2)}.`);

      return {
        candidate,
        score,
        rationale,
      };
    });

    recommendations.sort((a, b) => b.score.overallScore - a.score.overallScore);

    const result = {
      experimentId: params.experimentId,
      generatedAt: new Date().toISOString(),
      baselinePolicy: params.baselinePolicy,
      recommendations,
    };
    
    await this.store.save(result);
    return result;
  }
}
