export function calculateFeedbackScore(input: {
  revenueDelta: number;
  hesitationDelta: number;
}) {
  const revenueScore = Math.tanh(input.revenueDelta / 1000);
  const hesitationScore = -Math.tanh(input.hesitationDelta / 50);

  return Number(((revenueScore + hesitationScore) / 2).toFixed(4));
}
