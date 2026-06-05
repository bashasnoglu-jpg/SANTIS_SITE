import React, { useEffect, useRef } from 'react';
import { useSovereignSocket } from '../../context/SovereignSocketContext';
import { TrendingUp, Percent, Activity } from 'lucide-react';
import gsap from 'gsap';

export default function CoreMetricsRevenueWidget() {
  const { financeData } = useSovereignSocket();
  const hasRealData = !!financeData;

  const displayRevenue = hasRealData ? financeData.dailyRevenue : 0;

  const capacityPercent = hasRealData ? financeData.capacityPercent : 0;
  const conversionRate = hasRealData ? financeData.conversionRate : 0;

  const revenueRef = useRef(null);
  const widgetRef = useRef(null);
  const glowRef = useRef(null);
  const prevRevenue = useRef(displayRevenue);

  useEffect(() => {
    if (!revenueRef.current) return;

    // Haute Horlogerie (Odometer) Animation
    const obj = { val: prevRevenue.current };
    gsap.to(obj, {
      val: displayRevenue,
      duration: 1.8,
      ease: 'power3.out',
      onUpdate: () => {
        if (revenueRef.current) {
          revenueRef.current.innerText = Math.floor(obj.val).toLocaleString('tr-TR');
        }
      }
    });

    // Subtle Gold Pulse (Asymmetric Rhythm)
    if (displayRevenue > prevRevenue.current && widgetRef.current && glowRef.current) {
      gsap.timeline()
        .to(widgetRef.current, { borderColor: 'rgba(212, 175, 55, 0.4)', duration: 0.4, ease: 'power1.out' })
        .to(widgetRef.current, { duration: 2.5, ease: 'power2.out', clearProps: 'borderColor' });

      gsap.timeline()
        .to(glowRef.current, { backgroundColor: 'rgba(212, 175, 55, 0.15)', duration: 0.4, ease: 'power1.out' })
        .to(glowRef.current, { backgroundColor: 'rgba(212, 175, 55, 0.05)', duration: 2.5, ease: 'power2.out', clearProps: 'backgroundColor' });
    }

    prevRevenue.current = displayRevenue;
  }, [displayRevenue]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 relative">
      {!hasRealData && (
        <div className="absolute -top-3 right-0 z-10 flex flex-col items-end pointer-events-none">
          <div className="flex items-center text-2xs text-sovereign-gold font-mono uppercase tracking-widest bg-sovereign-gold/10 px-2 py-1 rounded-sm border border-sovereign-gold/20 backdrop-blur-md">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            SENSORS ARMED
          </div>
          <div className="text-2xs text-sovereign-muted mt-1 uppercase">Awaiting financial stream</div>
        </div>
      )}

      {/* WIDGET 1: Günün Cirosu / Projeksiyon */}
      <div
        ref={widgetRef}
        className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-gold/50 rounded-sm p-6 relative overflow-hidden group transition-all duration-500 animate-fade-in"
      >
        <div
          ref={glowRef}
          className="absolute -right-10 -top-10 w-32 h-32 bg-sovereign-gold/5 rounded-full blur-2xl transition-all duration-700 group-hover:bg-sovereign-gold/10"
        ></div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sovereign-muted text-xs font-medium uppercase tracking-widest">
            Günün Cirosu
          </h3>
          <TrendingUp className="w-4 h-4 text-sovereign-gold" />
        </div>
        <div className="flex items-baseline gap-2">
          {/* tabular-nums ensures 0 CLS during odometer animation */}
          <span
            ref={revenueRef}
            className="font-serif text-4xl text-sovereign-ink tabular-nums tracking-tight"
          >
            {hasRealData ? displayRevenue.toLocaleString('tr-TR') : '0'}
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
          <span className="font-serif text-4xl text-sovereign-accent tabular-nums tracking-tight">
            %{hasRealData ? conversionRate : '0.0'}
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
          <span className="font-serif text-4xl text-sovereign-ink tabular-nums tracking-tight">
            {hasRealData ? capacityPercent : '0'}
          </span>
          <span className="text-lg text-sovereign-muted font-sans">%</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-1 border border-white/5 overflow-hidden">
          <div
            className="bg-sovereign-earth h-1 rounded-full transition-all duration-1000"
            style={{ width: `${hasRealData ? capacityPercent : 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
