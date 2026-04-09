import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BoardroomVipView } from "../boardroom.adapter";
import type { VipRiskScore } from "../boardroom.intelligence";

type VipRadarProps = {
  items: BoardroomVipView[];
  acknowledgingIds?: string[];
  onAcknowledge: (id: string) => void;
  riskScores?: VipRiskScore[];
};

function getUrgencyClass(urgency: BoardroomVipView["urgency"]) {
  if (urgency === "high") return "text-[#D4AF37]";
  if (urgency === "medium") return "text-[#C9912F]";
  return "text-white/34";
}

function getRiskMeta(score?: VipRiskScore) {
  if (!score) {
    return {
      badgeClass: "text-white/24 border-white/10",
      shieldClass: "bg-[#A7B69A]/10 border-[#A7B69A]/20 text-[#A7B69A]",
    };
  }

  switch (score.band) {
    case "critical":
      return {
        badgeClass: "text-[#9F5A4A] border-[#9F5A4A]/30",
        shieldClass: "bg-[#A7B69A]/10 border-[#A7B69A]/20 text-[#A7B69A]",
      };
    case "high":
      return {
        badgeClass: "text-[#C9912F] border-[#C9912F]/30",
        shieldClass: "bg-[#A7B69A]/10 border-[#A7B69A]/20 text-[#A7B69A]",
      };
    case "moderate":
      return {
        badgeClass: "text-[#D4AF37]/90 border-[#D4AF37]/20",
        shieldClass: "bg-[#A7B69A]/10 border-[#A7B69A]/20 text-[#A7B69A]",
      };
    default:
      return {
        badgeClass: "text-white/24 border-white/10",
        shieldClass: "bg-[#A7B69A]/10 border-[#A7B69A]/20 text-[#A7B69A]",
      };
  }
}

export default function VipRadar({
  items,
  acknowledgingIds = [],
  onAcknowledge,
  riskScores = [],
}: VipRadarProps) {
  const riskMap = new Map(riskScores.map((risk) => [risk.id, risk]));

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.42em] text-white/26">
          VIP Radar
        </div>
        <h3 className="text-lg font-light tracking-[0.08em] text-[#F5F1E8]">
          Pending concierge handoffs.
        </h3>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const isAcknowledging = acknowledgingIds.includes(item.id) || item.state === 'acknowledged';
            const risk = riskMap.get(item.id);
            const meta = getRiskMeta(risk);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{
                  opacity: isAcknowledging ? 0.65 : 1,
                  y: 0,
                  filter: isAcknowledging ? "blur(4px)" : "blur(0px)",
                }}
                exit={{ opacity: 0, y: -12, filter: "blur(10px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden py-4"
              >
                {isAcknowledging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`pointer-events-none absolute inset-0 flex items-center justify-center border ${meta.shieldClass}`}
                  >
                    <span className="text-[10px] uppercase tracking-[0.34em]">
                      acknowledged
                    </span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className={`text-[10px] uppercase tracking-[0.34em] ${getUrgencyClass(item.urgency)}`}>
                        {item.urgency} priority
                      </div>

                      <div className="text-sm uppercase tracking-[0.24em] text-[#F5F1E8]">
                        {item.guest}
                      </div>

                      <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                        {item.ritual}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-[#A7B69A]">
                        {item.estimatedValue}
                      </div>
                    </div>
                  </div>

                  {risk && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex border px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] ${meta.badgeClass}`}
                        >
                          Abandon Risk {risk.score}%
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.28em] text-white/22">
                          {risk.band}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {risk.reasons.slice(0, 2).map((reason) => (
                          <div
                            key={reason}
                            className="text-[10px] uppercase tracking-[0.18em] text-white/24"
                          >
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isAcknowledging && <button
                    type="button"
                    disabled={isAcknowledging}
                    onClick={() => onAcknowledge(item.id)}
                    className="text-[10px] uppercase tracking-[0.34em] border border-white/5 bg-white/5 hover:bg-white/10 px-4 py-2 text-white/42 transition hover:text-[#F5F1E8] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Acknowledge
                  </button>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
