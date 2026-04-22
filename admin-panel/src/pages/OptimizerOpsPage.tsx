import { useState } from 'react';
import { OpsDashboard } from '../components/optimizer/OpsDashboard';

export default function OptimizerOpsPage(): JSX.Element {
  const [experimentId, setExperimentId] = useState('exp_demo');
  const [requestId, setRequestId] = useState('');

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div>
        <h1 style={{ marginBottom: 8 }}>Optimizer Boardroom</h1>
        <div style={{ fontSize: 14, opacity: 0.7 }}>
          Real-time telemetry for constraint-aware portfolio decisions.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Experiment ID</span>
          <input
            value={experimentId}
            onChange={(event) => setExperimentId(event.target.value)}
            placeholder="exp_demo"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Request ID (optional)</span>
          <input
            value={requestId}
            onChange={(event) => setRequestId(event.target.value)}
            placeholder="req_123"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </label>

        <button
          type="button"
          onClick={async () => {
            await fetch('/api/optimizer/ops/seed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                experimentId,
              }),
            });
          }}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #222',
            background: '#222',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Seed Demo Snapshot
        </button>
      </div>

      <OpsDashboard
        experimentId={experimentId}
        requestId={requestId || undefined}
        refreshMs={5000}
      />
    </div>
  );
}
