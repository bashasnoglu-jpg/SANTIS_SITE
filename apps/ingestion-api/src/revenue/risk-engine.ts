export function computeRisk({
  confidence,
  successRate,
  historyCount,
}: {
  confidence: number;
  successRate: number;
  historyCount: number;
}) {
  let risk = 0;

  // low confidence
  risk += (1 - confidence) * 0.5;

  // unstable success
  risk += (1 - successRate) * 0.3;

  // sparse data penalty
  if (historyCount < 5) {
    risk += 0.2;
  }

  return Math.min(1, risk);
}
