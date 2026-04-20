function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAdjustedScore(
  adjustedScore: number,
  min = 0,
  max = 100
): number {
  if (max <= min) {
    return 0.5;
  }

  return clamp((adjustedScore - min) / (max - min), 0, 1);
}

export function safeSampleCount(sampleCount: number): number {
  return Math.max(0, Number.isFinite(sampleCount) ? sampleCount : 0);
}
