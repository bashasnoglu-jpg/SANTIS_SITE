import React from "react";
import { motion } from "framer-motion";

export default function MetricStrip({ metrics }: any) {
  return (
    <section>
      <div className="grid grid-cols-1 gap-x-16 gap-y-14 lg:grid-cols-4 xl:gap-x-24">
        {metrics.map((metric: any, index: number) => (
          <motion.div key={metric.key} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }} className="min-w-[220px] flex-1">
            <div className="mb-4 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.42em] text-white/35">
              {metric.pulse && <motion.span className="inline-block h-2 w-2 rounded-full bg-[#D4AF37]" animate={{ opacity: [0.35, 0.95, 0.35], scale: [1, 1.08, 1] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }} />}
              <span>{metric.label}</span>
            </div>
            <div className={`text-3xl font-light tracking-[0.08em] sm:text-4xl lg:text-5xl ${metric.tone === "gold" ? "text-[#D4AF37]" : metric.tone === "warning" ? "text-[#C9912F]" : "text-[#F5F1E8]"}`}>
              {metric.value}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
