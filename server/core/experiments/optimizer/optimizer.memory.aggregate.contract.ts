export type AggregatedMemoryLevel =
  | 'exact'
  | 'segment_device_latency'
  | 'segment_device'
  | 'segment_only'
  | 'global';

export interface AggregatedOptimizerMemoryRecord {
  experimentId: string;
  variantId: string;
  contextKey: string;
  level: AggregatedMemoryLevel;

  sampleCount: number;

  avgUpliftScore: number;
  avgRiskScore: number;
  avgConfidenceScore: number;
  avgFinalScore: number;

  lastEvaluatedAt: string;
  updatedAt: string;
}

export interface LightweightAggregatedMemorySignal {
  experimentId: string;
  variantId: string;
  upliftScore: number;
  riskScore: number;
  confidenceScore: number;
  finalScore: number;
  evaluatedAt: string;
}
