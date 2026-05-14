export type PolicyMetricWindow = {
  windowId: string;
  tsFrom: string;
  tsTo: string;
  tenantId?: string;
};

export type ThresholdObservation = {
  thresholdKey: string;
  currentValue: number;
  sampleSize: number;
  attributedRevenue: number;
  confirmedIntentRate: number;
  abandonmentRate: number;
  assistAcceptanceRate?: number;
};

export type ThresholdRecommendation = {
  thresholdKey: string;
  currentValue: number;
  recommendedValue: number;
  direction: 'increase' | 'decrease' | 'hold';
  confidence: number; // 0..1
  reasonCodes: string[];
  impactSummary: {
    revenueDelta?: number;
    abandonmentDelta?: number;
    confirmedIntentDelta?: number;
    assistAcceptanceDelta?: number;
  };
};

export type PolicyOptimizerOutput = {
  generatedAt: string;
  recommendations: ThresholdRecommendation[];
};
