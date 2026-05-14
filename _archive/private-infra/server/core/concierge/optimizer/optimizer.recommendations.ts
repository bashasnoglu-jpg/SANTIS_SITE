import { optimizerPolicyDefaults, optimizerReasonCodes } from './optimizer.rules.ts';
import { calculateConfidence } from './optimizer.analysis.ts';

export function buildThresholdRecommendation(input: {
  thresholdKey: string;
  currentValue: number;
  candidateValue: number;
  sampleSize: number;
  revenueDelta: number;
  abandonmentDelta: number;
  confirmedIntentDelta: number;
  assistAcceptanceDelta?: number;
}) {
  const reasonCodes: string[] = [];

  if (input.sampleSize < optimizerPolicyDefaults.minimumSampleSize) {
    reasonCodes.push(optimizerReasonCodes.LOW_SAMPLE_SIZE);
  }

  if (input.revenueDelta > 0) {
    reasonCodes.push(optimizerReasonCodes.STRONG_REVENUE_GAIN);
  }

  if (input.abandonmentDelta < 0) {
    reasonCodes.push(optimizerReasonCodes.ABANDONMENT_REDUCTION);
  }

  if (input.confirmedIntentDelta > 0) {
    reasonCodes.push(optimizerReasonCodes.INTENT_RATE_GAIN);
  }

  if ((input.assistAcceptanceDelta ?? 0) > 0) {
    reasonCodes.push(optimizerReasonCodes.ASSIST_ACCEPTANCE_GAIN);
  }

  if (reasonCodes.length === 0) {
    reasonCodes.push(optimizerReasonCodes.NO_CLEAR_WINNER);
  }

  const confidence = calculateConfidence({
    sampleSize: input.sampleSize,
    revenueDelta: input.revenueDelta,
    abandonmentDelta: input.abandonmentDelta,
  });

  const direction =
    input.candidateValue > input.currentValue
      ? 'increase'
      : input.candidateValue < input.currentValue
      ? 'decrease'
      : 'hold';

  return {
    thresholdKey: input.thresholdKey,
    currentValue: input.currentValue,
    recommendedValue: input.candidateValue,
    direction,
    confidence,
    reasonCodes,
    impactSummary: {
      revenueDelta: input.revenueDelta,
      abandonmentDelta: input.abandonmentDelta,
      confirmedIntentDelta: input.confirmedIntentDelta,
      assistAcceptanceDelta: input.assistAcceptanceDelta,
    },
  };
}
