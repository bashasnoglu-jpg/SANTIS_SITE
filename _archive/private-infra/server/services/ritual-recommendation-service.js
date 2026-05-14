// ORCHESTRATION LAYER (DATA AGGREGATION)
import { evaluateRitualRecommendation } from "../core/ritual-recommendation/ritual-recommendation-engine.js";

export async function getRecommendationDecision(
  guestId,
  candidateService,
  deps,
) {
  const { sessionRepo, crmRepo } = deps;

  const session = await sessionRepo.getActiveSession(guestId);
  const profile = await crmRepo.getProfile(guestId);

  const input = {
    currentServices: session.services || [],
    recentHistory: profile.history || [],
    guestProfile: profile.preferences || {},
    healthFlags: profile.medicalFlags || [],
    candidateService,
  };

  const result = evaluateRitualRecommendation(input);

  return {
    guestId,
    candidateService,
    ...result,
  };
}
