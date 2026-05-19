import React from 'react';
import { Eye, Activity, ShieldCheck } from 'lucide-react';
import { useSovereignSocket } from '../../context/SovereignSocketContext';
import DecisionMatrix from './DecisionMatrix';
import RevenueIntelligence from './RevenueIntelligence';
import StrategistJournal from './StrategistJournal';
import PredictiveRadar from './PredictiveRadar';
import SovereignStrategist from './SovereignStrategist';
import SovereignArchive from './SovereignArchive';
import SovereignSimulator from './SovereignSimulator';

/**
 * 👁️ THE GOD'S EYE RADAR
 * Merkezi SovereignSocket akışını kullanarak operasyonel verileri görselleştirir.
 * Tüm otonom katmanların (Finans, Öngörü, Strateji, Arşiv) ana birleşme noktasıdır.
 */
export default function GodsEye() {
  const { radarData } = useSovereignSocket();

  // Radar verisi henüz gelmemişse 'Searching' durumunu gösteriyoruz
  const lastEvent = radarData || { action: "Sovereign Radar Aranıyor...", timestamp: "--:--", ftrIndex: 1.0 };
  const ftrScore = lastEvent.ftrIndex || 1.0;
  const connectionStatus = radarData ? "Aktif (Sovereign Guard Kilitli)" : "Sinyal Bekleniyor...";

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      
      {/* ── ANA OPERASYONEL PANEL (God's Eye) ── */}
      <div className="santis-pkg-card relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="santis-pkg-title flex items-center gap-3 text-white uppercase tracking-widest text-lg">
            <Eye className="text-santis-gold animate-pulse" size={20} />
            The God's Eye Radar
          </h2>
          <span className={`text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter border ${radarData ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {connectionStatus}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* F_TR Metric Section */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-white/50 text-xs uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-santis-gold" />
                  F_TR Gerçeklik İndeksi
              </div>
              <div className="text-3xl font-serif text-white tracking-tighter">
                  {ftrScore.toFixed(4)}
              </div>
              <div className="mt-2 text-[10px] text-white/30 italic">
                  * Explanation Depth Priority Flow
              </div>
          </div>

          {/* Live Event Log */}
          <div className="bg-black/20 p-4 rounded-xl border border-white/5 max-h-[140px] overflow-hidden">
              <div className="flex items-center gap-3 text-[11px] animate-in fade-in slide-in-from-right-2">
                  <span className="text-santis-gold/50 font-mono">{lastEvent.timestamp}</span>
                  <span className="text-white/70 truncate">{lastEvent.action}</span>
                  <Activity size={10} className="ml-auto text-emerald-500/50" />
              </div>
              <div className="mt-4 text-[10px] text-white/20 uppercase tracking-widest">
                  Son Otonom Olay İzleniyor
              </div>
          </div>
        </div>

        {/* Alt Katmanlar */}
        <div className="mt-8 space-y-6">
          <DecisionMatrix ftrScore={ftrScore} />
          <RevenueIntelligence />
        </div>
      </div>

      {/* ── ZEKA VE ÖNGÖRÜ KATMANI ── */}
      <PredictiveRadar />

      {/* ── STRATEJİK KOMUTA VE ARŞİV ── */}
      <div className="grid grid-cols-1 gap-8">
        <SovereignStrategist />
        <SovereignArchive />
        <SovereignSimulator />
        <StrategistJournal />
      </div>

    </div>
  );
}
