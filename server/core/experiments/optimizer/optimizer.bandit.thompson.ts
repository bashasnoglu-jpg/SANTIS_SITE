import type { BanditConfig } from './optimizer.bandit.contract.ts';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomNormal(random: () => number): number {
  let u = 0;
  let v = 0;

  while (u === 0) u = random();
  while (v === 0) v = random();

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function approximateBetaSample(
  alpha: number,
  beta: number,
  random: () => number
): number {
  const mean = alpha / (alpha + beta);
  const variance =
    (alpha * beta) / (((alpha + beta) ** 2) * (alpha + beta + 1));

  const stdDev = Math.sqrt(Math.max(variance, 1e-6));
  return clamp(mean + randomNormal(random) * stdDev, 0, 1);
}

export function computeThompsonPosterior(params: {
  learnedWeight: number;
  sampleCount: number;
  config: BanditConfig;
  random: () => number;
}): {
  exploitationScore: number;
  explorationScore: number;
  posteriorScore: number;
} {
  const sampleCount = Math.max(0, params.sampleCount);
  const learnedWeight = clamp(params.learnedWeight, 0, 1);

  const pseudoSuccesses = learnedWeight * sampleCount;
  const pseudoFailures = (1 - learnedWeight) * sampleCount;

  const alpha = params.config.thompsonPriorAlpha + pseudoSuccesses;
  const beta = params.config.thompsonPriorBeta + pseudoFailures;

  const posteriorScore = approximateBetaSample(alpha, beta, params.random);

  const explorationEligible =
    learnedWeight >= params.config.minLearnedWeightForExploration;

  const explorationScore = explorationEligible
    ? Math.min(params.config.maxExplorationBonus, 1 / Math.sqrt(sampleCount + 1))
    : 0;

  return {
    exploitationScore: learnedWeight,
    explorationScore,
    posteriorScore,
  };
}
