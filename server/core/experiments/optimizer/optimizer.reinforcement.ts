import type { FeedbackScore } from './optimizer.feedback.contract.ts';

export function computePolicyWeight(scores: FeedbackScore[]): number {
  if (scores.length === 0) return 0.5;

  const avg =
    scores.reduce((acc, s) => acc + s.finalScore, 0) /
    scores.length;

  // sigmoid benzeri normalize
  const weight = 1 / (1 + Math.exp(-avg / 50));

  return weight; // 0 → kötü, 1 → çok iyi
}
