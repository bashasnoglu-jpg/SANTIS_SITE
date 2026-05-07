interface ConfidenceHeatmapProps {
  confidence: number; // 0.0 – 1.0
}

export function ConfidenceHeatmap({ confidence }: ConfidenceHeatmapProps) {
  const pct = Math.round(confidence * 100);

  // Renk skalası: düşük (kırmızı) → orta (sarı) → yüksek (altın/yeşil)
  const getColor = () => {
    if (pct >= 85) return {
      bar: "var(--color-sovereign-gold-strong)",
      glow: "rgba(212,175,55,0.35)",
      barBorder: "rgba(212,175,55,0.25)",
      label: "HIGH CONFIDENCE",
    };
    if (pct >= 65) return {
      bar: "var(--color-sovereign-signal-hesitation)",
      glow: "rgba(240,192,64,0.3)",
      barBorder: "rgba(240,192,64,0.25)",
      label: "MODERATE",
    };
    if (pct >= 45) return {
      bar: "var(--color-sovereign-warning)",
      glow: "rgba(232,150,74,0.3)",
      barBorder: "rgba(232,150,74,0.25)",
      label: "LOW",
    };
    return {
      bar: "var(--color-sovereign-danger)",
      glow: "rgba(224,92,92,0.3)",
      barBorder: "rgba(224,92,92,0.25)",
      label: "CRITICAL LOW",
    };
  };

  const { bar, glow, barBorder, label } = getColor();

  const segments = Array.from({ length: 20 }, (_, i) => {
    const segPct = (i + 1) * 5;
    return { filled: pct >= segPct, partial: pct > i * 5 && pct < segPct };
  });

  return (
    <div className="nv-confidence-heatmap">
      <div className="nv-heatmap__header">
        <span className="nv-heatmap__label">GOVERNOR CONFIDENCE</span>
        <div className="nv-heatmap__score" style={{ color: bar }}>
          {pct}
          <span className="nv-heatmap__unit">%</span>
        </div>
      </div>

      <div className="nv-heatmap__track">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="nv-heatmap__segment"
            style={{
              background: seg.filled ? bar : "rgba(255,255,255,0.04)",
              boxShadow: seg.filled ? `0 0 6px ${glow}` : "none",
              opacity: seg.partial ? 0.5 : 1,
              border: seg.filled ? `1px solid ${barBorder}` : "1px solid rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </div>

      <div className="nv-heatmap__badge" style={{ color: bar, borderColor: barBorder, background: glow }}>
        {label}
      </div>
    </div>
  );
}
