import { useEffect, useState } from 'react';
import type { OptimizerPolicyProposal } from '../../types/optimizer-policy-approval';

interface Props {
  experimentId: string;
  actor: string;
  onSelectProposal?: (proposal: OptimizerPolicyProposal | null) => void;
}

export function OpsApprovalQueue({ experimentId, actor, onSelectProposal }: Props): JSX.Element {
  const [items, setItems] = useState<OptimizerPolicyProposal[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    try {
      const params = new URLSearchParams({ experimentId });
      const response = await fetch(`/api/optimizer/policy/approvals?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to load approvals (${response.status})`);
      }

      const json = (await response.json()) as { items: OptimizerPolicyProposal[] };
      setItems(json.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [experimentId]);

  async function approve(proposalId: string): Promise<void> {
    await fetch('/api/optimizer/policy/approvals/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, actor }),
    });

    await load();
  }

  async function reject(proposalId: string): Promise<void> {
    const reason = window.prompt('Rejection reason?');
    if (!reason) {
      return;
    }

    await fetch('/api/optimizer/policy/approvals/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, actor, reason }),
    });

    await load();
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Policy Approval Queue</h3>

      {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}

      {items.length === 0 ? (
        <div>No pending approvals.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Proposal</th>
              <th align="left">Changed Fields</th>
              <th align="left">Created</th>
              <th align="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.proposalId}>
                <td style={{ padding: '8px 0' }}>{item.proposalId.slice(0, 8)}</td>
                <td>{item.changedFields.join(', ') || '-'}</td>
                <td>{item.createdAt}</td>
                <td align="right">
                  <button
                    type="button"
                    onClick={() => onSelectProposal?.(item)}
                    style={{ marginRight: 8 }}
                  >
                    Preview
                  </button>
                  <button type="button" onClick={() => void approve(item.proposalId)}>
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void reject(item.proposalId)}
                    style={{ marginLeft: 8 }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
