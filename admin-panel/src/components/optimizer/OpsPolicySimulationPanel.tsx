import { useEffect, useState } from 'react';
import type { OptimizerPolicyProposal } from '../../types/optimizer-policy-approval';
import type { PolicySimulationResponse } from '../../types/optimizer-policy-simulation';

interface Props {
  proposal: OptimizerPolicyProposal | null;
}

function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

export function OpsPolicySimulationPanel({ proposal }: Props): JSX.Element | null {
  const [data, setData] = useState<PolicySimulationResponse | null>(null);
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
        });

        const response = await fetch(
          `/api/optimizer/policy/simulate?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to simulate proposal (${response.status})`);
        }

        const json = (await response.json()) as PolicySimulationResponse;

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
  }, [proposal]);

  if (!proposal) {
    return (
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 10,
          padding: 16,
          background: '#fff',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Policy Simulation</h3>
        <div>Select a pending proposal to preview impact.</div>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'crimson' }}>{error}</div>;
  }

  if (!data) {
    return <div>Simulating proposal...</div>;
  }

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 10,
        padding: 16,
        background: '#fff',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Policy Simulation</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h4>Baseline</h4>
          <div>Selected: {data.baseline.selectedVariantIds.join(', ') || '-'}</div>
          <div>Allowed: {data.baseline.allowedVariantIds.join(', ') || '-'}</div>
          <div>Total Risk: {data.baseline.totalRiskScore}</div>
          <div>Total Score: {data.baseline.totalPortfolioScore}</div>
        </div>

        <div>
          <h4>Simulated</h4>
          <div>Selected: {data.simulated.selectedVariantIds.join(', ') || '-'}</div>
          <div>Allowed: {data.simulated.allowedVariantIds.join(', ') || '-'}</div>
          <div>Total Risk: {data.simulated.totalRiskScore}</div>
          <div>Total Score: {data.simulated.totalPortfolioScore}</div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Diff</h4>
        <div>Added Allowed: {data.diff.addedAllowedVariantIds.join(', ') || '-'}</div>
        <div>Removed Allowed: {data.diff.removedAllowedVariantIds.join(', ') || '-'}</div>
        <div>Added Selected: {data.diff.addedSelectedVariantIds.join(', ') || '-'}</div>
        <div>Removed Selected: {data.diff.removedSelectedVariantIds.join(', ') || '-'}</div>
        <div>Total Risk Δ: {formatDelta(data.diff.totalRiskDelta)}</div>
        <div>Total Score Δ: {formatDelta(data.diff.totalPortfolioScoreDelta)}</div>
      </div>
    </div>
  );
}
