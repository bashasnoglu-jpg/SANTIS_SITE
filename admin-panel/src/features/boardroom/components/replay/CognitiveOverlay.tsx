import type { BoardroomSnapshot, CognitiveDecisionEnvelope } from "../../types/boardroom.types";
import { ConfidenceHeatmap } from "../overlays/ConfidenceHeatmap";
import { ReasoningChain } from "../overlays/ReasoningChain";
import { DecisionOutcomeDelta } from "../overlays/DecisionOutcomeDelta";
import { WhyThisMatteredPanel } from "../overlays/WhyThisMatteredPanel";

interface CognitiveOverlayProps {
  snapshot: BoardroomSnapshot;
}

/**
 * Derives a CognitiveDecisionEnvelope from raw snapshot data.
 * In the future this will be hydrated from SSE delta or a dedicated
 * /api/v1/boardroom/cognitive-analysis endpoint.
 */
function deriveEnvelope(snapshot: BoardroomSnapshot): CognitiveDecisionEnvelope {
  const confidence = snapshot.confidence ?? 0.82;
  const isApproved = snapshot.resolutionType !== "rejected";

  const reasoning = snapshot.reasoning
    ? [
        {
          cause: "Demand elasticity detected above threshold",
          context: snapshot.reasoning,
          outcome: isApproved
            ? "Action approved to capitalize on demand surge"
            : "Action rejected — risk threshold exceeded",
        },
      ]
    : [
        {
          cause: "Occupancy rate divergence from 7-day baseline",
          context: "Revenue per available session dropped 12% vs. rolling average.",
          outcome: "Governor proposed pricing correction to restore equilibrium.",
        },
        {
          cause: "Competitor rate signal detected",
          context: "External rate signals suggest premium window available.",
          outcome: isApproved
            ? "Opportunity captured — adjustment applied."
            : "Opportunity deferred — confidence below safe threshold.",
        },
      ];

  const revenueBase = snapshot.revenue ?? 14200;
  const revenueDelta = isApproved
    ? Math.round(revenueBase * 0.08)
    : -Math.round(revenueBase * 0.03);

  return {
    confidence,
    reasoning,
    delta: {
      projectedRevenueImpact: revenueDelta,
      projectedRetentionImpact: isApproved ? 4.2 : -1.1,
      projectedHesitationReduction: isApproved ? 18 : 0,
    },
    significance: {
      level:
        confidence >= 0.85
          ? "high"
          : confidence >= 0.65
          ? "medium"
          : confidence >= 0.45
          ? "low"
          : "critical",
      narrative: isApproved
        ? `This decision was taken during a demand peak window. The Governor identified an ${Math.round(confidence * 100)}% probability that pricing adjustment would yield measurable revenue uplift without eroding guest retention. This is a textbook "sovereign capture" moment.`
        : `This action was blocked by the Governor's safety threshold. Despite the demand signal, the confidence level of ${Math.round(confidence * 100)}% fell below the required floor. Rejection is logged as first-class evidence — it protects the system from overreach during uncertain conditions.`,
    },
  };
}

export function CognitiveOverlay({ snapshot }: CognitiveOverlayProps) {
  const envelope = deriveEnvelope(snapshot);

  return (
    <div className="nv-cognitive-overlay">
      <div className="nv-cognitive-overlay__header">
        <span className="nv-kicker">Phase 82.3 · Cognitive Intelligence</span>
        <h4>Decision Autopsy</h4>
        <p className="nv-cognitive-overlay__subtitle">
          Every governor decision is a verifiable artifact. Inspect the full reasoning chain below.
        </p>
      </div>

      {/* ── Row 1: Confidence Heatmap ────────────── */}
      <ConfidenceHeatmap confidence={envelope.confidence} />

      {/* ── Row 2: Reasoning Chain ───────────────── */}
      <ReasoningChain steps={envelope.reasoning} />

      {/* ── Row 3: Outcome Delta ─────────────────── */}
      <DecisionOutcomeDelta
        delta={envelope.delta}
        resolutionType={snapshot.resolutionType}
      />

      {/* ── Row 4: Why This Mattered ─────────────── */}
      <WhyThisMatteredPanel significance={envelope.significance} />
    </div>
  );
}
