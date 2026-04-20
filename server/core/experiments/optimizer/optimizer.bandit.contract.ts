export type BanditStrategy = 'thompson_sampling' | 'ucb';

export interface BanditArmSignal {
  experimentId: string;
  variantId: string;
  sampleCount: number;
  learnedWeight: number; // 0..1
  adjustedScore: number; // temporal adapter sonrası skor
}

export interface BanditConfig {
  strategy: BanditStrategy;
  thompsonPriorAlpha: number;
  thompsonPriorBeta: number;
  ucbExplorationConstant: number;
  maxExplorationBonus: number;
  minLearnedWeightForExploration: number;
}

export const DEFAULT_BANDIT_CONFIG: BanditConfig = {
  strategy: 'thompson_sampling',
  thompsonPriorAlpha: 1,
  thompsonPriorBeta: 1,
  ucbExplorationConstant: 1.4,
  maxExplorationBonus: 0.2,
  minLearnedWeightForExploration: 0.55,
};

export interface BanditDecisionMeta {
  strategy: BanditStrategy;
  sampleCount: number;
  exploitationScore: number;
  explorationScore: number;
  posteriorScore: number;
}

export interface BanditRankedCandidate {
  recommendationId: string;
  experimentId: string;
  variantId: string;
  title: string;
  summary: string;
  recommendationFamily: string;
  baseScore: number;
  adjustedScore: number;
  finalBanditScore: number;
  bandit: BanditDecisionMeta;
}
