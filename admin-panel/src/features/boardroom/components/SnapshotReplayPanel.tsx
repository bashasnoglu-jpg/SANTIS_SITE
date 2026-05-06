import { BoardroomSnapshot, BoardroomMode } from "../types/boardroom.types";

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
      <div className="nv-replay-panel__header">
        <h3>Snapshot: {snapshot.snapshotId || "N/A"}</h3>
        <span className="nv-replay-panel__timestamp">
          {new Date(snapshot.timestamp).toLocaleString()}
        </span>
      </div>

      <div className="nv-replay-panel__metrics">
        <div className="nv-metric-card">
          <span className="nv-metric-card__label">Revenue</span>
          <span className="nv-metric-card__value">
            ${snapshot.revenue.toLocaleString()}
          </span>
        </div>
        <div className="nv-metric-card">
          <span className="nv-metric-card__label">Active Sessions</span>
          <span className="nv-metric-card__value">
            {snapshot.activeSessionsCount}
          </span>
        </div>
      </div>

      <GovernorReasoningPanel snapshot={snapshot} />
    </div>
  );
}

function GovernorReasoningPanel({ snapshot }: { snapshot: BoardroomSnapshot }) {
  const confidence = snapshot.confidence || 0.85;
  const isHighConfidence = confidence > 0.8;

  return (
    <div className="nv-governor-panel">
      <header className="nv-governor-panel__header">
        <h4>Cognitive Governor Reasoning</h4>
        <div className="nv-confidence">
          <span className="nv-confidence__label">Confidence</span>
          <span className={`nv-confidence__value ${isHighConfidence ? "nv-text--gold" : "nv-text--warn"}`}>
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
      </header>

      <div className="nv-governor-panel__content">
        <div className="nv-reasoning-block">
          <h5>Resolution Intent</h5>
          <p>{snapshot.reasoning || "The system identified a deviation from the equilibrium point and proposed corrective measures based on demand elasticity."}</p>
        </div>

        <div className="nv-reasoning-meta">
          <div>
            <strong>Resolution:</strong> {snapshot.resolutionType || "Approved"}
          </div>
          <div>
            <strong>Linked Action:</strong> {snapshot.resolvedActionId || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
