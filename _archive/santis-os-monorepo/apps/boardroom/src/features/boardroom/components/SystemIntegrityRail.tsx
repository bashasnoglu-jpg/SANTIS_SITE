import React from "react";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import type { BoardroomIntegrityView } from "../boardroom.adapter";

type SystemIntegrityRailProps = {
  services: BoardroomIntegrityView[];
  executiveSignals?: string[];
};

function statusMeta(status: BoardroomIntegrityView["status"]) {
  if (status === "healthy") {
    return {
      icon: CheckCircle2,
      iconClass: "text-[#A7B69A]",
      textClass: "text-[#A7B69A]",
    };
  }

  if (status === "degraded") {
    return {
      icon: AlertTriangle,
      iconClass: "text-[#C9912F]",
      textClass: "text-[#C9912F]",
    };
  }

  return {
    icon: ShieldAlert,
    iconClass: "text-[#9F5A4A]",
    textClass: "text-[#9F5A4A]",
  };
}

export default function SystemIntegrityRail({
  services,
  executiveSignals = [],
}: SystemIntegrityRailProps) {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.42em] text-white/26">
          System Integrity
        </div>
        <h3 className="text-lg font-light tracking-[0.08em] text-[#F5F1E8]">
          Core service health.
        </h3>
      </div>

      <div className="space-y-4">
        {services.map((service) => {
          const meta = statusMeta(service.status);
          const Icon = meta.icon;

          return (
            <div
              key={service.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${meta.iconClass}`} strokeWidth={1.5} />
                <span className="text-[11px] uppercase tracking-[0.28em] text-white/42">
                  {service.label}
                </span>
              </div>

              <span className={`text-[10px] uppercase tracking-[0.32em] ${meta.textClass}`}>
                {service.status}
              </span>
            </div>
          );
        })}
      </div>

      {executiveSignals.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="text-[10px] uppercase tracking-[0.42em] text-[#D4AF37]">
            Executive Signals
          </div>

          <div className="space-y-3">
            {executiveSignals.slice(0, 4).map((signal) => (
              <div
                key={signal}
                className="text-[10px] uppercase leading-5 tracking-[0.16em] text-white/42"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
