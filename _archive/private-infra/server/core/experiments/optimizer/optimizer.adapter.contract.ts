export interface OptimizerCandidateRecommendation {
  recommendationId: string;
  experimentId: string;
  variantId: string;
  title: string;
  summary: string;
  baseScore: number;
  recommendationFamily:
    | 'latency_tuning'
    | 'conversion_copy'
    | 'layout_density'
    | 'risk_reduction'
    | 'traffic_strategy'
    | 'other';
}

export interface OptimizerMemoryAdjustment {
  experimentId: string;
  variantId: string;
  learnedWeight: number;
  memoryScoreCount: number;
  memoryBiasDelta: number;
}

export interface OptimizerAdaptedRecommendation
  extends OptimizerCandidateRecommendation {
  adjustedScore: number;
  memory: OptimizerMemoryAdjustment;
}

export interface AdaptOptimizerRecommendationsInput {
  candidates: OptimizerCandidateRecommendation[];
}

export interface AdaptOptimizerRecommendationsOutput {
  ranked: OptimizerAdaptedRecommendation[];
}
