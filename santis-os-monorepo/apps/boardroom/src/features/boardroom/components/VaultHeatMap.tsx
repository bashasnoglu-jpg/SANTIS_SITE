import React from "react";
import { motion } from "framer-motion";
import type { VaultAssetView } from "../boardroom.adapter";

interface VaultHeatMapProps {
  assets: VaultAssetView[];
  title?: string;
  subtitle?: string;
}

export const VaultHeatMap: React.FC<VaultHeatMapProps> = ({ 
  assets, 
  title = "Vault Operations",
  subtitle = "Live semantic valuation & leakage risk"
}) => {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-light tracking-[0.12em] text-[#F5F1E8]">{title}</h2>
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">{subtitle}</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-[#0A0A0A]/40 border border-[#D4AF37]/10 rounded-lg shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        {assets.map((asset) => {
          // Dynamic styling based on risk score
          const isCritical = asset.riskScore > 75;
          const isWarning = asset.riskScore > 40 && !isCritical;
          const bgGradient = isCritical ? 'from-[#4A1A1A] to-[#0A0A0A]' : 
                             isWarning ? 'from-[#3A2A1A] to-[#0A0A0A]' : 
                             'from-[#1A251A] to-[#0A0A0A]';
          const dangerColor = isCritical ? 'rgba(215, 60, 60, 0.4)' : 
                              isWarning ? 'rgba(212, 175, 55, 0.4)' : 
                              'rgba(167, 182, 154, 0.4)';

          return (
            <motion.div
              key={asset.id}
              whileHover={{ scale: 1.02, borderColor: 'rgba(212, 175, 55, 0.6)' }}
              className={`h-28 border border-[#D4AF37]/5 rounded-sm flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br ${bgGradient}`}
              style={{
                boxShadow: `inset 0 0 ${asset.riskScore / 3}px ${dangerColor}`
              }}
            >
              {/* Asset Name */}
              <span className="text-[10px] text-[#A7B69A] uppercase tracking-[0.3em] z-10 text-center px-2">{asset.name}</span>
              
              {/* Asset Value */}
              <span className="text-xl font-light text-[#F5F1E8] tracking-widest mt-2 z-10">€{asset.value.toLocaleString()}</span>
              
              {/* Status Activity */}
              <span className="text-[9px] text-white/20 uppercase tracking-widest mt-1 z-10">{asset.lastActivity}</span>
              
              {/* Risk Pulse Line */}
              <div 
                className={`absolute bottom-0 left-0 h-1 w-full ${isCritical ? 'bg-[#9F5A4A]' : isWarning ? 'bg-[#D4AF37]' : 'bg-[#A7B69A]'}`} 
                style={{ opacity: Math.max(asset.riskScore / 100, 0.2) }}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
