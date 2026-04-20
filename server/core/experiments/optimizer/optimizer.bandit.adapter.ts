import type {
  BanditConfig,
  BanditDecisionMeta,
  BanditRankedCandidate,
} from './optimizer.bandit.contract.ts';
import { DEFAULT_BANDIT_CONFIG } from './optimizer.bandit.contract.ts';
import { computeThompsonPosterior } from './optimizer.bandit.thompson.ts';
import { computeUCBScore } from './optimizer.bandit.ucb.ts';
import {
  createSeededRandom,
  hashStringToSeed,
} from './optimizer.bandit.seeded-rng.ts';

export interface BanditAdaptInput {
  requestSeed: string;
  candidates: Array<{
    recommendationId: string;
    experimentId: string;
    variantId: string;
    title: string;
    summary: string;
    recommendationFamily: string;
    baseScore: number;
    adjustedScore: number;
    memory: {
      learnedWeight: number;
      memoryScoreCount: number;
    };
  }>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class OptimizerBanditAdapter {
  constructor(
    private readonly config: BanditConfig = DEFAULT_BANDIT_CONFIG
  ) {}

  adaptRecommendations(input: BanditAdaptInput): BanditRankedCandidate[] {
    const totalSamplesAcrossExperiment = new Map<string, number>();

    for (const candidate of input.candidates) {
      totalSamplesAcrossExperiment.set(
        candidate.experimentId,
        (totalSamplesAcrossExperiment.get(candidate.experimentId) ?? 0) +
          Math.max(0, candidate.memory.memoryScoreCount)
      );
    }

    const ranked = input.candidates.map((candidate) => {
      const totalSamples =
        totalSamplesAcrossExperiment.get(candidate.experimentId) ?? 0;

      const seed = hashStringToSeed(
        [
          input.requestSeed,
          candidate.experimentId,
          candidate.variantId,
          candidate.recommendationId,
        ].join('|')
      );

      const random = createSeededRandom(seed);

      const decision =
        this.config.strategy === 'ucb'
          ? computeUCBScore({
              learnedWeight: candidate.memory.learnedWeight,
              sampleCount: candidate.memory.memoryScoreCount,
              totalSamplesAcrossExperiment: totalSamples,
              config: this.config,
            })
          : computeThompsonPosterior({
              learnedWeight: candidate.memory.learnedWeight,
              sampleCount: candidate.memory.memoryScoreCount,
              config: this.config,
              random,
            });

      const posteriorScore = clamp(decision.posteriorScore, 0, 1.5);

      const finalBanditScore =
        candidate.adjustedScore * (0.85 + posteriorScore * 0.3);

      return {
        recommendationId: candidate.recommendationId,
        experimentId: candidate.experimentId,
        variantId: candidate.variantId,
        title: candidate.title,
        summary: candidate.summary,
        recommendationFamily: candidate.recommendationFamily,
        baseScore: candidate.baseScore,
        adjustedScore: candidate.adjustedScore,
        finalBanditScore,
        bandit: {
          strategy: this.config.strategy,
          sampleCount: candidate.memory.memoryScoreCount,
          exploitationScore: decision.exploitationScore,
          explorationScore: decision.explorationScore,
          posteriorScore,
        },
      };
    });

    ranked.sort((a, b) => b.finalBanditScore - a.finalBanditScore);
    return ranked;
  }
}
