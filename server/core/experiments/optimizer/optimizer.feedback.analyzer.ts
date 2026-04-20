import type { FeedbackSignal, FeedbackScore } from './optimizer.feedback.contract.ts';

function safeDelta(a: number, b: number): number {
  if (b === 0) return 0;
  return (a - b) / b;
}

export function analyzeFeedback(signal: FeedbackSignal): FeedbackScore {
  const conversionDelta = safeDelta(
    signal.candidateConversion,
    signal.baselineConversion
  );

  const errorDelta = safeDelta(
    signal.candidateErrorRate,
    signal.baselineErrorRate
  );

  const latencyDelta = safeDelta(
    signal.candidateLatencyMs,
    signal.baselineLatencyMs
  );

  // 🎯 uplift (ödül)
  const upliftScore = conversionDelta * 100;

  // ⚠️ risk (ceza)
  const riskScore =
    Math.max(0, errorDelta * 120) +
    Math.max(0, latencyDelta * 80);

  // 🔒 confidence weighted
  const weightedConfidence =
    Math.min(1, signal.confidenceScore / 100);

  const finalScore =
    (upliftScore - riskScore) * weightedConfidence;

  return {
    experimentId: signal.experimentId,
    variantId: signal.variantId,
    upliftScore,
    riskScore,
    confidenceScore: signal.confidenceScore,
    finalScore,
  };
}
