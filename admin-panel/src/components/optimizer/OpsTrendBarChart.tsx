interface Bar {
  label: string;
  value: number;
}

interface Props {
  title: string;
  bars: Bar[];
}

export function OpsTrendBarChart({ title, bars }: Props): JSX.Element {
  const max = Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>

      {bars.length === 0 ? (
        <div>No data.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {bars.map((bar) => (
            <div key={bar.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{bar.label}</span>
                <strong>{bar.value}</strong>
              </div>
              <div style={{ height: 10, background: '#eee', borderRadius: 999 }}>
                <div
                  style={{
                    width: `${(bar.value / max) * 100}%`,
                    height: '100%',
                    background: '#222',
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
