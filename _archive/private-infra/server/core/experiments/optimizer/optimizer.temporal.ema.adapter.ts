import type { OptimizerContext } from './optimizer.context.contract.ts';
import type {
  AdaptOptimizerRecommendationsOutput,
  OptimizerAdaptedRecommendation,
  OptimizerCandidateRecommendation,
} from './optimizer.adapter.contract.ts';
import type { AggregatedMemoryLevel } from './optimizer.memory.aggregate.contract.ts';
import { FileBackedEMAOptimizerMemory } from './optimizer.memory.aggregate.ema.file.ts';
import {
  prefetchEMAMemoryForExperiment,
  selectEMAMemoryRecord,
  type EMAMemoryEvidenceConfig,
} from './optimizer.memory.aggregate.ema.selector.ts';
import {
  computeExponentialDecayWeight,
  DEFAULT_DECAY_CONFIG,
  type ExponentialDecayConfig,
} from './optimizer.memory.decay.ts';

export interface TemporalEMAAdaptInput {
  candidates: OptimizerCandidateRecommendation[];
  context: OptimizerContext;
}

export interface TemporalEMAMemoryMeta {
  matchedContextKey: string | null;
  matchedLevel: AggregatedMemoryLevel | 'none';
  sampleCount: number;
  emaConfidenceScore: number | null;
  decayWeight: number;
  hierarchyStrength: number;
}

export interface TemporalEMAAdaptedRecommendation
  extends OptimizerAdaptedRecommendation {
  temporalMemory: TemporalEMAMemoryMeta;
}

export interface TemporalEMAAdaptOutput
  extends AdaptOptimizerRecommendationsOutput {
  ranked: TemporalEMAAdaptedRecommendation[];
}

function getHierarchyStrength(level: AggregatedMemoryLevel | 'none'): number {
  switch (level) {
    case 'exact': return 1;
    case 'segment_device_latency': return 0.85;
    case 'segment_device': return 0.7;
    case 'segment_only': return 0.5;
    case 'global': return 0.25;
    case 'none': return 0;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeEMALearnedWeight(params: {
  emaFinal: number;
  emaConfidence: number;
  emaRisk: number;
  decayWeight: number;
  sampleCount: number;
}): number {
  const confidence = clamp(params.emaConfidence / 100, 0, 1);
  const risk = clamp(1 - params.emaRisk / 100, 0, 1);
  const sample = clamp(params.sampleCount / 20, 0.2, 1);
  const normalizedFinal = clamp((params.emaFinal + 100) / 200, 0, 1);

  const score = normalizedFinal * confidence * risk * params.decayWeight * sample;
  return clamp(score, 0, 1);
}

export class TemporalEMAOptimizerAdapter {
  constructor(
    private readonly memory: FileBackedEMAOptimizerMemory,
    private readonly evidenceConfig?: EMAMemoryEvidenceConfig,
    private readonly decayConfig: ExponentialDecayConfig = DEFAULT_DECAY_CONFIG
  ) {}

  async adaptRecommendations(input: TemporalEMAAdaptInput): Promise<TemporalEMAAdaptOutput> {
    const groupedByExperiment = new Map<string, OptimizerCandidateRecommendation[]>();

    for (const candidate of input.candidates) {
      const current = groupedByExperiment.get(candidate.experimentId) ?? [];
      current.push(candidate);
      groupedByExperiment.set(candidate.experimentId, current);
    }

    const adapted: TemporalEMAAdaptedRecommendation[] = [];

    for (const [experimentId, experimentCandidates] of groupedByExperiment.entries()) {
      const prefetchedRecords = await prefetchEMAMemoryForExperiment({
        memory: this.memory,
        experimentId,
        context: input.context,
      });

      for (const candidate of experimentCandidates) {
        const selected = selectEMAMemoryRecord({
          prefetchedRecords,
          experimentId,
          context: input.context,
          variantId: candidate.variantId,
          evidenceConfig: this.evidenceConfig,
        });

        const record = selected.record;
        const decayWeight = record
          ? computeExponentialDecayWeight(record.lastEvaluatedAt, this.decayConfig)
          : 0;

        const hierarchyStrength = getHierarchyStrength(selected.matchedLevel);

        const learnedWeight = record
          ? computeEMALearnedWeight({
              emaFinal: record.emaFinal,
              emaConfidence: record.emaConfidence,
              emaRisk: record.emaRisk,
              decayWeight,
              sampleCount: record.sampleCount,
            })
          : 0.5;

        const memoryBiasDelta = (learnedWeight - 0.5) * 0.5 * hierarchyStrength;
        const adjustedScore = candidate.baseScore * (1 + memoryBiasDelta);

        adapted.push({
          ...candidate,
          adjustedScore,
          memory: {
            experimentId: candidate.experimentId,
            variantId: candidate.variantId,
            learnedWeight,
            memoryScoreCount: record?.sampleCount ?? 0,
            memoryBiasDelta,
          },
          temporalMemory: {
            matchedContextKey: selected.matchedContextKey,
            matchedLevel: selected.matchedLevel,
            sampleCount: record?.sampleCount ?? 0,
            emaConfidenceScore: record?.emaConfidence ?? null,
            decayWeight,
            hierarchyStrength,
          },
        });
      }
    }

    adapted.sort((a, b) => b.adjustedScore - a.adjustedScore);

    return { ranked: adapted };
  }
}
