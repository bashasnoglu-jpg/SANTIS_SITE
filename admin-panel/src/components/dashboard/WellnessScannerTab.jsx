import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import SovereignAura from './SovereignAura';

// Yeni inşa ettiğimiz meditatif sensör kancasını içeri aktarıyoruz
import { useVoiceVisualizer } from '../../hooks/useVoiceVisualizer';
import { useTelemetryBeacon } from '../../hooks/useTelemetryBeacon';

// ----------------------------------------------------------------------
// ETİK WELLNESS DENEYİMİ (Stash Status: HEALTHY)
// Şeffaflık, dürüstlük ve kullanıcı rızasına (consent) dayalı mimari.
// ----------------------------------------------------------------------

export default function WellnessScannerTab() {
  const [scanComplete, setScanComplete] = useState(false);
  
  // Otonom kancamızı sisteme bağlıyoruz
  const { isListening, visualIntensity, startListening, stopListening } = useVoiceVisualizer();
  const { sendBeacon } = useTelemetryBeacon();

  const handleStartExperience = () => {
    setScanComplete(false);
    startListening(); // Mikrofonu ve analizi başlat
    
    // TELEMETRİ: Seans başlatıldı logunu sunucuya ateşle
    sendBeacon('SESSION_STARTED', { expectedDurationMs: 8000 });
    
    // 8 saniyelik rahatlatıcı bir dinleme simülasyonu
    setTimeout(() => {
      stopListening(); // Donanımı güvenle kapat (Sıfır İz)
      setScanComplete(true); // Şeffaf paketleri göster
      
      // TELEMETRİ: Seans hatasız tamamlandı, paketler kullanıcıya sunuldu
      sendBeacon('SESSION_COMPLETED', { status: 'success' });
    }, 8000);
  };

  const handlePackageClick = (packageType) => {
    // TELEMETRİ: Kullanıcının hangi pakete ilgi gösterdiğini kaydet
    sendBeacon('PACKAGE_VIEWED', { packageId: packageType });
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto p-8 bg-sovereign-dark rounded-2xl border border-sovereign-brass/20 shadow-2xl overflow-hidden">
      
      {/* 3D ARKA PLAN: SOVEREIGN AURA (MEDİTATİF ZEN KÜRESİ) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <SovereignAura intensity={visualIntensity} />
        </Canvas>
      </div>

      <div className="relative z-10">
        <header className="mb-12 border-b border-sovereign-brass/10 pb-8 text-center">
        <h2 className="text-3xl text-sovereign-brass font-light tracking-widest uppercase">
          Holistik Dinlenme Deneyimi
        </h2>
        <p className="mt-4 text-base text-sovereign-muted tracking-wide max-w-2xl mx-auto leading-relaxed">
          Bu analiz tıbbi bir teşhis aracı değildir. Amacımız, sesinizin ritmini ve genel enerjinizi görselleştirerek size en uygun Karadağ yenilenme protokolünü şeffaf bir şekilde sunmaktır.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!scanComplete ? (
          <Motion.div 
            key="scanner-mode"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center py-12"
          >
            {/* DİNAMİK BİYOFEEDBACK HALKASI */}
            <Motion.div 
              // Ses şiddetine (visualIntensity) göre boyut (scale) ve opaklık değişir
              animate={{ 
                scale: isListening ? 1 + (visualIntensity * 0.5) : 1,
                opacity: isListening ? 0.4 + (visualIntensity * 0.6) : 0.5,
                boxShadow: isListening 
                  ? `0px 0px ${20 + visualIntensity * 40}px rgba(198, 169, 107, ${0.2 + visualIntensity * 0.3})` 
                  : "0px 0px 0px rgba(198, 169, 107, 0)"
              }}
              // Ani sıçramaları önleyen yumuşak yay (spring) animasyonu
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="w-32 h-32 rounded-full border border-sovereign-brass/50 flex items-center justify-center mb-8 bg-sovereign-brass/5"
            >
              <div className="w-24 h-24 rounded-full bg-sovereign-brass/20 backdrop-blur-md"></div>
            </Motion.div>

            <button 
              onClick={handleStartExperience}
              disabled={isListening}
              className="px-8 py-4 bg-sovereign-brass text-sovereign-dark rounded font-medium tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isListening ? "Ses Ritminiz Görselleştiriliyor..." : "Deneyimi Başlat (Mikrofon İzni Gerekir)"}
            </button>
          </Motion.div>
        ) : (
          <Motion.div 
            key="results-mode"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-center mb-10">
              <h3 className="text-xl text-white font-light tracking-wide">Analiz Tamamlandı</h3>
              <p className="text-sm text-sovereign-muted mt-2">İhtiyaçlarınıza uygun, şeffaf olarak fiyatlandırılmış protokollerimiz:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-8 border border-white/10 rounded-xl bg-sovereign-surface hover:border-sovereign-brass/30 transition-colors">
                <h4 className="text-lg text-sovereign-brass tracking-wider uppercase mb-2">Temel Yenilenme</h4>
                <p className="text-sm text-sovereign-muted mb-6 h-10">Kısa süreli dinlenme ve temel IV destekleri.</p>
                <div className="text-3xl text-white font-light mb-6">$3,500</div>
                <button 
                  onClick={() => handlePackageClick('basic_renewal_3500')}
                  className="w-full py-3 border border-sovereign-brass/50 text-sovereign-brass rounded hover:bg-sovereign-brass hover:text-sovereign-dark transition-colors"
                >
                  İçeriği İncele
                </button>
              </div>

              <div className="p-8 border border-sovereign-brass/30 rounded-xl bg-sovereign-surface hover:border-sovereign-brass/50 transition-colors">
                <h4 className="text-lg text-sovereign-brass tracking-wider uppercase mb-2">Sovereign Optimum</h4>
                <p className="text-sm text-sovereign-muted mb-6 h-10">Tam kapsamlı Karadağ inzivası, Sothys Paris bakımları ve holistik koçluk.</p>
                <div className="text-3xl text-white font-light mb-6">$8,500</div>
                <button 
                  onClick={() => handlePackageClick('sovereign_optimum_8500')}
                  className="w-full py-3 bg-sovereign-brass text-sovereign-dark rounded hover:bg-white transition-colors"
                >
                  İçeriği İncele
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <button 
                onClick={() => setScanComplete(false)}
                className="text-xs text-sovereign-muted underline hover:text-white transition-colors"
              >
                Deneyimi Yeniden Başlat
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
