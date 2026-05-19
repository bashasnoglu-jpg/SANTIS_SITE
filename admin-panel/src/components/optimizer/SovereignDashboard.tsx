import React, { useState, useEffect } from 'react';
import { useSovereignWebSocket } from '../../hooks/useSovereignWebSocket';

export function SovereignDashboard() {
  const { latestMessage } = useSovereignWebSocket('ws://localhost:8081'); // api-mock.ts port
  
  const [rolloutData, setRolloutData] = useState({
    isActive: false,
    percentage: 0,
    riskDelta: 0.0,
    status: 'pending' // pending, running, completed, reverted
  });

  useEffect(() => {
    const msg = latestMessage as any;
    if (msg && msg.type === 'ROLLOUT_STATUS_UPDATE' && msg.data) {
      const p = msg.data;
      setRolloutData({
        isActive: p.status === 'running',
        percentage: p.scope?.rolloutPercentage || 10, // Canary değilse veya scope yoksa fallback
        riskDelta: p.metrics?.riskDelta || 0.0,
        status: p.status
      });
    }
  }, [latestMessage]);

  const isHighRisk = rolloutData.riskDelta > 0.5;
  const isRollingBack = rolloutData.status === 'reverted';

  // Lüks antrasit kararması (Rollback veya High Risk durumu)
  const cardBorderAndShadow = isRollingBack || isHighRisk
    ? 'border-zinc-800 fx-shadow-panel bg-zinc-50' 
    : rolloutData.isActive
      ? 'border-sovereign-gold-deep/40 fx-glow-medium-gold bg-white/60'
      : 'border-stone-200/50 shadow-sm bg-white/60';

  const textColor = isRollingBack || isHighRisk ? 'text-zinc-800' : 'text-sovereign-gold-deep';
  const pulseColor = isRollingBack || isHighRisk ? 'bg-zinc-800' : 'bg-sovereign-gold-deep';

  return (
    <div className="font-sans text-zinc-800 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {/* V3.8 Rollout Engine Kartı */}
        <div 
          className={`relative backdrop-blur-2xl border rounded-2xl p-10 cursor-pointer 
            transition-all duration-1000 ease-in-out hover:-translate-y-1 
            hover:fx-shadow-panel 
            ${cardBorderAndShadow}`}
        >
          {/* Lüks Kart İçeriği */}
          <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-stone-400 mb-6 transition-colors duration-1000">
            {isRollingBack ? 'Auto-Healing Devrede' : 'V3.8 Rollout Engine'}
          </h3>
          
          <div className={`text-6xl font-thin mb-4 tracking-tighter transition-colors duration-1000 ${isRollingBack || isHighRisk ? 'text-zinc-900' : 'text-zinc-800'}`}>
            %{rolloutData.status === 'pending' ? '0' : rolloutData.percentage}
          </div>
          
          <div className="text-sm font-light space-y-2">
            <p className="text-stone-500 transition-colors duration-1000">
              {isRollingBack 
                ? 'Politika geri alındı. Kuantum kilit aktif.' 
                : rolloutData.status === 'pending' 
                  ? 'Otonom motor beklemede.' 
                  : rolloutData.status === 'completed'
                    ? 'Rollout başarıyla tamamlandı.'
                    : 'Aktif Canary Rollout devrede.'}
            </p>
            <p className={`font-normal transition-colors duration-1000 ${textColor}`}>
              Risk Deltası: {rolloutData.riskDelta > 0 ? '+' : ''}{rolloutData.riskDelta}
            </p>
          </div>

          {/* Otonom Karar Logu (Animasyonlu Pulse Göstergesi) */}
          {(rolloutData.isActive || isRollingBack) && (
            <div className="absolute top-10 right-10 flex items-center justify-center">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 duration-1000 ${pulseColor}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 opacity-80 transition-colors duration-1000 ${pulseColor}`}></span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
