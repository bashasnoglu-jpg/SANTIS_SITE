export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function isHighLatency(latencyMs?: number, threshold = 1200): boolean {
  return typeof latencyMs === 'number' && latencyMs >= threshold;
}

export function hasQuoteFailures(count: number): boolean {
  return count > 0;
}

export function isLowSupply(count: number, threshold: number): boolean {
  return count <= threshold;
}
