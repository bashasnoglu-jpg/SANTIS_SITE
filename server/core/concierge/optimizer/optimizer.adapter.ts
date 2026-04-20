import { buildThresholdRecommendation } from './optimizer.recommendations.ts';

export function derivePolicyOptimizerOutput(input: {
  generatedAt?: string;
  observations: Array<{
    thresholdKey: string;
    currentValue: number;
    candidateValue: number;
    sampleSize: number;
    revenueDelta: number;
    abandonmentDelta: number;
    confirmedIntentDelta: number;
    assistAcceptanceDelta?: number;
  }>;
}) {
  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    recommendations: input.observations.map((obs) =>
      buildThresholdRecommendation({
        thresholdKey: obs.thresholdKey,
        currentValue: obs.currentValue,
        candidateValue: obs.candidateValue,
        sampleSize: obs.sampleSize,
        revenueDelta: obs.revenueDelta,
        abandonmentDelta: obs.abandonmentDelta,
        confirmedIntentDelta: obs.confirmedIntentDelta,
        assistAcceptanceDelta: obs.assistAcceptanceDelta,
      })
    ),
  };
}
