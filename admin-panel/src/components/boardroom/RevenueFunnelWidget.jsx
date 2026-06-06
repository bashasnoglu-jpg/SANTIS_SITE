import React from 'react';
import { Filter, ChevronRight } from 'lucide-react';
import { useSovereignSocket } from '../../context/SovereignSocketContext';

export default function RevenueFunnelWidget() {
  const { financeData } = useSovereignSocket();
  const dailyRevenue = financeData?.dailyRevenue || 0;
  const isFallback = dailyRevenue === 0;

  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in md:col-span-2 xl:col-span-1" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between mb-6 border-b border-sovereign-panel pb-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-sovereign-accent" />
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Journey Terk Analizi (Revenue)</h3>
        </div>
        {isFallback && (
          <span className="text-2xs uppercase tracking-widest bg-sovereign-earth/20 text-sovereign-earth px-2 py-1 rounded-sm">
            DEMO / FALLBACK
          </span>
        )}
      </div>
      <div className="mb-6 flex items-baseline gap-4">
        <span className="font-serif text-5xl text-sovereign-ink">€{dailyRevenue.toLocaleString()}</span>
        <span className="text-sovereign-accent text-sm font-medium">Live Stream</span>
      </div>
      <p className="text-sovereign-bronze text-xs leading-relaxed mb-6">Müşteriler 4 adımlı Journey Builder (Sepet) akışında nereden çıkıyor?</p>

      <div className="mt-auto space-y-0 divide-y divide-[var(--sovereign-panel)]">
        <div className="py-3 flex justify-between items-center">
          <span className="text-sovereign-sand text-sm">1. Kişiselleştirme</span>
          <span className="text-sovereign-ink text-sm font-medium">100%</span>
        </div>
        <div className="py-3 flex justify-between items-center">
          <span className="text-sovereign-sand text-sm flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-sovereign-earth"/> 2. Zaman Çizelgesi</span>
          <div className="text-right"><span className="text-sovereign-ink text-sm font-medium">88%</span> <span className="text-sovereign-bronze text-xs ml-2">-12%</span></div>
        </div>
        <div className="py-3 flex justify-between items-center relative overflow-hidden bg-sovereign-earth/10 px-2 -mx-2 rounded">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sovereign-accent"></div>
          <span className="text-sovereign-accent text-sm flex items-center font-medium"><ChevronRight className="w-3 h-3 mr-1"/> 3. Misafir Bilgileri</span>
          <div className="text-right"><span className="text-sovereign-accent text-sm font-medium">53%</span> <span className="text-sovereign-accent text-xs ml-2 font-medium">-35% (Kritik)</span></div>
        </div>
        <div className="py-3 flex justify-between items-center">
          <span className="text-sovereign-sand text-sm flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-sovereign-earth"/> 4. Onay Gönderimi</span>
          <div className="text-right"><span className="text-sovereign-ink text-sm font-medium">48%</span> <span className="text-sovereign-bronze text-xs ml-2">-5%</span></div>
        </div>
      </div>
    </div>
  );
}
