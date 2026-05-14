// ⚠️ LEGACY COMPAT LAYER
import { getRecommendationDecision } from "./ritual-recommendation-service.js";

export async function ritualRecommendationHeuristic(guestId, candidateService) {
  return getRecommendationDecision(
    guestId,
    candidateService,
    globalThis.__SANTIS_DEPS__,
  );
}
