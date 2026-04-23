import type { OptimizerPolicyResponse } from '../../types/optimizer-policy';

interface Props {
  data: OptimizerPolicyResponse | null;
}

export function OpsPolicyBanner({ data }: Props): JSX.Element | null {
  if (!data) {
    return null;
  }

  const isMitigated = data.policy.source === 'auto_mitigated';

  return (
    <div
      style={{
        border: `1px solid ${isMitigated ? 'var(--sovereign-warning)' : 'var(--sovereign-neutral-300)'}`,
        background: isMitigated ? 'var(--sovereign-surface)' : 'var(--sovereign-dark)',
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        {isMitigated ? '🛡️ Auto-Mitigation Active' : '✅ Default Policy Active'}
      </div>

      <div style={{ fontSize: 14, marginBottom: 8 }}>
        Source: <strong>{data.policy.source}</strong>
        {data.policy.reason ? <> · Reason: <strong>{data.policy.reason}</strong></> : null}
      </div>

      <div style={{ fontSize: 13, opacity: 0.85 }}>
        Risk Ceiling: {data.policy.maxRiskScoreAllowed} ·
        Portfolio Risk: {data.policy.maxTotalRiskScore} ·
        Exploration Bonus: {data.policy.maxExplorationBonus.toFixed(2)} ·
        Min Learned Weight: {data.policy.minLearnedWeightForExploration.toFixed(2)}
      </div>

      {data.latestAudit ? (
        <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75 }}>
          Last policy change: {data.latestAudit.evaluatedAt} · Fields: {data.latestAudit.changedFields.join(', ') || '-'}
        </div>
      ) : null}
    </div>
  );
}
