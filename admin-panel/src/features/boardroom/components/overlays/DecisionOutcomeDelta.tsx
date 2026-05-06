import type { CognitiveDecisionDelta } from "../../types/boardroom.types";

interface DecisionOutcomeDeltaProps {
  delta: CognitiveDecisionDelta;
  resolutionType?: string;
}

function DeltaRow({
  label,
  value,
  unit,
  positive,
}: {
  label: string;
  value: number;
  unit: string;
  positive: boolean;
}) {
  const isPositive = positive ? value >= 0 : value <= 0;
  const color = isPositive ? "#d4af37" : "#e05c5c";
  const sign = value >= 0 ? "+" : "";

  return (
    <div className="nv-delta-row">
      <span className="nv-delta-row__label">{label}</span>
      <div className="nv-delta-row__bar-wrap">
        <div
          className="nv-delta-row__bar"
          style={{
            width: `${Math.min(Math.abs(value), 100)}%`,
            background: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
      <span className="nv-delta-row__value" style={{ color }}>
        {sign}{value}{unit}
      </span>
    </div>
  );
}

export function DecisionOutcomeDelta({ delta, resolutionType }: DecisionOutcomeDeltaProps) {
  const isApproved = resolutionType !== "rejected";

  return (
    <div className="nv-outcome-delta">
      <div className="nv-outcome-delta__header">
        <h5 className="nv-outcome-delta__title">DECISION OUTCOME DELTA</h5>
        <span
          className="nv-outcome-delta__resolution"
          style={{ color: isApproved ? "#7fffd4" : "#e05c5c" }}
        >
          {isApproved ? "▲ APPROVED" : "▼ REJECTED"}
        </span>
      </div>

      <div className="nv-outcome-delta__rows">
        <DeltaRow
          label="Revenue Impact"
          value={delta.projectedRevenueImpact}
          unit="€"
          positive={true}
        />
        <DeltaRow
          label="Retention"
          value={delta.projectedRetentionImpact}
          unit="%"
          positive={true}
        />
        <DeltaRow
          label="Hesitation Reduction"
          value={delta.projectedHesitationReduction}
          unit="%"
          positive={true}
        />
      </div>
    </div>
  );
}
