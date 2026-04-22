import { useEffect, useState } from 'react';
import type { OptimizerOpsResponse } from '../../types/optimizer-ops';
import { OpsSummaryCards } from './OpsSummaryCards';
import { OpsBlockedReasonsChart } from './OpsBlockedReasonsChart';
import { OpsPortfolioPanel } from './OpsPortfolioPanel';
import { OpsBlockedCandidatesTable } from './OpsBlockedCandidatesTable';
import { OpsTrendsPanel } from './OpsTrendsPanel';
import { OpsAnomalyBanner } from './OpsAnomalyBanner';
import { OpsPolicyBanner } from './OpsPolicyBanner';
import { SovereignDashboard } from './SovereignDashboard';
import { OpsApprovalQueue } from './OpsApprovalQueue';
import { OpsPolicySimulationPanel } from './OpsPolicySimulationPanel';
import { OpsPolicyBacktestPanel } from './OpsPolicyBacktestPanel';
import { OpsPolicyRecommendationsPanel } from './OpsPolicyRecommendationsPanel';
import type { OptimizerAnomaly, OptimizerOpsAnomaliesResponse } from '../../types/optimizer-ops-anomaly';
import type { OptimizerPolicyResponse } from '../../types/optimizer-policy';
import type { OptimizerPolicyProposal } from '../../types/optimizer-policy-approval';

interface Props {
  experimentId: string;
  requestId?: string;
  refreshMs?: number;
}

export function OpsDashboard({
  experimentId,
  requestId,
  refreshMs = 10000,
}: Props): JSX.Element {
  const [data, setData] = useState<OptimizerOpsResponse | null>(null);
  const [anomalies, setAnomalies] = useState<OptimizerAnomaly[]>([]);
  const [policy, setPolicy] = useState<OptimizerPolicyResponse | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<OptimizerPolicyProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      try {
        const params = new URLSearchParams({ experimentId });
        if (requestId) {
          params.set('requestId', requestId);
        }

        const response = await fetch(`/api/optimizer/ops?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to load optimizer ops data (${response.status})`);
        }

        const json = (await response.json()) as OptimizerOpsResponse;

        let fetchedAnomalies: OptimizerAnomaly[] = [];
        try {
          const anomaliesResponse = await fetch(`/api/optimizer/ops/anomalies?${params.toString()}`);
          if (anomaliesResponse.ok) {
            const anomaliesJson = (await anomaliesResponse.json()) as OptimizerOpsAnomaliesResponse;
            fetchedAnomalies = anomaliesJson.anomalies || [];
          }
        } catch (e) {
          console.error("Failed to fetch anomalies", e);
        }

        let fetchedPolicy: OptimizerPolicyResponse | null = null;
        try {
          const policyResponse = await fetch(`/api/optimizer/policy?experimentId=${encodeURIComponent(experimentId)}`);
          if (policyResponse.ok) {
            fetchedPolicy = (await policyResponse.json()) as OptimizerPolicyResponse;
          }
        } catch (e) {
          console.error("Failed to fetch policy", e);
        }

        if (mounted) {
          setData(json);
          setAnomalies(fetchedAnomalies);
          setPolicy(fetchedPolicy);
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
  }, [experimentId, requestId, refreshMs]);

  if (error) {
    return <div style={{ color: 'crimson' }}>{error}</div>;
  }

  if (!data) {
    return <div>Loading optimizer telemetry...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>Optimizer Ops Dashboard</h2>
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          Experiment: {data.experimentId} · Request: {data.requestId} · Generated: {data.generatedAt}
        </div>
      </div>

      <OpsPolicyBanner data={policy} />
      <SovereignDashboard />
      
      <OpsPolicyRecommendationsPanel experimentId={experimentId} hours={24} />

      <OpsApprovalQueue 
        experimentId={experimentId} 
        actor="boardroom.operator" 
        onSelectProposal={setSelectedProposal}
      />

      <OpsPolicySimulationPanel proposal={selectedProposal} />
      <OpsPolicyBacktestPanel proposal={selectedProposal} hours={24} />

      <OpsAnomalyBanner anomalies={anomalies} />

      <OpsSummaryCards data={data} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <OpsBlockedReasonsChart data={data} />
        <OpsPortfolioPanel data={data} />
      </div>

      <OpsBlockedCandidatesTable data={data} />

      <OpsTrendsPanel experimentId={experimentId} hours={1} refreshMs={5000} />
    </div>
  );
}
