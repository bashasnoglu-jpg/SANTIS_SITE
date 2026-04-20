import type { RolloutHealthSnapshot } from './rollout.contract.ts';

export interface DerivedRolloutMetrics {
  relativeLatencyIncreasePct: number;
  relativeConversionDropPct: number;
  candidateErrorRate: number;
}

export function deriveRolloutMetrics(
  snapshot: RolloutHealthSnapshot
): DerivedRolloutMetrics {
  const relativeLatencyIncreasePct =
    snapshot.control.p95LatencyMs === 0
      ? 0
      : ((snapshot.candidate.p95LatencyMs - snapshot.control.p95LatencyMs) /
          snapshot.control.p95LatencyMs) *
        100;

  const relativeConversionDropPct =
    snapshot.control.conversionRate === 0
      ? 0
      : ((snapshot.control.conversionRate - snapshot.candidate.conversionRate) /
          snapshot.control.conversionRate) *
        100;

  return {
    relativeLatencyIncreasePct,
    relativeConversionDropPct,
    candidateErrorRate: snapshot.candidate.errorRate,
  };
}
