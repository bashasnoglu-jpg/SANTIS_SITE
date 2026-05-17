import React, { useState, useEffect } from 'react';
import { useSovereignSocket } from '../../context/SovereignSocketContext.js';
import { SimulationResultSchema } from '../../contracts/sovereign-schemas';
import { CrystalBall, TrendingUp, BarChart3, Info } from 'lucide-react';

/**
 * Sovereign Simulator Dashboard Bileşeni
 * Tarihsel verileri kullanarak gelecek 30 günün finansal ve operasyonel projeksiyonunu sunar.
 */
export default function SovereignSimulator() {
  const { socket } = useSovereignSocket();
  const [simulation, setSimulation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('admin:simulation_ready', (rawData) => {
      try {
        const validatedData = SimulationResultSchema.parse(rawData);
        setSimulation(validatedData);
        setIsRunning(false);
      } catch (error) {
        console.error('🛡️ Sovereign Guard: Simülasyon verisi geçersiz.', error);
        setIsRunning(false);
      }
    });

    return () => socket.off('admin:simulation_ready');
  }, [socket]);

  const runSimulation = () => {
    if (!socket) return;
    setIsRunning(true);
    socket.emit('admin:run_simulation');
  };

  return (
    <div className="bg-black/40 backdrop-blur-2xl border border-white/5 p-8 rounded-3xl mt-8 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-santis-gold/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="flex items-center gap-3 text-white font-serif text-xl tracking-wide">
          <CrystalBall className="text-santis-gold" size={24} />
          Egemen Simülatör (30 Günlük Projeksiyon)
        </h3>
        <button 
          onClick={runSimulation}
          disabled={isRunning || !socket}
          className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all duration-700 border ${isRunning ? 'bg-white/5 border-white/10 text-white/30 cursor-wait' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
        >
          {isRunning ? 'Gelecek Hesaplanıyor...' : 'Geleceği Simüle Et'}
        </button>
      </div>

      {!simulation && !isRunning && (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl relative z-10">
          <p className="text-white/30 text-sm italic">Simülasyon motoru hazır. Geleceği öngörmek için sentezi başlatın.</p>
        </div>
      )}

      {isRunning && (
        <div className="flex flex-col items-center justify-center py-12 relative z-10">
            <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-emerald-500/60 text-[10px] uppercase tracking-[0.3em] animate-pulse">Veri Matrisi Analiz Ediliyor</p>
        </div>
      )}

      {simulation && !isRunning && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-1000 relative z-10">
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl group hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3 text-white/40 text-[10px] uppercase tracking-widest">
                <TrendingUp size={14} className="text-emerald-400" />
                Tahmini 30 Günlük Ciro
            </div>
            <div className="text-3xl font-serif text-white tracking-tighter group-hover:text-emerald-400 transition-colors">
              €{simulation.projectedRevenue.toLocaleString()}
            </div>
            <div className="mt-2 text-[9px] text-white/20 italic uppercase tracking-tighter">
                * Mevcut strateji korunursa
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl group hover:border-santis-gold/30 transition-colors">
            <div className="flex items-center gap-2 mb-3 text-white/40 text-[10px] uppercase tracking-widest">
                <BarChart3 size={14} className="text-santis-gold" />
                Beklenen F_TR Skoru
            </div>
            <div className="text-3xl font-serif text-white tracking-tighter group-hover:text-santis-gold transition-colors">
              {simulation.projectedFtr.toFixed(2)}
            </div>
            <div className="mt-2 text-[9px] text-white/20 italic uppercase tracking-tighter">
                * Reality Stability Prediction
            </div>
          </div>

          <div className="lg:col-span-3 bg-emerald-500/5 border-l-2 border-emerald-500/40 p-6 rounded-r-2xl">
            <h4 className="flex items-center gap-2 text-[11px] text-emerald-400 uppercase tracking-widest font-semibold mb-3">
                <Info size={14} /> Stratejik Simülasyon İçgörüsü
            </h4>
            <p className="text-white/80 text-sm leading-relaxed font-light">
              {simulation.insight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
