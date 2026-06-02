import type React from 'react';
import type { OptimizerAnomaly } from '../../types/optimizer-ops-anomaly';

interface Props {
  anomalies: OptimizerAnomaly[];
}

export function OpsAnomalyBanner({ anomalies }: Props): React.JSX.Element | null {
  if (anomalies.length === 0) return null;

  return (
    <div style={{
      border: '1px solid red',
      background: 'var(--sovereign-dark)',
      padding: 12,
      borderRadius: 8
    }}>
      <strong>⚠ System Alerts</strong>

      <ul style={{ marginTop: 8 }}>
        {anomalies.map((a, i) => (
          <li key={i}>
            [{a.severity.toUpperCase()}] {a.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
