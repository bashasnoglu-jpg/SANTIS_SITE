import type { OptimizerContext } from './optimizer.context.contract.ts';
import type {
  AggregatedMemoryLevel,
  LightweightAggregatedMemorySignal,
} from './optimizer.memory.aggregate.contract.ts';
import {
  buildAggregatedContextKey,
  getAggregatedHierarchyLevels,
} from './optimizer.memory.aggregate.key.ts';

export interface AggregatedMemoryWriteInstruction {
  experimentId: string;
  variantId: string;
  contextKey: string;
  level: AggregatedMemoryLevel;
  signal: LightweightAggregatedMemorySignal;
}

export function buildAggregatedMemoryWriteInstructions(params: {
  experimentId: string;
  variantId: string;
  context: OptimizerContext;
  signal: LightweightAggregatedMemorySignal;
}): AggregatedMemoryWriteInstruction[] {
  const levels = getAggregatedHierarchyLevels();

  return levels.map((level) => ({
    experimentId: params.experimentId,
    variantId: params.variantId,
    level,
    contextKey: buildAggregatedContextKey(params.experimentId, params.context, level),
    signal: params.signal,
  }));
}
