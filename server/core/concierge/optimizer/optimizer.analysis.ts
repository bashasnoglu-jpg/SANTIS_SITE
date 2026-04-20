export function calculateConfidence(input: {
  sampleSize: number;
  revenueDelta: number;
  abandonmentDelta: number;
}) {
  let confidence = 0.2;

  if (input.sampleSize >= 20) confidence += 0.25;
  if (input.sampleSize >= 50) confidence += 0.2;
  if (input.revenueDelta > 0) confidence += 0.2;
  if (input.abandonmentDelta < 0) confidence += 0.15;

  return Math.max(0, Math.min(1, Number(confidence.toFixed(2))));
}
