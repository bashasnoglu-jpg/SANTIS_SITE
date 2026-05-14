import type { OptimizerContext } from './optimizer.context.contract.ts';
import type {
  AggregatedMemoryLevel,
  AggregatedOptimizerMemoryRecord,
} from './optimizer.memory.aggregate.contract.ts';
import { FileBackedAggregatedOptimizerMemory } from './optimizer.memory.aggregate.file.ts';
import {
  buildAggregatedContextKey,
  getAggregatedHierarchyLevels,
} from './optimizer.memory.aggregate.key.ts';

export interface AggregatedMemorySelection {
  matchedContextKey: string | null;
  matchedLevel: AggregatedMemoryLevel | 'none';
  record: AggregatedOptimizerMemoryRecord | null;
}

export interface AggregatedMemoryEvidenceConfig {
  minSamplesRequired: number;
  minAverageConfidenceRequired: number;
}

export const DEFAULT_AGGREGATED_MEMORY_EVIDENCE_CONFIG: AggregatedMemoryEvidenceConfig =
  {
    minSamplesRequired: 1,
    minAverageConfidenceRequired: 50,
  };

export async function prefetchAggregatedMemoryForExperiment(params: {
  memory: FileBackedAggregatedOptimizerMemory;
  experimentId: string;
  context: OptimizerContext;
}): Promise<AggregatedOptimizerMemoryRecord[]> {
  const keys = getAggregatedHierarchyLevels().map((level) =>
    buildAggregatedContextKey(params.experimentId, params.context, level)
  );

  return params.memory.getByContextKeys(keys);
}

export function selectAggregatedMemoryRecord(params: {
  prefetchedRecords: AggregatedOptimizerMemoryRecord[];
  experimentId: string;
  context: OptimizerContext;
  variantId: string;
  evidenceConfig?: AggregatedMemoryEvidenceConfig;
}): AggregatedMemorySelection {
  const evidenceConfig =
    params.evidenceConfig ?? DEFAULT_AGGREGATED_MEMORY_EVIDENCE_CONFIG;

  const levels = getAggregatedHierarchyLevels();

  for (const level of levels) {
    const key = buildAggregatedContextKey(params.experimentId, params.context, level);

    const record = params.prefetchedRecords.find(
      (candidate) =>
        candidate.contextKey === key && candidate.variantId === params.variantId
    );

    if (!record) {
      continue;
    }

    const passesEvidence =
      record.sampleCount >= evidenceConfig.minSamplesRequired &&
      record.avgConfidenceScore >= evidenceConfig.minAverageConfidenceRequired;

    if (!passesEvidence) {
      continue;
    }

    return {
      matchedContextKey: key,
      matchedLevel: level,
      record,
    };
  }

  return {
    matchedContextKey: null,
    matchedLevel: 'none',
    record: null,
  };
}
