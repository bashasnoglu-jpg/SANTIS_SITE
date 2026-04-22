import type { OptimizerOpsResponse } from '../../types/optimizer-ops';

interface Props {
  data: OptimizerOpsResponse;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function OpsSummaryCards({ data }: Props): JSX.Element {
  const cards = [
    {
      label: 'Total Candidates',
      value: String(data.telemetry.totalCandidates),
    },
    {
      label: 'Allowed Candidates',
      value: String(data.telemetry.allowedCandidates),
    },
    {
      label: 'Blocked Candidates',
      value: String(data.telemetry.blockedCandidates),
    },
    {
      label: 'Exploration Rate',
      value: formatPercent(data.telemetry.explorationRate),
    },
    {
      label: 'Selected Slate Size',
      value: String(data.portfolio.summary.selectedCount),
    },
    {
      label: 'Total Portfolio Risk',
      value: String(data.portfolio.summary.totalRiskScore),
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 16,
            background: '#fff',
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>{card.label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
