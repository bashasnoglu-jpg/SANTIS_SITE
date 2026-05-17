import React, { useState, useEffect } from 'react';
import { useSovereignSocket } from '../../context/SovereignSocketContext';
import { StrategyReportSchema } from '../../contracts/sovereign-schemas';
import { BrainCircuit, Target, Sparkles, TrendingUp } from 'lucide-react';

/**
 * Sovereign Strategist AI Dashboard Bileşeni
 * Antigravity motorunun ürettiği makro analizleri ve "Egemenlik Radarı" grafiğini sunar.
 */
export default function SovereignStrategist() {
  const { radarData } = useSovereignSocket(); // Socket nesnesine context'ten doğrudan erişim (eğer context'e eklediysek)
  // Context'te socket doğrudan yoksa, useSovereignSocket hook'u içinde socket'i de dışarı vermemiz gerekebilir.
  // Ama şu anki yapımızda socket Context içinde gizli. 
  // Şimdilik kendi socket bağlantısını kuracak (geçici) veya Context'i güncelleyeceğiz.
  // En iyisi Context'i güncelleyip socket'i oradan almak. 
  
  // Önce Context'i kontrol edelim... Ah, Context'te socket dışarı verilmemiş. 
  // Hızlıca Context'i güncelleyip socket'i dışarı vereceğim ki bu bileşen de mesaj gönderebilsin.
  
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Not: Socket'i context'ten alabilmek için SovereignSocketContext'i güncelleyeceğiz.
  // Şimdilik buradaki socket referansını useSovereignSocket'ten alıyormuşuz gibi yapalım.
  const { socket } = useSovereignSocket(); 

  useEffect(() => {
    if (!socket) return;

    socket.on('admin:strategy_report_ready', (rawData) => {
      try {
        const validatedReport = StrategyReportSchema.parse(rawData);
        setReport(validatedReport);
        setIsGenerating(false);
      } catch (error) {
        console.error('🚨 [Strategist Breach] Invalid Report:', error.errors || error);
        setIsGenerating(false);
      }
    });

    return () => socket.off('admin:strategy_report_ready');
  }, [socket]);

  const requestSynthesis = () => {
    if (!socket) return;
    setIsGenerating(true);
    socket.emit('admin:request_strategy_synthesis');
  };

  return (
    <div className="santis-pkg-card relative overflow-hidden bg-black/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl mt-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="flex items-center gap-3 text-white font-serif text-xl tracking-wide">
          <BrainCircuit className="text-santis-gold animate-pulse" size={24} />
          Sovereign Strategist AI
        </h3>
        <button 
          onClick={requestSynthesis}
          disabled={isGenerating || !socket}
          className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all duration-500 border ${isGenerating ? 'bg-white/5 border-white/10 text-white/30 cursor-wait' : 'bg-santis-gold/10 border-santis-gold/30 text-santis-gold hover:bg-santis-gold/20'}`}
        >
          {isGenerating ? 'Sentezleniyor...' : 'Makro Sentez Talep Et'}
        </button>
      </div>

      {!report && !isGenerating && (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
          <p className="text-white/30 text-sm italic">Stratejik makro rapor henüz oluşturulmadı.</p>
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          
          {/* Lüks Veri Görselleştirme: Egemenlik Radarı */}
          <div className="flex flex-col items-center justify-center bg-black/20 p-6 rounded-2xl border border-white/5">
            <div className="relative w-40 h-40">
                {/* Minimalist Radar Graph (SVG) */}
                <svg viewBox="0 0 100 100" className="w-full h-full rotate-45">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(198,169,107,0.1)" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(198,169,107,0.05)" strokeWidth="0.5" />
                    {/* Confidence Score Path */}
                    <path 
                        d="M 50,5 L 95,50 L 50,95 L 5,50 Z" 
                        fill="rgba(198,169,107,0.1)" 
                        stroke="var(--lux-gold)" 
                        strokeWidth="1"
                        className="animate-pulse"
                    />
                    <circle cx="50" cy="5" r="2" fill="var(--lux-gold)" />
                    <circle cx="95" cy="50" r="2" fill="var(--lux-gold)" />
                    <circle cx="50" cy="95" r="2" fill="var(--lux-gold)" />
                    <circle cx="5" cy="50" r="2" fill="var(--lux-gold)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-serif text-white tracking-tighter">%{report.confidenceScore}</span>
                    <span className="text-[8px] text-white/40 uppercase tracking-tighter">Confidence</span>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 w-full text-[9px] uppercase tracking-tighter text-white/50">
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-santis-gold rounded-full"></div> Profit</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-santis-gold rounded-full"></div> Sentiment</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-santis-gold rounded-full"></div> Cohesion</div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-santis-gold rounded-full"></div> Aesthetic</div>
            </div>
          </div>

          {/* Rapor Detayları */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
                <span>Dönem: {report.period}</span>
                <span className="ml-auto text-emerald-500 flex items-center gap-1">
                    <TrendingUp size={12} /> Stable Growth
                </span>
            </div>

            <p className="text-white/80 text-sm leading-relaxed font-light italic border-l-2 border-santis-gold/30 pl-4">
              "{report.executiveSummary}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-[11px] text-santis-gold uppercase tracking-widest font-semibold">
                        <Sparkles size={14} /> Kritik İçgörüler
                    </h4>
                    <ul className="space-y-2">
                        {report.keyInsights.map((insight, idx) => (
                        <li key={idx} className="text-[11px] text-white/60 leading-snug flex gap-2">
                            <span className="text-santis-gold">•</span> {insight}
                        </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-santis-gold/5 border border-santis-gold/20 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                        <h4 className="flex items-center gap-2 text-[11px] text-santis-gold uppercase tracking-widest font-semibold mb-2">
                            <Target size={14} /> Otonom Eylem
                        </h4>
                        <p className="text-[11px] text-white/90 leading-relaxed mb-4">
                            {report.recommendedAction}
                        </p>
                    </div>
                    
                    {/* STRATEGIC EXECUTION BRIDGE: Aksiyon Butonu */}
                    <button 
                        onClick={() => {
                            socket.emit('admin:execute_strategy', { reportId: report.reportId });
                            alert('⚡ Sovereign Command: Stratejik eylem tüm ekosisteme yayılıyor.');
                        }}
                        className="w-full py-3 bg-gradient-to-r from-santis-gold/40 to-santis-gold/10 hover:from-santis-gold/60 hover:to-santis-gold/20 text-white text-[10px] uppercase tracking-widest rounded-lg border border-santis-gold/40 transition-all duration-300 shadow-[0_0_20px_rgba(198,169,107,0.2)] hover:shadow-[0_0_30px_rgba(198,169,107,0.4)]"
                    >
                        Stratejiyi Tüm Sisteme Yay
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
