import type { OptimizerOpsResponse } from '../../types/optimizer-ops';

interface Props {
  data: OptimizerOpsResponse;
}

export function OpsPortfolioPanel({ data }: Props): JSX.Element {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Selected Portfolio</h3>

      <div style={{ marginBottom: 12, fontSize: 14 }}>
        <div><strong>Total Score:</strong> {data.portfolio.summary.totalPortfolioScore}</div>
        <div><strong>Total Risk:</strong> {data.portfolio.summary.totalRiskScore}</div>
        <div><strong>Families:</strong> {Object.keys(data.portfolio.summary.familyCounts).join(', ') || '-'}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Variant</th>
            <th align="left">Family</th>
            <th align="right">Bandit Score</th>
            <th align="right">Marginal Gain</th>
            <th align="right">Cum. Risk</th>
          </tr>
        </thead>
        <tbody>
          {data.portfolio.selected.map((item) => (
            <tr key={item.recommendationId}>
              <td style={{ padding: '8px 0' }}>{item.variantId}</td>
              <td>{item.recommendationFamily}</td>
              <td align="right">{item.finalBanditScore.toFixed(2)}</td>
              <td align="right">{item.marginalGain.toFixed(2)}</td>
              <td align="right">{item.cumulativeRiskScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
