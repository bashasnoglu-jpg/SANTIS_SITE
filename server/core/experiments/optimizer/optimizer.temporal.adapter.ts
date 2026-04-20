import type { OptimizerContext } from './optimizer.context.contract.ts';
import type {
  AdaptOptimizerRecommendationsOutput,
  OptimizerAdaptedRecommendation,
  OptimizerCandidateRecommendation,
} from './optimizer.adapter.contract.ts';
import type { AggregatedMemoryLevel } from './optimizer.memory.aggregate.contract.ts';
import { FileBackedAggregatedOptimizerMemory } from './optimizer.memory.aggregate.file.ts';
import {
  prefetchAggregatedMemoryForExperiment,
  selectAggregatedMemoryRecord,
  type AggregatedMemoryEvidenceConfig,
} from './optimizer.memory.aggregate.selector.ts';
import {
  computeRecencyWeight,
  DEFAULT_RECENCY_CONFIG,
  type RecencyConfig,
} from './optimizer.memory.recency.ts';

export interface TemporalAdaptInput {
  candidates: OptimizerCandidateRecommendation[];
  context: OptimizerContext;
}

export interface TemporalMemoryMeta {
  matchedContextKey: string | null;
  matchedLevel: AggregatedMemoryLevel | 'none';
  sampleCount: number;
  avgConfidenceScore: number | null;
  recencyWeight: number;
  hierarchyStrength: number;
}

export interface TemporalAdaptedRecommendation
  extends OptimizerAdaptedRecommendation {
  temporalMemory: TemporalMemoryMeta;
}

export interface TemporalAdaptOutput
  extends AdaptOptimizerRecommendationsOutput {
  ranked: TemporalAdaptedRecommendation[];
}

function getHierarchyStrength(level: AggregatedMemoryLevel | 'none'): number {
  switch (level) {
    case 'exact':
      return 1;
    case 'segment_device_latency':
      return 0.85;
    case 'segment_device':
      return 0.7;
    case 'segment_only':
      return 0.5;
    case 'global':
      return 0.25;
    case 'none':
      return 0;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeAggregateLearnedWeight(params: {
  avgFinalScore: number;
  avgConfidenceScore: number;
  avgRiskScore: number;
  recencyWeight: number;
  sampleCount: number;
}): number {
  const confidenceFactor = clamp(params.avgConfidenceScore / 100, 0, 1);
  const riskPenalty = clamp(1 - params.avgRiskScore / 100, 0, 1);
  const sampleFactor = clamp(params.sampleCount / 20, 0.2, 1);

  const normalizedFinalScore = clamp((params.avgFinalScore + 100) / 200, 0, 1);

  const weighted =
    normalizedFinalScore *
    confidenceFactor *
    riskPenalty *
    params.recencyWeight *
    sampleFactor;

  return clamp(weighted, 0, 1);
}

export class TemporalAggregatedOptimizerAdapter {
  constructor(
    private readonly memory: FileBackedAggregatedOptimizerMemory,
    private readonly evidenceConfig?: AggregatedMemoryEvidenceConfig,
    private readonly recencyConfig: RecencyConfig = DEFAULT_RECENCY_CONFIG
  ) {}

  async adaptRecommendations(
    input: TemporalAdaptInput
  ): Promise<TemporalAdaptOutput> {
    const groupedByExperiment = new Map<string, OptimizerCandidateRecommendation[]>();

    for (const candidate of input.candidates) {
      const current = groupedByExperiment.get(candidate.experimentId) ?? [];
      current.push(candidate);
      groupedByExperiment.set(candidate.experimentId, current);
    }

    const adapted: TemporalAdaptedRecommendation[] = [];

    for (const [experimentId, experimentCandidates] of groupedByExperiment.entries()) {
      const prefetchedRecords = await prefetchAggregatedMemoryForExperiment({
        memory: this.memory,
        experimentId,
        context: input.context,
      });

      for (const candidate of experimentCandidates) {
        const selected = selectAggregatedMemoryRecord({
          prefetchedRecords,
          experimentId,
          context: input.context,
          variantId: candidate.variantId,
          evidenceConfig: this.evidenceConfig,
        });

        const record = selected.record;
        const recencyWeight = record
          ? computeRecencyWeight(record.lastEvaluatedAt, this.recencyConfig)
          : 0;

        const hierarchyStrength = getHierarchyStrength(selected.matchedLevel);

        const learnedWeight = record
          ? computeAggregateLearnedWeight({
              avgFinalScore: record.avgFinalScore,
              avgConfidenceScore: record.avgConfidenceScore,
              avgRiskScore: record.avgRiskScore,
              recencyWeight,
              sampleCount: record.sampleCount,
            })
          : 0.5;

        const memoryBiasDelta =
          (learnedWeight - 0.5) * 0.5 * hierarchyStrength;

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
            avgConfidenceScore: record?.avgConfidenceScore ?? null,
            recencyWeight,
            hierarchyStrength,
          },
        });
      }
    }

    adapted.sort((a, b) => b.adjustedScore - a.adjustedScore);

    return { ranked: adapted };
  }
}
