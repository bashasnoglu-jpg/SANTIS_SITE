import { BoardroomTimeline } from "./BoardroomTimeline";
import { SnapshotReplayPanel } from "./replay/SnapshotReplayPanel";
import { useBoardroomChronos } from "../hooks/useBoardroomChronos";
import "../../../styles/boardroom-chronos.css";

export function BoardroomChronos() {
  const {
    mode,
    isHistorical,
    timeline,
    selectedAuditId,
    selectedSnapshot,
    isLoadingSnapshot,
    inspectAudit,
    goLive,
  } = useBoardroomChronos();

  return (
    <section
      className={isHistorical ? "nv-chronos nv-historical-mode" : "nv-chronos"}
      aria-label="Boardroom cognitive timeline"
      data-mode={mode}
    >
      <header className="nv-chronos__header">
        <div>
          <span className="nv-kicker">Sovereign Memory</span>
          <h2>Chronos & Logic</h2>
        </div>

        <div className="nv-chronos__status">
          <span className={isHistorical ? "nv-badge nv-badge--history" : "nv-badge nv-badge--live"}>
            {isHistorical ? "HISTORY" : "LIVE"}
          </span>

          {isHistorical && (
            <button type="button" className="nv-go-live" onClick={goLive}>
              Go Live
            </button>
          )}
        </div>
      </header>

      <div className="nv-chronos__grid">
        <BoardroomTimeline
          entries={timeline}
          selectedAuditId={selectedAuditId}
          onInspect={inspectAudit}
        />

        <SnapshotReplayPanel
          mode={mode}
          snapshot={selectedSnapshot}
          isLoading={isLoadingSnapshot}
        />
      </div>
    </section>
  );
}
