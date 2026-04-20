export interface EMAConfig {
  alpha: number; // smoothing factor (0-1)
}

export const DEFAULT_EMA_CONFIG: EMAConfig = {
  alpha: 0.2,
};

export function computeEMA(
  previous: number,
  incoming: number,
  alpha: number
): number {
  return previous * (1 - alpha) + incoming * alpha;
}
