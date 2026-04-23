import { chartTheme } from '../../../../packages/design-system/chart-theme';

interface Point {
  label: string;
  value: number;
}

interface Props {
  title: string;
  points: Point[];
  height?: number;
}

export function OpsTrendLineChart({
  title,
  points,
  height = 180,
}: Props): JSX.Element {
  const width = 600;
  const padding = 24;

  const values = points.map((point) => point.value);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);

  const xStep =
    points.length > 1
      ? (width - padding * 2) / (points.length - 1)
      : 0;

  const toY = (value: number): number => {
    const range = max - min || 1;
    return height - padding - ((value - min) / range) * (height - padding * 2);
  };

  const d = points
    .map((point, index) => {
      const x = padding + index * xStep;
      const y = toY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div style={{ border: `1px solid ${chartTheme.grid}`, borderRadius: 10, padding: 16, background: chartTheme.surface }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {points.length === 0 ? (
        <div>No trend data.</div>
      ) : (
        <>
          <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
            <path d={d} fill="none" stroke={chartTheme.primaryStrong} strokeWidth="2" />
            {points.map((point, index) => {
              const x = padding + index * xStep;
              const y = toY(point.value);

              return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="3" fill={chartTheme.primaryStrong} />;
            })}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.7 }}>
            <span>{points[0]?.label}</span>
            <span>{points[points.length - 1]?.label}</span>
          </div>
        </>
      )}
    </div>
  );
}
