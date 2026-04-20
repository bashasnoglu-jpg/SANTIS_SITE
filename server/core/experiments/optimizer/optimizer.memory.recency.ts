export interface RecencyConfig {
  freshHours: number;
  warmHours: number;
  coolHours: number;
  freshWeight: number;
  warmWeight: number;
  coolWeight: number;
  staleWeight: number;
}

export const DEFAULT_RECENCY_CONFIG: RecencyConfig = {
  freshHours: 24,
  warmHours: 72,
  coolHours: 24 * 7,
  freshWeight: 1,
  warmWeight: 0.8,
  coolWeight: 0.6,
  staleWeight: 0.3,
};

export function getAgeHours(evaluatedAt: string, now = Date.now()): number {
  const timestamp = new Date(evaluatedAt).getTime();
  return Math.max(0, (now - timestamp) / 3_600_000);
}

export function computeRecencyWeight(
  evaluatedAt: string,
  config: RecencyConfig = DEFAULT_RECENCY_CONFIG,
  now = Date.now()
): number {
  const ageHours = getAgeHours(evaluatedAt, now);

  if (ageHours <= config.freshHours) {
    return config.freshWeight;
  }

  if (ageHours <= config.warmHours) {
    return config.warmWeight;
  }

  if (ageHours <= config.coolHours) {
    return config.coolWeight;
  }

  return config.staleWeight;
}
