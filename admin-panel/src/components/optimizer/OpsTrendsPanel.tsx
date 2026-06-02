import type React from 'react';
import { useEffect, useState } from 'react';
import type { OptimizerOpsTrendsResponse } from '../../types/optimizer-ops-trends';
import { OpsTrendLineChart } from './OpsTrendLineChart';
import { OpsTrendBarChart } from './OpsTrendBarChart';

interface Props {
  experimentId: string;
  hours?: number;
  refreshMs?: number;
}

function shortTime(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

export function OpsTrendsPanel({
  experimentId,
  hours = 1,
  refreshMs = 10000,
}: Props): React.JSX.Element {
  const [data, setData] = useState<OptimizerOpsTrendsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      try {
        const params = new URLSearchParams({
          experimentId,
          hours: String(hours),
        });

        const response = await fetch(`/api/optimizer/ops/trends?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to load trends (${response.status})`);
        }

        const json = (await response.json()) as OptimizerOpsTrendsResponse;

        if (mounted) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, refreshMs);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [experimentId, hours, refreshMs]);

  if (error) {
    return <div style={{ color: 'crimson' }}>{error}</div>;
  }

  if (!data) {
    return <div>Loading trends...</div>;
  }

  const latestBlockedReasons =
    data.blockedReasonPoints[data.blockedReasonPoints.length - 1]
      ?.blockedReasonCounts ?? {};

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <OpsTrendLineChart
          title="Exploration Rate Trend"
          points={data.points.map((point) => ({
            label: shortTime(point.timestamp),
            value: Number((point.explorationRate * 100).toFixed(2)),
          }))}
        />

        <OpsTrendLineChart
          title="Portfolio Risk Trend"
          points={data.points.map((point) => ({
            label: shortTime(point.timestamp),
            value: point.totalPortfolioRisk,
          }))}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <OpsTrendLineChart
          title="Allowed Candidates Trend"
          points={data.points.map((point) => ({
            label: shortTime(point.timestamp),
            value: point.allowedCandidates,
          }))}
        />

        <OpsTrendBarChart
          title="Latest Blocked Reason Mix"
          bars={Object.entries(latestBlockedReasons).map(([label, value]) => ({
            label,
            value,
          }))}
        />
      </div>
    </div>
  );
}
