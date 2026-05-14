import type { OptimizerContext } from './optimizer.context.contract.ts';
import type { AggregatedMemoryLevel } from './optimizer.memory.aggregate.contract.ts';

function safePart(label: string, value?: string | null): string {
  return `${label}:${value && value.trim() ? value : 'unknown'}`;
}

export function buildAggregatedContextKey(
  experimentId: string,
  context: OptimizerContext,
  level: AggregatedMemoryLevel
): string {
  switch (level) {
    case 'exact':
      return [
        experimentId,
        safePart('segment', context.segment),
        safePart('device', context.device),
        safePart('latency', context.latencyTier),
        safePart('visitor', context.visitorType),
      ].join('|');

    case 'segment_device_latency':
      return [
        experimentId,
        safePart('segment', context.segment),
        safePart('device', context.device),
        safePart('latency', context.latencyTier),
      ].join('|');

    case 'segment_device':
      return [
        experimentId,
        safePart('segment', context.segment),
        safePart('device', context.device),
      ].join('|');

    case 'segment_only':
      return [
        experimentId,
        safePart('segment', context.segment),
      ].join('|');

    case 'global':
      return [experimentId, 'global'].join('|');
  }
}

export function getAggregatedHierarchyLevels(): AggregatedMemoryLevel[] {
  return [
    'exact',
    'segment_device_latency',
    'segment_device',
    'segment_only',
    'global',
  ];
}
