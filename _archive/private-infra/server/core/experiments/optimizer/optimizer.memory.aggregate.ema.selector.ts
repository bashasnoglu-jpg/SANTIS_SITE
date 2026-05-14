import type { OptimizerContext } from './optimizer.context.contract.ts';
import { FileBackedEMAOptimizerMemory, type EMARecord } from './optimizer.memory.aggregate.ema.file.ts';
import {
  buildAggregatedContextKey,
  getAggregatedHierarchyLevels,
} from './optimizer.memory.aggregate.key.ts';
import type { AggregatedMemoryLevel } from './optimizer.memory.aggregate.contract.ts';

export interface EMAMemorySelection {
  matchedContextKey: string | null;
  matchedLevel: AggregatedMemoryLevel | 'none';
  record: EMARecord | null;
}

export interface EMAMemoryEvidenceConfig {
  minSamplesRequired: number;
  minAverageConfidenceRequired: number;
}

export const DEFAULT_EMA_MEMORY_EVIDENCE_CONFIG: EMAMemoryEvidenceConfig = {
  minSamplesRequired: 1,
  minAverageConfidenceRequired: 50,
};

export async function prefetchEMAMemoryForExperiment(params: {
  memory: FileBackedEMAOptimizerMemory;
  experimentId: string;
  context: OptimizerContext;
}): Promise<EMARecord[]> {
  const keys = getAggregatedHierarchyLevels().map((level) =>
    buildAggregatedContextKey(params.experimentId, params.context, level)
  );
  return params.memory.getByContextKeys(keys);
}

export function selectEMAMemoryRecord(params: {
  prefetchedRecords: EMARecord[];
  experimentId: string;
  context: OptimizerContext;
  variantId: string;
  evidenceConfig?: EMAMemoryEvidenceConfig;
}): EMAMemorySelection {
  const evidenceConfig = params.evidenceConfig ?? DEFAULT_EMA_MEMORY_EVIDENCE_CONFIG;
  const levels = getAggregatedHierarchyLevels();

  for (const level of levels) {
    const key = buildAggregatedContextKey(params.experimentId, params.context, level);

    const record = params.prefetchedRecords.find(
      (candidate) => candidate.contextKey === key && candidate.variantId === params.variantId
    );

    if (!record) continue;

    const passesEvidence =
      record.sampleCount >= evidenceConfig.minSamplesRequired &&
      record.emaConfidence >= evidenceConfig.minAverageConfidenceRequired;

    if (!passesEvidence) continue;

    return {
      matchedContextKey: key,
      matchedLevel: level,
      record,
    };
  }

  return { matchedContextKey: null, matchedLevel: 'none', record: null };
}
