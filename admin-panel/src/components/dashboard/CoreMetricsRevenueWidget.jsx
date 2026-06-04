import React from 'react';
import { useSovereignSocket } from '../../context/SovereignSocketContext';
import { TrendingUp, Percent, Activity } from 'lucide-react';

export default function CoreMetricsRevenueWidget() {
  const { financeData } = useSovereignSocket();
  const { liveRevenue = 0, activeSessions = 0 } = financeData || {};

  // Mock değerler, backend'den geldiğinde gerçek dataya bağlanacak.
  const capacityPercent = Math.min(100, Math.round((activeSessions / 150) * 100)) || 85;
  const conversionRate = 14.2;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* WIDGET 1: Günün Cirosu / Projeksiyon */}
      <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-gold/50 rounded-sm p-6 relative overflow-hidden group transition-all duration-500 animate-fade-in">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-sovereign-gold/5 rounded-full blur-2xl transition-all duration-700 group-hover:bg-sovereign-gold/10"></div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sovereign-muted text-xs font-medium uppercase tracking-widest">
            Günün Cirosu
          </h3>
          <TrendingUp className="w-4 h-4 text-sovereign-gold" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-4xl text-sovereign-ink transition-all duration-500">
            {liveRevenue.toLocaleString('tr-TR')}
          </span>
          <span className="text-lg text-sovereign-muted font-sans">€</span>
        </div>
      </div>

      {/* WIDGET 2: Otonom İkna Oranı */}
      <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-accent/50 rounded-sm p-6 relative overflow-hidden group transition-all duration-500 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-sovereign-accent/5 rounded-full blur-2xl transition-all duration-700 group-hover:bg-sovereign-accent/10"></div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sovereign-muted text-xs font-medium uppercase tracking-widest">
            Otonom İkna Oranı
          </h3>
          <Percent className="w-4 h-4 text-sovereign-accent" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-4xl text-sovereign-accent">
            %{conversionRate}
          </span>
        </div>
        <div className="mt-3 text-2xs text-sovereign-bronze font-mono uppercase tracking-wide opacity-60">
          Sovereign AI Yönlendirmesi
        </div>
      </div>

      {/* WIDGET 3: Aktif Operasyon Kapasitesi */}
      <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-6 relative overflow-hidden group transition-all duration-500 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-sovereign-earth/5 rounded-full blur-2xl transition-all duration-700 group-hover:bg-sovereign-earth/10"></div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sovereign-muted text-xs font-medium uppercase tracking-widest">
            Operasyon Kapasitesi
          </h3>
          <Activity className="w-4 h-4 text-sovereign-earth" />
        </div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="font-serif text-4xl text-sovereign-ink">
            {capacityPercent}
          </span>
          <span className="text-lg text-sovereign-muted font-sans">%</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-1 border border-white/5 overflow-hidden">
          <div
            className="bg-sovereign-earth h-1 rounded-full transition-all duration-1000"
            style={{ width: `${capacityPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
