import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars


// Biyometrik Sensör Kancası
import { useVocalScanner } from '../../hooks/useVocalScanner';

// İzole Edilmiş Alt Modüller
import QuantumCell from './QuantumCell';
import CognitiveUI from './CognitiveUI';
import LongevityMatrix from './LongevityMatrix';

// ----------------------------------------------------------------------
// GOD-SYSTEM KAPSAYICISI (Container Component)
// Tüm modüllerin veri akışını ve sahne geçişlerini yöneten mutlak çekirdek
// ----------------------------------------------------------------------

export default function GodSystemScanner() {
  // Otonom Sensör Verileri
  const { isListening, cortisolScore, startScan, stopScan, error } = useVocalScanner();
  
  // Sahne Yönetimi Durumları
  const [showMatrix, setShowMatrix] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Otonom Karar Motoru: 19 Saniyelik Tarama Döngüsü
  useEffect(() => {
    let timer;
    if (isListening) {
      // Hasta butona bastığında, tam olarak 4-7-8 nefes döngüsünün 
      // sonuna kadar (19 saniye) sesi analiz et.
      timer = setTimeout(() => {
        setFinalScore(cortisolScore); // Matris için skoru kilitle (Determinizm)
        stopScan();                   // Mikrofonu kapat, gizlilik illüzyonu yarat
        setShowMatrix(true);          // Kognitif arayüzü sil, Satış Matrisini yükle
      }, 19000); 
    }
    
    return () => clearTimeout(timer);
  }, [isListening, cortisolScore, stopScan]);

  return (
    <main className="relative w-full h-screen bg-sovereign-dark overflow-hidden selection:bg-sovereign-gold/30 font-sans">
      
      {/* 1. KATMAN: Görsel Gerçeklik (Holografik Kuantum Hücresi) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ambientLight intensity={0.6} />
          {/* Sahne değişse bile Kuantum Hücresi arka planda kilitlenen skorla dönmeye devam eder */}
          <QuantumCell stressLevel={showMatrix ? finalScore : cortisolScore} />
        </Canvas>
      </div>

      {/* 2. KATMAN: Nöro-Mimari ve Ticari Gerçeklik */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          
          {/* SAHNE A: Kognitif Manipülasyon Arayüzü */}
          {!showMatrix ? (
            <motion.div
              key="cognitive-ui"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50, filter: "blur(20px)" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex justify-center mt-20"
            >
              <CognitiveUI 
                isListening={isListening} 
                onStartScan={startScan} 
              />
            </motion.div>
          ) : (
            
            /* SAHNE B: Longevity Satış Matrisi (Decoy Effect) */
            <motion.div
              key="longevity-matrix"
              initial={{ opacity: 0, y: 50, filter: "blur(20px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex justify-center mt-32 pb-32"
            >
              <LongevityMatrix userStressScore={finalScore} />
            </motion.div>
            
          )}
        </AnimatePresence>

        {/* Güvenlik ve Hata Protokolü */}
        {error && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute bottom-10 text-red-500/80 text-xs tracking-[0.2em] uppercase bg-black/50 px-6 py-2 rounded-full border border-red-500/20 backdrop-blur-md"
          >
            [SİSTEM UYARISI]: {error}
          </motion.div>
        )}
      </div>

    </main>
  );
}
