import React from "react";
import { motion, type Transition, type Variants } from "framer-motion";

/* ── Navigation Item Type ── */
interface RailItem {
  key: string;
  label: string;
}

/* ── Component Props ── */
interface ExecutiveRailProps {
  items: RailItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  operatorScope: string;
}

/* ── Framer Motion Variant (custom function signature) ── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0): { opacity: number; y: number; transition: Transition } => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

// Framer Motion Variants type doesn't support custom function signatures cleanly.
// Explicit cast at module level keeps JSX clean.
const fadeUpVariants = fadeUp as unknown as Variants;

export default function ExecutiveRail({ items, activeKey, onNavigate, operatorScope }: ExecutiveRailProps) {
  return (
    <aside className="hidden border-r border-white/[0.04] px-8 py-10 xl:flex xl:flex-col xl:justify-between">
      <div className="space-y-14">
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.48em] text-white/24">Santis Admin</div>
          <div className="text-lg font-light tracking-[0.16em] text-[#F5F1E8]">Sovereign OS</div>
        </div>
        <nav className="space-y-5">
          {items.map((item: RailItem, index: number) => {
            const active = item.key === activeKey;
            return (
              <motion.button key={item.key} custom={index} variants={fadeUpVariants} initial="hidden" animate="visible" onClick={() => onNavigate(item.key)} className="flex w-full items-center gap-3 text-left">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${active ? "bg-[#D4AF37]" : "bg-white/10"}`} />
                <span className={`text-[11px] uppercase tracking-[0.32em] ${active ? "text-[#D4AF37]" : "text-white/28"}`}>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-[0.42em] text-white/22">Operator Scope</div>
        <div className="text-xs uppercase tracking-[0.28em] text-white/42">{operatorScope}</div>
      </div>
    </aside>
  );
}

