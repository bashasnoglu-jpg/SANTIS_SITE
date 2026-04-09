import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function SessionFriction({ title, subtitle, rows }: any) {
  function toneClass(severity: string) {
    if (severity === "critical") return "text-[#9F5A4A]";
    if (severity === "warning" || severity === "degraded") return "text-[#C9912F]";
    return "text-white/40";
  }
  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <div className="text-[10px] uppercase tracking-[0.44em] text-white/26">{title}</div>
        <h2 className="text-2xl font-light tracking-[0.08em] sm:text-3xl">{subtitle}</h2>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {rows.map((row: any, index: number) => (
          <motion.div key={row.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }} className="grid grid-cols-[1fr_auto] items-center gap-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${toneClass(row.severity)}`} strokeWidth={1.5} />
              <span className={`truncate text-sm uppercase tracking-[0.2em] ${toneClass(row.severity)}`}>{row.cause}</span>
            </div>
            <span className="text-xs tracking-[0.28em] text-white/28">{row.sessions} SESSIONS</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
