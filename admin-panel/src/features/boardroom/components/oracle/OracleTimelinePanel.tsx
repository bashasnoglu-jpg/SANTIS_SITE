import { useLiveOracle, useOracleTimeline } from "../hooks";
import type { OracleDeltaPatch } from "../hooks/useLiveOracle";

// ── Connection Status Badge ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  connected: { color: "#7fffd4", label: "LIVE", pulse: true },
  connecting: { color: "#f0c040", label: "CONNECTING", pulse: true },
  gap_detected: { color: "#e8964a", label: "GAP", pulse: false },
  error: { color: "#e05c5c", label: "ERROR", pulse: false },
  offline: { color: "rgba(255,255,255,0.3)", label: "OFFLINE", pulse: false },
} as const;

// ── Confidence Sparkline ──────────────────────────────────────────────────────
function ConfidenceSparkline({ patches }: { patches: OracleDeltaPatch[] }) {
  if (patches.length < 2) return null;

  const width = 200;
  const height = 36;
  const values = patches.map((p) => p.envelope.confidence);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 0.01;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const lastConf = values[values.length - 1];
  const trend = values.length > 1 ? lastConf - values[values.length - 2] : 0;
  const trendColor = trend >= 0 ? "#d4af37" : "#e05c5c";

  return (
    <div className="nv-oracle-sparkline">
      <span className="nv-oracle-sparkline__label">CONFIDENCE TREND</span>
      <svg width={width} height={height} className="nv-oracle-sparkline__svg">
        <polyline
          points={points}
          fill="none"
          stroke={trendColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Last point dot */}
        <circle
          cx={(width)}
          cy={height - ((lastConf - min) / range) * (height - 4) - 2}
          r="3"
          fill={trendColor}
        />
      </svg>
      <span className="nv-oracle-sparkline__value" style={{ color: trendColor }}>
        {trend >= 0 ? "▲" : "▼"} {Math.round(lastConf * 100)}%
      </span>
    </div>
  );
}

// ── Timeline Scrubber ─────────────────────────────────────────────────────────
interface TimelineScrubberProps {
  firstSeq: number | null;
  lastSeq: number | null;
  scrubPosition: number | null;
  isScrubbing: boolean;
  onScrubToSeq: (seq: number) => void;
  onExit: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
}

function TimelineScrubber({
  firstSeq, lastSeq, scrubPosition, isScrubbing,
  onScrubToSeq, onExit, onStepBack, onStepForward,
}: TimelineScrubberProps) {
  if (firstSeq === null || lastSeq === null || firstSeq === lastSeq) return null;

  const position = scrubPosition ?? lastSeq;
  const pct = ((position - firstSeq) / (lastSeq - firstSeq)) * 100;

  return (
    <div className={`nv-oracle-scrubber ${isScrubbing ? "nv-oracle-scrubber--active" : ""}`}>
      <div className="nv-oracle-scrubber__controls">
        <button className="nv-oracle-scrubber__btn" onClick={onStepBack} title="Step back">‹</button>

        <div className="nv-oracle-scrubber__track">
          <div className="nv-oracle-scrubber__fill" style={{ width: `${pct}%` }} />
          <input
            type="range"
            min={firstSeq}
            max={lastSeq}
            value={position}
            onChange={(e) => onScrubToSeq(Number(e.target.value))}
            className="nv-oracle-scrubber__range"
          />
        </div>

        <button className="nv-oracle-scrubber__btn" onClick={onStepForward} title="Step forward">›</button>

        {isScrubbing && (
          <button className="nv-oracle-scrubber__live-btn" onClick={onExit}>
            ● LIVE
          </button>
        )}
      </div>

      <div className="nv-oracle-scrubber__meta">
        <span>seq {position}</span>
        {isScrubbing && <span className="nv-oracle-scrubber__frozen">⏸ SCRUBBING</span>}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function OracleTimelinePanel() {
  const { latestDelta, connectionStatus, deltaCount, droppedCount, sequenceLog, lastSeq } =
    useLiveOracle();

  const {
    viewedPatch, isScrubbing, scrubPosition, firstSeq, lastSeq: timelineLastSeq,
    scrubToSeq, exitScrub, stepBack, stepForward,
  } = useOracleTimeline(sequenceLog, latestDelta);

  const statusCfg = STATUS_CONFIG[connectionStatus] ?? STATUS_CONFIG.offline;

  return (
    <div className="nv-oracle-timeline-panel">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="nv-oracle-timeline-panel__header">
        <div className="nv-oracle-timeline-panel__title">
          <span className="nv-kicker">Phase 84.1 · Replay-Safe Oracle</span>
          <h4>Oracle Timeline</h4>
        </div>

        <div className="nv-oracle-status">
          <div
            className={`nv-oracle-status__dot ${statusCfg.pulse ? "nv-pulse" : ""}`}
            style={{ background: statusCfg.color }}
          />
          <span style={{ color: statusCfg.color }}>{statusCfg.label}</span>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────── */}
      <div className="nv-oracle-timeline-panel__stats">
        <div className="nv-oracle-stat">
          <span className="nv-oracle-stat__label">Deltas</span>
          <span className="nv-oracle-stat__value">{deltaCount}</span>
        </div>
        <div className="nv-oracle-stat">
          <span className="nv-oracle-stat__label">Dropped</span>
          <span className="nv-oracle-stat__value" style={{ color: droppedCount > 0 ? "#e05c5c" : undefined }}>
            {droppedCount}
          </span>
        </div>
        <div className="nv-oracle-stat">
          <span className="nv-oracle-stat__label">Last Seq</span>
          <span className="nv-oracle-stat__value">{lastSeq}</span>
        </div>
        <div className="nv-oracle-stat">
          <span className="nv-oracle-stat__label">Buffer</span>
          <span className="nv-oracle-stat__value">{sequenceLog.length}</span>
        </div>
      </div>

      {/* ── Confidence Sparkline ────────────────────────── */}
      {sequenceLog.length > 1 && (
        <ConfidenceSparkline patches={sequenceLog} />
      )}

      {/* ── Timeline Scrubber ────────────────────────────── */}
      <TimelineScrubber
        firstSeq={firstSeq}
        lastSeq={timelineLastSeq}
        scrubPosition={scrubPosition}
        isScrubbing={isScrubbing}
        onScrubToSeq={scrubToSeq}
        onExit={exitScrub}
        onStepBack={stepBack}
        onStepForward={stepForward}
      />

      {/* ── Viewed Patch Summary ─────────────────────────── */}
      {viewedPatch && (
        <div className="nv-oracle-patch-card">
          <div className="nv-oracle-patch-card__header">
            <span className="nv-oracle-patch-card__label">
              {isScrubbing ? `⏸ Seq ${viewedPatch.seq}` : "● Live"}
            </span>
            <span className="nv-oracle-patch-card__id">
              {viewedPatch.actionId.slice(0, 10)}…
            </span>
          </div>
          <div className="nv-oracle-patch-card__confidence">
            <span>Confidence</span>
            <strong style={{ color: "#d4af37" }}>
              {Math.round(viewedPatch.envelope.confidence * 100)}%
            </strong>
          </div>
          <p className="nv-oracle-patch-card__narrative">
            {viewedPatch.envelope.significance.narrative.slice(0, 120)}…
          </p>
        </div>
      )}

      {sequenceLog.length === 0 && (
        <div className="nv-oracle-timeline-panel__empty">
          <div className="nv-spinner-pulse" />
          <p>Awaiting first Oracle delta…</p>
        </div>
      )}
    </div>
  );
}
