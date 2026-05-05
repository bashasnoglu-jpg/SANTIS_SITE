import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Users, ShieldCheck, Clock } from "lucide-react";
import type { ActionRecommendationView } from "../boardroom.adapter";

interface ActionRailProps {
  actions: ActionRecommendationView[];
}

const actionIcons: Record<string, any> = {
  pricing_adjustment: TrendingUp,
  reduce_choice: Zap,
  concierge_handoff: Users,
  risk_review: ShieldCheck,
};

const priorityColors: Record<string, string> = {
  low: "text-white/40",
  medium: "text-[#A7B69A]",
  high: "text-[#D4AF37]",
  critical: "text-[#9F5A4A]",
};

export default function ActionRail({ actions }: ActionRailProps) {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.42em] text-[#D4AF37]">
          Boardroom Action Rail
        </div>
        <h3 className="text-lg font-light tracking-[0.08em] text-[#F5F1E8]">
          Executive recommendations.
        </h3>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {actions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-10 text-center border border-dashed border-white/5 rounded-sm"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                No critical actions pending
              </span>
            </motion.div>
          ) : (
            actions.map((action) => {
              const Icon = actionIcons[action.type] || Zap;
              const colorClass = priorityColors[action.priority] || "text-white/40";

              return (
                <motion.div
                  key={action.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative bg-white/[0.02] border border-white/[0.04] p-5 rounded-sm hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 bg-white/[0.03] rounded-full ${colorClass}`}>
                      <Icon size={14} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/80">
                          {action.title}
                        </span>
                        <span className={`text-[9px] uppercase tracking-[0.2em] font-bold ${colorClass}`}>
                          {action.priority}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-white/40 font-light tracking-wide">
                        {action.description}
                      </p>
                      
                      <div className="pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.1em] text-white/20">
                          <Clock size={10} />
                          <span>Expires in 10m</span>
                        </div>
                        <button className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">
                          Execute →
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Impact Indicator Bar */}
                  <div className="absolute bottom-0 left-0 h-[1px] bg-white/5 w-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${action.impactScore * 100}%` }}
                      className={`h-full ${action.priority === 'high' || action.priority === 'critical' ? 'bg-[#D4AF37]' : 'bg-white/20'}`}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
