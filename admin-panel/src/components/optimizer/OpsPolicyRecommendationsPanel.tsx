import { useCallback, useEffect, useState } from 'react';
import type { PolicyRecommenderResponse, CompileRecommendationResponse } from '../../types/optimizer-policy-recommender';
import { OpsPolicyRolloutPanel } from './OpsPolicyRolloutPanel';

interface Props {
  experimentId: string;
  hours?: number;
}

function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

export function OpsPolicyRecommendationsPanel({
  experimentId,
  hours = 24,
}: Props): JSX.Element {
  const [data, setData] = useState<PolicyRecommenderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resultById, setResultById] = useState<Record<string, { message: string, proposalId?: string }>>({});
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        experimentId,
        hours: String(hours),
      });

      const response = await fetch(
        `/api/optimizer/policy/recommendations?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load recommendations (${response.status})`);
      }

      const json = (await response.json()) as PolicyRecommenderResponse;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [experimentId, hours]);

  useEffect(() => {
    void load();
  }, [load]);

  const onApply = async (recommendationId: string) => {
    setBusyId(recommendationId);
    setErrorById((prev) => ({ ...prev, [recommendationId]: '' }));

    try {
      const response = await fetch('/api/optimizer/policy-recommender/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ experimentId, recommendationId }),
      });

      const data: CompileRecommendationResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to compile recommendation');
      }

      setResultById((prev) => ({
        ...prev,
        [recommendationId]: { 
          message: `Proposal oluşturuldu: #${data.proposal?.proposalId} (${data.proposal?.status})`,
          proposalId: data.proposal?.proposalId
        },
      }));

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown apply error';
      setErrorById((prev) => ({ ...prev, [recommendationId]: message }));
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return <div style={{ color: 'crimson' }}>{error}</div>;
  }

  if (!data) {
    return <div>Loading policy recommendations...</div>;
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
      <h3 style={{ marginTop: 0 }}>Counterfactual Policy Recommendations</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {data.recommendations.slice(0, 5).map((item, index) => (
          <div
            key={item.candidate.candidateId}
            style={{
              border: '1px solid #eee',
              borderRadius: 8,
              padding: 12,
              background: index === 0 ? '#f8fafc' : '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.candidate.label}</div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  {item.candidate.description}
                </div>
              </div>
              <div style={{ fontWeight: 700 }}>
                Score {item.score.overallScore.toFixed(2)}
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 14 }}>
              <div>Avg Portfolio Score Δ: {formatDelta(item.score.averagePortfolioScoreDelta)}</div>
              <div>Avg Risk Δ: {formatDelta(item.score.averageRiskDelta)}</div>
              <div>Improved Snapshots: {item.score.improvedScoreSnapshots}</div>
              <div>Reduced Risk Snapshots: {item.score.reducedRiskSnapshots}</div>
              <div>Stability: {item.score.stabilityScore.toFixed(2)}</div>
            </div>

            <div style={{ marginTop: 10, fontSize: 13 }}>
              <strong>Uygulanacak Değişiklikler:</strong>
              <ul style={{ paddingLeft: 20, marginTop: 4, fontFamily: 'monospace' }}>
                {item.candidate.patch.ops.map((op, idx) => (
                  <li key={idx}>
                    <span style={{color:'#666'}}>{op.path}:</span> {String(op.previousValue)} ➔ <strong>{String(op.value)}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <ul style={{ marginTop: 10, paddingLeft: 20, fontSize: 13, opacity: 0.8 }}>
              {item.rationale.map((reason, reasonIndex) => (
                <li key={reasonIndex}>{reason}</li>
              ))}
            </ul>

            <div style={{ marginTop: 16 }}>
              <button
                style={{
                  padding: '6px 12px',
                  background: busyId === item.candidate.candidateId ? '#ccc' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: busyId === item.candidate.candidateId ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
                onClick={() => onApply(item.candidate.candidateId)}
                disabled={busyId === item.candidate.candidateId}
              >
                {busyId === item.candidate.candidateId ? 'Derleniyor...' : '⚡ Bunu Uygula (Proposal)'}
              </button>
            </div>

            {resultById[item.candidate.candidateId] && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#059669', fontWeight: 500 }}>
                ✓ {resultById[item.candidate.candidateId].message}
                {resultById[item.candidate.candidateId].proposalId && (
                  <OpsPolicyRolloutPanel proposalId={resultById[item.candidate.candidateId].proposalId!} />
                )}
              </div>
            )}

            {errorById[item.candidate.candidateId] && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'crimson', fontWeight: 500 }}>
                ✕ {errorById[item.candidate.candidateId]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
