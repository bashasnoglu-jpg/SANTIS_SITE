export const CHURN_RULES = {
  CRITICAL_THRESHOLD: 85,
  HIGH_THRESHOLD: 65,
  MEDIUM_THRESHOLD: 35,
};

export function evaluateDissatisfaction(complaintStream, downgradeRisk) {
  let score = 0;
  if (complaintStream >= 3) score += 40;
  else if (complaintStream > 0) score += 15;

  if (downgradeRisk) score += 30;

  return score;
}

export function evaluateLoyaltyDecay(silenceDays) {
  if (silenceDays > 120) return 40;
  if (silenceDays > 60) return 20;
  return 0;
}
