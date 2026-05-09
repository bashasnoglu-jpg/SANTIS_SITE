import React from "react";
import type { SovereignAction } from "../engine/action-engine.types";

type Props = {
  action: SovereignAction;
  onAcknowledge: (actionId: string) => void;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
};

const severityMap = {
  low: {
    badge: "bg-white/8 text-white/70 border-white/10",
    ring: "border-white/10",
    glow: "shadow-[0_8px_30px_rgba(0,0,0,0.18)]",
  },
  medium: {
    badge: "bg-amber-500/10 text-amber-200 border-amber-400/20",
    ring: "border-amber-400/20",
    glow: "shadow-[0_8px_30px_rgba(0,0,0,0.22)]",
  },
  high: {
    badge: "bg-[#c6a96b]/12 text-[#e6d0a0] border-[#c6a96b]/30",
    ring: "border-[#c6a96b]/25",
    glow: "shadow-[0_12px_36px_rgba(0,0,0,0.28)]",
  },
  critical: {
    badge: "bg-red-500/12 text-red-200 border-red-400/30",
    ring: "border-red-400/30",
    glow: "shadow-[0_14px_42px_rgba(40,0,0,0.34)]",
  },
} as const;

const typeLabelMap = {
  ADVISORY: "Advisory",
  OPTIMIZATION: "Optimization",
  RECOVERY: "Recovery",
  ALERT: "Alert",
} as const;

const statusMap = {
  new: "Yeni",
  acknowledged: "Görüldü",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  applied: "Uygulandı",
} as const;

function patchSummary(action: SovereignAction): string {
  if (!action.recommendedPatch) return "Patch önerisi yok";

  const { kind, payload } = action.recommendedPatch;
  const compactPayload = Object.entries(payload)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");

  return `${kind}${compactPayload ? ` · ${compactPayload}` : ""}`;
}

export default function SovereignActionCard({
  action,
  onAcknowledge,
  onApprove,
  onReject,
}: Props) {
  const theme = severityMap[action.severity];

  const canAcknowledge = action.status === "new";
  const canApprove =
    action.requiresApproval &&
    (action.status === "new" || action.status === "acknowledged");
  const canReject =
    action.status === "new" || action.status === "acknowledged";

  return (
    <article
      className={[
        "relative overflow-hidden rounded-[24px] border bg-white/[0.035] p-5 backdrop-blur-xl",
        theme.ring,
        theme.glow,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_32%)]" />

      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex h-7 items-center rounded-full border px-3 text-[11px] uppercase tracking-[0.18em]",
                  theme.badge,
                ].join(" ")}
              >
                {typeLabelMap[action.type]}
              </span>

              <span className="inline-flex h-7 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-[11px] uppercase tracking-[0.18em] text-white/55">
                {action.severity}
              </span>

              <span className="inline-flex h-7 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-[11px] uppercase tracking-[0.18em] text-white/55">
                {statusMap[action.status]}
              </span>
            </div>

            <h3 className="text-[20px] leading-[1.1] tracking-[-0.02em] text-[#f4f1ea]">
              {action.title}
            </h3>
          </div>

          <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
            {action.source}
          </div>
        </div>

        <p className="mb-4 text-[14px] leading-7 text-white/68">
          {action.description}
        </p>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
            <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
              Metric
            </div>
            <div className="text-[14px] text-[#f4f1ea]">
              {action.metric ?? "—"}
              {typeof action.metricValue === "number" ? (
                <span className="ml-2 text-white/55">
                  {action.metricValue.toFixed(1)}
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-[12px] text-white/45">
              Threshold: {action.threshold ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
            <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
              Recommended Patch
            </div>
            <div className="text-[13px] leading-6 text-white/66">
              {patchSummary(action)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onAcknowledge(action.id)}
            disabled={!canAcknowledge}
            className="inline-flex h-11 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-[13px] text-[#f4f1ea] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Acknowledge
          </button>

          <button
            type="button"
            onClick={() => onApprove(action.id)}
            disabled={!canApprove}
            className="inline-flex h-11 items-center rounded-full border border-[#c6a96b]/25 bg-[#c6a96b]/90 px-4 text-[13px] text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve
          </button>

          <button
            type="button"
            onClick={() => onReject(action.id)}
            disabled={!canReject}
            className="inline-flex h-11 items-center rounded-full border border-white/10 bg-transparent px-4 text-[13px] text-white/72 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reject
          </button>

          {action.requiresApproval ? (
            <span className="ml-auto inline-flex h-8 items-center rounded-full border border-[#c6a96b]/20 bg-[#c6a96b]/8 px-3 text-[11px] uppercase tracking-[0.16em] text-[#e6d0a0]">
              HACI Gate Active
            </span>
          ) : (
            <span className="ml-auto inline-flex h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-[11px] uppercase tracking-[0.16em] text-white/50">
              No Approval Required
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
