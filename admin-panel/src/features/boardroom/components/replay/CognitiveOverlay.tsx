import { useState, useEffect } from "react";
import type { BoardroomSnapshot, CognitiveDecisionEnvelope } from "../../types/boardroom.types";
import { fetchEnvelope } from "../../api/boardroom.service";
import { ConfidenceHeatmap } from "../overlays/ConfidenceHeatmap";
import { ReasoningChain } from "../overlays/ReasoningChain";
import { DecisionOutcomeDelta } from "../overlays/DecisionOutcomeDelta";
import { WhyThisMatteredPanel } from "../overlays/WhyThisMatteredPanel";

interface CognitiveOverlayProps {
  snapshot: BoardroomSnapshot;
}

type FetchState =
  | { status: "loading" }
  | { status: "success"; envelope: CognitiveDecisionEnvelope }
  | { status: "error"; message: string };

/**
 * Phase 83 — Boardroom Oracle Feed Hydration
 *
 * CognitiveOverlay artık backend'den gerçek veri alıyor.
 * deriveEnvelope() mock'u kaldırıldı.
 *
 * "Kernel karar verir, UI tanıklık eder."
 */
export function CognitiveOverlay({ snapshot }: CognitiveOverlayProps) {
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });

  const actionId = snapshot.resolvedActionId ?? snapshot.actionId ?? snapshot.id;

  useEffect(() => {
    if (!actionId) {
      setFetchState({
        status: "error",
        message: "No actionId available for this snapshot.",
      });
      return;
    }

    let cancelled = false;
    setFetchState({ status: "loading" });

    fetchEnvelope(actionId, snapshot.timestamp)
      .then((envelope) => {
        if (!cancelled) {
          setFetchState({ status: "success", envelope });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Oracle Feed unreachable.";
          console.warn("[CognitiveOverlay] fetchEnvelope failed — check ingestion-api:", message);
          setFetchState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [actionId, snapshot.timestamp]);

  return (
    <div className="nv-cognitive-overlay">
      <div className="nv-cognitive-overlay__header">
        <span className="nv-kicker">Phase 83 · Boardroom Oracle Feed</span>
        <h4>Decision Autopsy</h4>
        <p className="nv-cognitive-overlay__subtitle">
          Every governor decision is a verifiable artifact. The kernel produced this
          reasoning — the UI only witnesses.
        </p>
      </div>

      {fetchState.status === "loading" && (
        <div className="nv-cognitive-overlay__state">
          <div className="nv-spinner" />
          <p>Querying Boardroom Oracle Feed...</p>
        </div>
      )}

      {fetchState.status === "error" && (
        <div className="nv-cognitive-overlay__state nv-cognitive-overlay__state--error">
          <span className="nv-cognitive-overlay__error-icon">⚠</span>
          <p>{fetchState.message}</p>
          <span className="nv-cognitive-overlay__error-hint">
            Ensure ingestion-api is running on port 3030.
          </span>
        </div>
      )}

      {fetchState.status === "success" && (
        <>
          {/* ── Row 1: Confidence Heatmap ──────────── */}
          <ConfidenceHeatmap confidence={fetchState.envelope.confidence} />

          {/* ── Row 2: Reasoning Chain ─────────────── */}
          <ReasoningChain steps={fetchState.envelope.reasoning} />

          {/* ── Row 3: Outcome Delta ───────────────── */}
          <DecisionOutcomeDelta
            delta={fetchState.envelope.delta}
            resolutionType={snapshot.resolutionType}
          />

          {/* ── Row 4: Why This Mattered ───────────── */}
          <WhyThisMatteredPanel significance={fetchState.envelope.significance} />

          {/* ── Oracle provenance stamp ────────────── */}
          <div className="nv-oracle-stamp">
            <span>Oracle Feed</span>
            <span className="nv-oracle-stamp__id">
              {fetchState.envelope.actionId.slice(0, 10)}…
            </span>
            <span className="nv-oracle-stamp__time">
              {new Date(fetchState.envelope.generatedAt).toLocaleTimeString()}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
