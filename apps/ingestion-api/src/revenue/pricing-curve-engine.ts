export function buildPricingCurve(netValue: number) {
  const min = netValue * 0.5;
  const optimal = netValue;
  const max = netValue * 1.5;

  return {
    min,
    optimal,
    max,
  };
}
