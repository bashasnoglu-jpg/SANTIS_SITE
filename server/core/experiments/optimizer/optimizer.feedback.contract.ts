export interface FeedbackSignal {
  experimentId: string;
  rolloutId: string;
  variantId: string;

  baselineConversion: number;
  candidateConversion: number;

  baselineErrorRate: number;
  candidateErrorRate: number;

  baselineLatencyMs: number;
  candidateLatencyMs: number;

  sampleSize: number;
  confidenceScore: number;

  outcome: 'win' | 'loss' | 'neutral';
  evaluatedAt: string;
}

export interface FeedbackScore {
  experimentId: string;
  variantId: string;

  upliftScore: number;      // + ise iyi
  riskScore: number;        // + ise kötü
  confidenceScore: number;

  finalScore: number;       // optimizer bunu kullanır
}
