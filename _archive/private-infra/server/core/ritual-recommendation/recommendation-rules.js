export const RULES = {
  HIGH_CONFIDENCE_THRESHOLD: 75,
  MEDIUM_CONFIDENCE_THRESHOLD: 40,
};

export function scoreUpsellAdjacency(currentServices, candidateService) {
  if (currentServices.includes("Hammam") && candidateService === "Foam Massage")
    return 30;
  if (
    currentServices.includes("Facial") &&
    candidateService === "Anti-Aging Mask"
  )
    return 25;
  return 5;
}

export function scoreRitualSequence(recentHistory, candidateService) {
  if (
    recentHistory.includes("Swedish Massage") &&
    candidateService === "Deep Tissue"
  )
    return 20;
  return 0;
}
