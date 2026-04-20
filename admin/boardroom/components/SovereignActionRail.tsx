import React from "react";
import SovereignActionCard from "./SovereignActionCard";
import type { SovereignAction } from "../engine/action-engine.types";

type Props = {
  actions: SovereignAction[];
  title?: string;
  subtitle?: string;
  onAcknowledge: (actionId: string) => void;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
};

export default function SovereignActionRail({
  actions,
  title = "Sovereign Action Rail",
  subtitle = "Operasyonel karar motorunun ürettiği aksiyonlar HACI kapısı üzerinden yönetilir.",
  onAcknowledge,
  onApprove,
  onReject,
}: Props) {
  const hasActions = actions.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] mt-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_26%)]" />

      <div className="relative z-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-white/40">
              Santis Action Engine
            </div>
            <h2 className="text-[28px] leading-none tracking-[-0.03em] text-[#f4f1ea] md:text-[38px]">
              {title}
            </h2>
            <p className="mt-3 max-w-[760px] text-[14px] leading-7 text-white/62">
              {subtitle}
            </p>
          </div>

          <div className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-[12px] uppercase tracking-[0.18em] text-white/50">
            {actions.length} action
          </div>
        </div>

        {!hasActions ? (
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-8 text-center text-white/55">
            Şu an aktif aksiyon yok. Sistem stabil görünüyor.
          </div>
        ) : (
          <div className="grid gap-4">
            {actions.map((action) => (
              <SovereignActionCard
                key={action.id}
                action={action}
                onAcknowledge={onAcknowledge}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
