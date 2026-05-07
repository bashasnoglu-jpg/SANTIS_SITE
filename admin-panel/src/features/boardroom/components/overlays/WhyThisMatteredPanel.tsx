import type { CognitiveSignificance } from "../../types/boardroom.types";

interface WhyThisMatteredPanelProps {
  significance: CognitiveSignificance;
}

const LEVEL_CONFIG = {
  low: {
    color: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.1)",
    bg: "rgba(255,255,255,0.02)",
    label: "LOW SIGNIFICANCE",
    icon: "◎",
  },
  medium: {
    color: "var(--color-sovereign-signal-hesitation)",
    border: "rgba(240,192,64,0.25)",
    bg: "rgba(240,192,64,0.04)",
    label: "MEDIUM SIGNIFICANCE",
    icon: "◉",
  },
  high: {
    color: "var(--color-sovereign-gold-strong)",
    border: "rgba(212,175,55,0.35)",
    bg: "rgba(212,175,55,0.07)",
    label: "HIGH SIGNIFICANCE",
    icon: "⬟",
  },
  critical: {
    color: "var(--color-sovereign-danger)",
    border: "rgba(224,92,92,0.4)",
    bg: "rgba(224,92,92,0.07)",
    label: "CRITICAL",
    icon: "⬛",
  },
};


export function WhyThisMatteredPanel({ significance }: WhyThisMatteredPanelProps) {
  const cfg = LEVEL_CONFIG[significance.level];

  return (
    <div
      className="nv-why-panel"
      style={{
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
      }}
    >
      <div className="nv-why-panel__header">
        <span className="nv-why-panel__icon" style={{ color: cfg.color }}>
          {cfg.icon}
        </span>
        <div>
          <span className="nv-why-panel__kicker">WHY THIS MATTERED</span>
          <span
            className="nv-why-panel__level"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      <p className="nv-why-panel__narrative">{significance.narrative}</p>
    </div>
  );
}
