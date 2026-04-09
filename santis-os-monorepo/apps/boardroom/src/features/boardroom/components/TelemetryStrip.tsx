import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function TelemetryStrip({ tenantOptions, selectedTenant, onTenantChange, dateLabel, viewLabel, operatorIdentity, liveStatus }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.04] px-6 py-4 sm:px-8 lg:px-12 xl:px-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="relative">
            <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.42em] text-white/32">
              <span>Portfolio Scope / {selectedTenant?.label || 'Global'}</span>
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: 8, filter: "blur(6px)" }} className="absolute left-0 top-7 z-20 min-w-[220px] bg-[#0A0A0A] py-2">
                  {tenantOptions.map((tenant: any) => (
                    <button key={tenant.key} onClick={() => { onTenantChange(tenant); setOpen(false); }} className="block w-full px-4 py-3 text-left text-[10px] uppercase tracking-[0.34em] text-white/42 hover:text-[#F5F1E8]">{tenant.label}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="text-[10px] uppercase tracking-[0.42em] text-white/22">Date / {dateLabel}</span>
          <span className="text-[10px] uppercase tracking-[0.42em] text-white/22">Filter / {viewLabel}</span>
          <span className="text-[10px] uppercase tracking-[0.42em] text-white/22">{operatorIdentity}</span>
        </div>
        <div className="flex items-center gap-4">
          <motion.span className="inline-block h-2 w-2 rounded-full bg-[#A7B69A]" animate={{ opacity: [0.3, 0.95, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
          <span className="text-[10px] uppercase tracking-[0.42em] text-white/30">{liveStatus}</span>
        </div>
      </div>
    </div>
  );
}
