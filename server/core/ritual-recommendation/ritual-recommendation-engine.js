// PURE ENGINE — ZERO SIDE EFFECT
import {
  RULES,
  scoreUpsellAdjacency,
  scoreRitualSequence,
} from "./recommendation-rules.js";
import { calculateProfileAffinity } from "./affinity-model.js";
import { evaluateMedicalGuards } from "./contraindication-guards.js";
import { RecommendationLevels } from "./types.js";

export function evaluateRitualRecommendation(input) {
  const {
    currentServices = [],
    recentHistory = [],
    guestProfile = {},
    healthFlags = [],
    candidateService = "",
  } = input;

  const guard = evaluateMedicalGuards(healthFlags, candidateService);
  if (guard.isBlocked) {
    return {
      score: 0,
      level: "LOW",
      reasons: [guard.blockReason],
      suggestedAction: "HIDE_RECOMMENDATION",
    };
  }

  const adjacencyScore = scoreUpsellAdjacency(
    currentServices,
    candidateService,
  );
  const sequenceScore = scoreRitualSequence(recentHistory, candidateService);
  const affinityScore = calculateProfileAffinity(
    guestProfile,
    candidateService,
  );

  let totalScore = adjacencyScore + sequenceScore + affinityScore;
  totalScore = Math.min(totalScore, 100);

  let level = "LOW";
  let suggestedAction = null;
  const reasons = [];

  if (totalScore >= RULES.HIGH_CONFIDENCE_THRESHOLD) {
    level = "HIGH";
    suggestedAction = "PROMINENT_UPSELL";
    reasons.push("high_affinity_match");
  } else if (totalScore >= RULES.MEDIUM_CONFIDENCE_THRESHOLD) {
    level = "MEDIUM";
    suggestedAction = "SUBTLE_SUGGESTION";
    reasons.push("moderate_adjacency_match");
  } else {
    reasons.push("low_signal_affinity");
  }

  if (adjacencyScore > 20) reasons.push("strong_session_adjacency");

  return {
    score: totalScore,
    level,
    reasons,
    suggestedAction,
  };
}
