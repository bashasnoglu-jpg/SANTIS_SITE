import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface PulseEvent {
  id: string;
  ts: string;
  type: string;
  message: string;
}

interface LivePulseLogProps {
  events: PulseEvent[];
  maxItems?: number;
}

export default function LivePulseLog({ events, maxItems = 8 }: LivePulseLogProps) {
  const sliced = events.slice(0, maxItems);
  return (
    <section className="space-y-6 flex flex-col h-full">
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.42em] text-[#A7B69A]">Executive Stream</div>
        <h3 className="text-lg font-light tracking-[0.08em] text-[#F5F1E8]">Live God's Eye Pulse.</h3>
      </div>
      <div className="space-y-3 font-mono text-[11px] leading-6 text-white/50 relative flex-1 min-h-[250px] overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
        <AnimatePresence>
          {sliced.map((event: PulseEvent, i: number) => {
            const isAlert = event.type.includes('Alert') || event.type === 'DECISION';
            const typeColor = isAlert ? 'text-[#9F5A4A] drop-shadow-[0_0_8px_rgba(159,90,74,0.5)]' : 'text-[#D4AF37] drop-shadow-[0_0_4px_rgba(212,175,55,0.3)]';
            
            return (
              <motion.div 
                key={event.id + i} 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="grid grid-cols-[72px_120px_1fr] gap-3 relative z-0 border-b border-white/[0.02] pb-2"
              >
                <span className="text-white/20">{event.ts}</span>
                <span className={`${typeColor} truncate font-bold tracking-wider`}>{event.type}</span>
                <span className="truncate tracking-wide">{event.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
