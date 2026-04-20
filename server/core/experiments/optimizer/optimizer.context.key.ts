import type { OptimizerContext } from './optimizer.context.contract.ts';

function safePart(label: string, value: string): string {
  return `${label}:${value || 'unknown'}`;
}

export function buildContextKey(
  experimentId: string,
  context: OptimizerContext
): string {
  return [
    experimentId,
    safePart('segment', context.segment),
    safePart('device', context.device),
    safePart('latency', context.latencyTier),
    safePart('visitor', context.visitorType),
  ].join('|');
}
