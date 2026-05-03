import type { SovereignAction } from "@santis/domain-schema/src/core-state.interface";
import type { ResolvedIntentState } from "./intent-resolution.service";
import type { RitualPathCandidate } from "./bounded-pathfinding.service";
import type { TieredPrice } from "./tiered-pricing.engine";

export type ConciergeNarrativeRequest = {
  resolvedIntent: ResolvedIntentState;
  candidate: RitualPathCandidate;
  price: TieredPrice;
};

export type ConciergeNarrative = {
  headline: string;
  whyThisPath: string;
  constraintTruth: string;
  tierStatement: string;
  confidenceStatement: string;
};

function topVectorLabel(vector: ResolvedIntentState["targetVector"]) {
  const entries = Object.entries(vector).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "biologicalTarget";
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export const createConciergeNarrative: SovereignAction<ConciergeNarrativeRequest, ConciergeNarrative> = async (_ctx, request) => {
  const { resolvedIntent, candidate, price } = request;
  const vectorFocus = topVectorLabel(resolvedIntent.targetVector);
  const alignment = formatPercent(candidate.score.alignmentScore);

  const headline = price.tier === "SOVEREIGN"
    ? "A complete route has been calibrated for your state."
    : price.tier === "SIGNATURE"
      ? "A precise ritual path has been selected."
      : "A restrained essential path is available.";

  const whyThisPath = `Your declared intent resolves most strongly toward ${vectorFocus}. This route matches the target vector with ${alignment} alignment while preserving biological restraint.`;

  const constraintTruth = candidate.score.loadPenalty === 0
    ? "No safety constraint was violated. Rest phases and sequence load remain inside the tenant guard envelope."
    : "This route carries load pressure and should be reviewed before confirmation.";

  const tierStatement = `${price.tier} is assigned because the path combines alignment ${formatPercent(price.explanation.alignmentScore)} with synergy ${price.explanation.synergyScore.toFixed(2)}.`;

  const confidenceStatement = resolvedIntent.status === "RESOLVED"
    ? `Intent confidence is ${formatPercent(resolvedIntent.confidenceScore)}.`
    : "The intent blend requires clarification before a final ritual path can be sealed.";

  return {
    headline,
    whyThisPath,
    constraintTruth,
    tierStatement,
    confidenceStatement,
  };
};
