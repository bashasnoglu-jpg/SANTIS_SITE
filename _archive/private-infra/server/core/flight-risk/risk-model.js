// PURE MATHEMATICAL MODEL

export function calculateRiskScore({
  sessionDuration,
  inactivityMs,
  scrollDepth,
  interactions,
  exitIntent,
}) {
  let score = 0;

  // ⏱️ kısa session = risk
  if (sessionDuration < 30) score += 20;

  // 💤 inactivity spike
  if (inactivityMs > 10000) score += 25;

  // 📉 düşük scroll
  if (scrollDepth < 30) score += 15;

  // 🤏 düşük interaction
  if (interactions < 3) score += 20;

  // 🚪 exit intent = CRITICAL
  if (exitIntent) score += 40;

  return Math.min(score, 100);
}
