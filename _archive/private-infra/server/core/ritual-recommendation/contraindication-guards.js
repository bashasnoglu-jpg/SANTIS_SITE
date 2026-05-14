export function evaluateMedicalGuards(healthFlags, candidateService) {
  if (
    healthFlags.includes("PREGNANCY") &&
    ["Hot Stone", "Deep Tissue"].includes(candidateService)
  ) {
    return { isBlocked: true, blockReason: "contraindication_pregnancy" };
  }
  if (
    healthFlags.includes("HIGH_BLOOD_PRESSURE") &&
    candidateService.includes("Sauna")
  ) {
    return { isBlocked: true, blockReason: "contraindication_hbp" };
  }
  return { isBlocked: false, blockReason: null };
}
