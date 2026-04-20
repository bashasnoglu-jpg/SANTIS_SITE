import type { OptimizerContext } from './optimizer.context.contract.ts';

function safePart(label: string, value?: string | null): string {
  return `${label}:${value && value.trim() ? value : 'unknown'}`;
}

export function buildHierarchicalContextKeys(
  experimentId: string,
  context: OptimizerContext
): string[] {
  return [
    [
      experimentId,
      safePart('segment', context.segment),
      safePart('device', context.device),
      safePart('latency', context.latencyTier),
      safePart('visitor', context.visitorType),
    ].join('|'),

    [
      experimentId,
      safePart('segment', context.segment),
      safePart('device', context.device),
      safePart('latency', context.latencyTier),
    ].join('|'),

    [
      experimentId,
      safePart('segment', context.segment),
      safePart('device', context.device),
    ].join('|'),

    [
      experimentId,
      safePart('segment', context.segment),
    ].join('|'),

    [
      experimentId,
      'global',
    ].join('|'),
  ];
}
