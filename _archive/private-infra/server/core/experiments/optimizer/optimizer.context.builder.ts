import type { OptimizerContext } from './optimizer.context.contract.ts';

export interface BuildOptimizerContextInput {
  isVip?: boolean;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  p95LatencyMs?: number;
  isReturning?: boolean;
}

export function buildOptimizerContext(
  input: BuildOptimizerContextInput
): OptimizerContext {
  const latencyTier =
    input.p95LatencyMs == null
      ? 'unknown'
      : input.p95LatencyMs >= 1500
      ? 'high'
      : input.p95LatencyMs >= 800
      ? 'medium'
      : 'low';

  return {
    segment: input.isVip ? 'vip' : 'standard',
    device: input.deviceType ?? 'unknown',
    latencyTier,
    visitorType:
      input.isReturning == null
        ? 'unknown'
        : input.isReturning
        ? 'returning'
        : 'first_time',
  };
}
