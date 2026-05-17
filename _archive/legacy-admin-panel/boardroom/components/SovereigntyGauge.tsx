import React from 'react';

interface GaugeProps {
  score: number;
  ghostScore?: number; // Tahmin edilen yeni puan (Opsiyonel)
}

const SovereigntyGauge: React.FC<GaugeProps> = ({ score, ghostScore }) => {
  const isNegative = ghostScore !== undefined && ghostScore < score;
  const showGhost = ghostScore !== undefined && ghostScore !== score;

  return (
    <div className="relative flex flex-col items-center p-6 bg-slate-900/80 border border-slate-800 rounded-xl mb-6 backdrop-blur-md overflow-hidden">
      {/* Arka Plan Glow Efekti (Skora göre renk değiştirir) */}
      <div className={`absolute -top-24 -left-24 w-48 h-48 blur-[100px] opacity-20 rounded-full ${score > 50 ? 'bg-emerald-500' : 'bg-red-500'}`} />

      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-500 mb-2 z-10">
        Sovereignty Stability Index
      </span>
      
      <div className="flex items-baseline gap-2 z-10">
        <div className={`text-5xl font-mono font-black transition-all duration-1000 ${score > 50 ? 'text-emerald-400' : 'text-red-500'}`}>
          {score}%
        </div>
        {showGhost && (
          <div className={`text-xl font-mono font-bold animate-pulse ${isNegative ? 'text-red-500' : 'text-blue-400/60'}`}>
            → {ghostScore}%
          </div>
        )}
      </div>

      <div className="relative w-full max-w-full sm:w-64 h-2 bg-slate-800 rounded-full mt-4 overflow-hidden z-10">
        {/* Ana Bar (Gerçek Stabilite) */}
        <div 
          className={`absolute top-0 left-0 h-full z-20 transition-all duration-1000 ease-out ${isNegative ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${isNegative ? ghostScore : score}%` }}
        />
        
        {/* Hayalet Bar (İleri Sıçrama: Mavi | Geri Çöküş: Kırmızı-Siyah) */}
        {showGhost && (
          <div 
            className={`absolute top-0 h-full z-10 transition-all duration-700 animate-pulse ${isNegative ? 'bg-red-900/60' : 'bg-blue-400/80'}`}
            style={{ 
              left: `${isNegative ? ghostScore : score}%`, 
              width: `${Math.abs((ghostScore || 0) - score)}%` 
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SovereigntyGauge;

