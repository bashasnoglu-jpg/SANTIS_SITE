export const PRICING_RULES = {
  MIN_MARGIN_PERCENT: 15,
  HIGH_RISK_THRESHOLD: 80,
  MEDIUM_RISK_THRESHOLD: 40,
};

export function calculateBaseUplift(demandScore) {
  if (demandScore > 80) return 1.25;
  if (demandScore > 50) return 1.1;
  return 1.0;
}
