import type { OptimizerOpsResponse } from '../../types/optimizer-ops';

interface Props {
  data: OptimizerOpsResponse;
}

export function OpsBlockedReasonsChart({ data }: Props): JSX.Element {
  const entries = Object.entries(data.telemetry.blockedReasonCounts);
  const maxValue = Math.max(1, ...entries.map(([, count]) => count));

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Blocked Reasons</h3>

      {entries.length === 0 ? (
        <div>No blocked reasons in current snapshot.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {entries.map(([reason, count]) => (
            <div key={reason}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{reason}</span>
                <strong>{count}</strong>
              </div>
              <div style={{ height: 10, background: '#eee', borderRadius: 999 }}>
                <div
                  style={{
                    width: `${(count / maxValue) * 100}%`,
                    height: '100%',
                    background: '#222',
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
