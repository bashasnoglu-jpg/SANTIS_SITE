import type { OptimizerOpsResponse } from '../../types/optimizer-ops';

interface Props {
  data: OptimizerOpsResponse;
}

export function OpsBlockedCandidatesTable({ data }: Props): JSX.Element {
  return (
    <div style={{ border: '1px solid var(--sovereign-neutral-300)', borderRadius: 10, padding: 16, background: 'var(--sovereign-surface)' }}>
      <h3 style={{ marginTop: 0 }}>Blocked Candidates</h3>

      {data.blockedCandidates.length === 0 ? (
        <div>No blocked candidates.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Variant</th>
              <th align="left">Family</th>
              <th align="right">Score</th>
              <th align="left">Reasons</th>
            </tr>
          </thead>
          <tbody>
            {data.blockedCandidates.map((item) => (
              <tr key={item.recommendationId}>
                <td style={{ padding: '8px 0' }}>{item.variantId}</td>
                <td>{item.recommendationFamily}</td>
                <td align="right">{item.finalBanditScore.toFixed(2)}</td>
                <td>{item.blockedReasons.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
