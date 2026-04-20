import type { FileBackedContextualOptimizerMemory } from './optimizer.context.memory.file.ts';
import type {
  ContextualFeedbackScore,
  OptimizerContext,
} from './optimizer.context.contract.ts';
import { buildHierarchicalContextKeys } from './optimizer.context.hierarchy.ts';

export interface HierarchicalMemorySelection {
  matchedContextKey: string | null;
  matchedLevel:
    | 'exact'
    | 'segment_device_latency'
    | 'segment_device'
    | 'segment_only'
    | 'global'
    | 'none';
  scores: ContextualFeedbackScore[];
}

function mapLevel(index: number): HierarchicalMemorySelection['matchedLevel'] {
  switch (index) {
    case 0:
      return 'exact';
    case 1:
      return 'segment_device_latency';
    case 2:
      return 'segment_device';
    case 3:
      return 'segment_only';
    case 4:
      return 'global';
    default:
      return 'none';
  }
}

export async function prefetchHierarchicalContextualMemory(
  memory: FileBackedContextualOptimizerMemory,
  experimentId: string,
  context: OptimizerContext
): Promise<Record<string, ContextualFeedbackScore[]>> {
  const keys = buildHierarchicalContextKeys(experimentId, context);
  return memory.getScoresByContextKeys(keys);
}

export function selectHierarchicalContextualMemoryFromPrefetch(
  prefetchedMemory: Record<string, ContextualFeedbackScore[]>,
  experimentId: string,
  context: OptimizerContext,
  variantId: string
): HierarchicalMemorySelection {
  const keys = buildHierarchicalContextKeys(experimentId, context);

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const scores = prefetchedMemory[key] ?? [];
    const filtered = scores.filter((score) => score.variantId === variantId);

    const avgConfidence = filtered.length > 0 
      ? filtered.reduce((acc, s) => acc + s.confidenceScore, 0) / filtered.length 
      : 0;

    if (filtered.length >= 1 && avgConfidence >= 50) {
      return {
        matchedContextKey: key,
        matchedLevel: mapLevel(i),
        scores: filtered,
      };
    }
  }

  return {
    matchedContextKey: null,
    matchedLevel: 'none',
    scores: [],
  };
}
