import { AuditLogEntry } from "../types/boardroom.types";

interface BoardroomTimelineProps {
  entries: AuditLogEntry[];
  selectedAuditId: string | null;
  onInspect: (entry: AuditLogEntry) => void;
}

export function BoardroomTimeline({
  entries,
  selectedAuditId,
  onInspect,
}: BoardroomTimelineProps) {
  return (
    <div className="nv-timeline">
      <div className="nv-timeline__scroll">
        {entries.length === 0 ? (
          <div className="nv-timeline__empty">No audit records found.</div>
        ) : (
          entries.map((entry) => (
            <TimelineCard
              key={entry.id}
              entry={entry}
              isSelected={entry.id === selectedAuditId}
              onClick={() => onInspect(entry)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TimelineCardProps {
  entry: AuditLogEntry;
  isSelected: boolean;
  onClick: () => void;
}

function TimelineCard({ entry, isSelected, onClick }: TimelineCardProps) {
  const isApproved = entry.type === "action.approved";
  const date = new Date(entry.occurredAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={`nv-timeline-card ${isSelected ? "nv-timeline-card--selected" : ""}`}
      onClick={onClick}
    >
      <div className="nv-timeline-card__meta">
        <span className="nv-timeline-card__time">{date}</span>
        <span
          className={`nv-timeline-card__type ${
            isApproved ? "nv-timeline-card__type--approved" : "nv-timeline-card__type--rejected"
          }`}
        >
          {isApproved ? "APPROVED" : "REJECTED"}
        </span>
      </div>
      <div className="nv-timeline-card__title">
        {entry.payload?.actionTitle || "System Resolution"}
      </div>
      <div className="nv-timeline-card__reason">
        {entry.reason || "Automatic trigger evaluation."}
      </div>
    </div>
  );
}
