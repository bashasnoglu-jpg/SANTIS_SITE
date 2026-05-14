export function calculateProfileAffinity(guestProfile, candidateService) {
  let score = 0;
  // Baseline preference matching
  if (
    guestProfile.preferences?.includes("Aromatherapy") &&
    candidateService.includes("Aroma")
  ) {
    score += 40;
  }
  if (guestProfile.likes?.includes(candidateService)) {
    score += 50;
  }
  return Math.min(score, 100);
}
