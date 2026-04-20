export interface ExponentialDecayConfig {
  lambda: number; // decay rate
}

export const DEFAULT_DECAY_CONFIG: ExponentialDecayConfig = {
  lambda: 0.05, // saat başına decay
};

export function computeExponentialDecayWeight(
  evaluatedAt: string,
  config: ExponentialDecayConfig = DEFAULT_DECAY_CONFIG,
  now = Date.now()
): number {
  const ageHours =
    (now - new Date(evaluatedAt).getTime()) / 3_600_000;

  if (ageHours <= 0) {
    return 1;
  }

  const weight = Math.exp(-config.lambda * ageHours);

  // numerik stabilite
  return Math.max(0.05, Math.min(1, weight));
}
