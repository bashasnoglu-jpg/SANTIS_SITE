import { BoardroomSnapshot, BoardroomMode } from "../../types/boardroom.types";
import { CognitiveOverlay } from "./CognitiveOverlay";

interface SnapshotReplayPanelProps {
  mode: BoardroomMode;
  snapshot: BoardroomSnapshot | null;
  isLoading: boolean;
}

export function SnapshotReplayPanel({
  mode,
  snapshot,
  isLoading,
}: SnapshotReplayPanelProps) {
  if (mode === "LIVE") {
    return (
      <div className="nv-replay-panel nv-replay-panel--live">
        <div className="nv-replay-panel__placeholder">
          <div className="nv-spinner-pulse"></div>
          <p>Monitoring live cognitive stream...</p>
          <span className="nv-replay-panel__hint">
            Select an audit event to enter Historical Mode and inspect a decision.
          </span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="nv-replay-panel nv-replay-panel--loading">
        <div className="nv-replay-panel__placeholder">
          <div className="nv-spinner"></div>
          <p>Reconstructing snapshot memory...</p>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="nv-replay-panel">
        <div className="nv-replay-panel__placeholder">
          <p>Select an event to reconstruct the state.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nv-replay-panel nv-replay-panel--historical">
      {/* ── Snapshot Header Metrics ───────────────── */}
      <div className="nv-replay-panel__header">
        <div>
          <span className="nv-kicker">Reconstructed State</span>
          <h3>{snapshot.snapshotId?.slice(0, 12) ?? "Snapshot"}</h3>
        </div>
        <span className="nv-replay-panel__timestamp">
          {new Date(snapshot.timestamp).toLocaleString()}
        </span>
      </div>

      <div className="nv-replay-panel__metrics">
        <div className="nv-metric-card">
          <span className="nv-metric-card__label">Revenue at Snapshot</span>
          <span className="nv-metric-card__value">
            ${snapshot.revenue?.toLocaleString() ?? "—"}
          </span>
        </div>
        <div className="nv-metric-card">
          <span className="nv-metric-card__label">Active Sessions</span>
          <span className="nv-metric-card__value">
            {snapshot.activeSessionsCount ?? "—"}
          </span>
        </div>
      </div>

      {/* ── Phase 82.3: Cognitive Overlay ─────────── */}
      <CognitiveOverlay snapshot={snapshot} />
    </div>
  );
}
