import type React from 'react';
import { useEffect, useState } from 'react';
import type { OptimizerPolicyProposal } from '../../types/optimizer-policy-approval';
import type { PolicyBacktestResponse } from '../../types/optimizer-policy-backtest';

interface Props {
  proposal: OptimizerPolicyProposal | null;
  hours?: number;
}

function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

export function OpsPolicyBacktestPanel({
  proposal,
  hours = 24,
}: Props): React.JSX.Element | null {
  const [data, setData] = useState<PolicyBacktestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      if (!proposal) {
        setData(null);
        return;
      }

      try {
        const params = new URLSearchParams({
          proposalId: proposal.proposalId,
          hours: String(hours),
        });

        const response = await fetch(
          `/api/optimizer/policy/backtest?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to backtest proposal (${response.status})`);
        }

        const json = (await response.json()) as PolicyBacktestResponse;

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

    return () => {
      mounted = false;
    };
  }, [proposal, hours]);

  if (!proposal) {
    return null;
  }

  if (error) {
    return <div style={{ color: 'crimson' }}>{error}</div>;
  }

  if (!data) {
    return <div>Running backtest...</div>;
  }

  return (
    <div
      style={{
        border: '1px solid var(--sovereign-neutral-300)',
        borderRadius: 10,
        padding: 16,
        background: 'var(--sovereign-surface)',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Policy Backtest</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Snapshots</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{data.summary.totalSnapshots}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Avg Score Δ</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {formatDelta(data.summary.averagePortfolioScoreDelta)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Avg Risk Δ</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {formatDelta(data.summary.averageRiskDelta)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 14 }}>
        <div>Improved score snapshots: {data.summary.improvedScoreSnapshots}</div>
        <div>Worsened score snapshots: {data.summary.worsenedScoreSnapshots}</div>
        <div>Reduced risk snapshots: {data.summary.reducedRiskSnapshots}</div>
        <div>Increased risk snapshots: {data.summary.increasedRiskSnapshots}</div>
      </div>

      <div style={{ marginTop: 16, fontSize: 14 }}>
        <div>
          Most frequently added selected variants:{' '}
          {data.summary.mostFrequentlyAddedSelectedVariantIds.join(', ') || '-'}
        </div>
        <div>
          Most frequently removed selected variants:{' '}
          {data.summary.mostFrequentlyRemovedSelectedVariantIds.join(', ') || '-'}
        </div>
      </div>
    </div>
  );
}
