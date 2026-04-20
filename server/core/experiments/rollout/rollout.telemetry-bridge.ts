import type {
  RolloutHealthSnapshot,
  RolloutStagePercent,
} from './rollout.contract.ts';
import { RolloutHealthSnapshotSchema } from './rollout.schemas.ts';

export interface BuildRolloutSnapshotInput {
  experimentId: string;
  stagePercent: RolloutStagePercent;
  windowMinutes: number;
  nowIso: string;
}

export interface MetricsObserver {
  getConversionRate(input: {
    experimentId: string;
    arm: 'control' | 'candidate';
    windowMinutes: number;
    nowIso: string;
  }): Promise<number>;

  getErrorRate(input: {
    experimentId: string;
    arm: 'control' | 'candidate';
    windowMinutes: number;
    nowIso: string;
  }): Promise<number>;

  getP95LatencyMs(input: {
    experimentId: string;
    arm: 'control' | 'candidate';
    windowMinutes: number;
    nowIso: string;
  }): Promise<number>;

  getSampleSize(input: {
    experimentId: string;
    stagePercent: RolloutStagePercent;
    windowMinutes: number;
    nowIso: string;
  }): Promise<number>;

  getConfidenceScore(input: {
    experimentId: string;
    windowMinutes: number;
    nowIso: string;
  }): Promise<number>;
}

export interface BuildRolloutSnapshotDeps {
  observer: MetricsObserver;
}

export async function buildRolloutHealthSnapshot(
  deps: BuildRolloutSnapshotDeps,
  input: BuildRolloutSnapshotInput
): Promise<RolloutHealthSnapshot> {
  const [
    controlConversionRate,
    candidateConversionRate,
    controlErrorRate,
    candidateErrorRate,
    controlP95LatencyMs,
    candidateP95LatencyMs,
    sampleSize,
    confidenceScore,
  ] = await Promise.all([
    deps.observer.getConversionRate({
      experimentId: input.experimentId,
      arm: 'control',
      windowMinutes: input.windowMinutes,
      nowIso: input.nowIso,
    }),
    deps.observer.getConversionRate({
      experimentId: input.experimentId,
      arm: 'candidate',
      windowMinutes: input.windowMinutes,
      nowIso: input.nowIso,
    }),
    deps.observer.getErrorRate({
      experimentId: input.experimentId,
      arm: 'control',
      windowMinutes: input.windowMinutes,
      nowIso: input.nowIso,
    }),
    deps.observer.getErrorRate({
      experimentId: input.experimentId,
      arm: 'candidate',
      windowMinutes: input.windowMinutes,
      nowIso: input.nowIso,
    }),
    deps.observer.getP95LatencyMs({
      experimentId: input.experimentId,
      arm: 'control',
      windowMinutes: input.windowMinutes,
      nowIso: input.nowIso,
    }),
    deps.observer.getP95LatencyMs({
      experimentId: input.experimentId,
      arm: 'candidate',
      windowMinutes: input.windowMinutes,
      nowIso: input.nowIso,
    }),
    deps.observer.getSampleSize({
      experimentId: input.experimentId,
      stagePercent: input.stagePercent,
      windowMinutes: input.windowMinutes,
      nowIso: input.nowIso,
    }),
    deps.observer.getConfidenceScore({
      experimentId: input.experimentId,
      windowMinutes: input.windowMinutes,
      nowIso: input.nowIso,
    }),
  ]);

  return RolloutHealthSnapshotSchema.parse({
    timestamp: input.nowIso,
    stagePercent: input.stagePercent,
    sampleSize,
    confidenceScore,
    control: {
      conversionRate: controlConversionRate,
      errorRate: controlErrorRate,
      p95LatencyMs: controlP95LatencyMs,
    },
    candidate: {
      conversionRate: candidateConversionRate,
      errorRate: candidateErrorRate,
      p95LatencyMs: candidateP95LatencyMs,
    },
  });
}
