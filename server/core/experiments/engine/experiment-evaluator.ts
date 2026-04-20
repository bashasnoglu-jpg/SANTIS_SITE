export function evaluateExperiment(results: any) {
  const { control, variant_a } = results;

  const revenueLift =
    variant_a.revenue - control.revenue;

  const abandonmentDelta =
    control.abandonmentRate - variant_a.abandonmentRate;

  const intentLift =
    variant_a.intentRate - control.intentRate;

  const score =
    revenueLift * 0.6 +
    abandonmentDelta * 0.2 +
    intentLift * 0.2;

  if (score > 0.05) {
    return { winner: 'variant_a', confidence: score };
  }

  return { winner: 'control', confidence: 0 };
}
