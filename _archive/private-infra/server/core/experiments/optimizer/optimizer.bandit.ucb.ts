import type { BanditConfig } from './optimizer.bandit.contract.ts';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeUCBScore(params: {
  learnedWeight: number;
  sampleCount: number;
  totalSamplesAcrossExperiment: number;
  config: BanditConfig;
}): {
  exploitationScore: number;
  explorationScore: number;
  posteriorScore: number;
} {
  const sampleCount = Math.max(0, params.sampleCount);
  const exploitationScore = clamp(params.learnedWeight, 0, 1);

  const explorationEligible =
    exploitationScore >= params.config.minLearnedWeightForExploration;

  const rawExploration = explorationEligible
    ? params.config.ucbExplorationConstant *
      Math.sqrt(
        Math.log(Math.max(1, params.totalSamplesAcrossExperiment + 1)) /
          Math.max(1, sampleCount + 1)
      )
    : 0;

  const explorationScore = Math.min(
    rawExploration,
    params.config.maxExplorationBonus
  );

  return {
    exploitationScore,
    explorationScore,
    posteriorScore: exploitationScore + explorationScore,
  };
}
