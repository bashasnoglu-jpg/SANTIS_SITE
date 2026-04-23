import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ----------------------------------------------------------------------
// KOGNİTİF TASARIM MANİFESTOSU (Single Source of Truth)
// İsli Sıcak Gri ve Mat Pirinç renk kodları ile Nöro-Biyolojik animasyonlar
// ----------------------------------------------------------------------

const THEME = {
  colors: {
    textBrass: "text-sovereign-gold",
    bgBrass: "bg-sovereign-gold",
    borderBrass: "border-sovereign-gold/30",
    textMuted: "text-sovereign-gold/60"
  }
};

export default function CognitiveUI({ isListening, onStartScan }) {
  // LLM Tetiklenme Durumu
  const [isLLMTriggered, setIsLLMTriggered] = useState(false);
  const hoverTimer = useRef(null);

  // 3 Saniyelik Hover Deşifresi (Intent Detection)
  const handleMouseEnter = () => {
    if (!isLLMTriggered) {
      hoverTimer.current = setTimeout(() => {
        // 3 saniye dolduğunda arkaplan LLM'sine sinyal gitmiş varsayılır ve UI güncellenir
        setIsLLMTriggered(true);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
  };

  // Bileşen silindiğinde timer'ı temizle (Memory Leak önlemi)
  useEffect(() => {
    return () => clearTimeout(hoverTimer.current);
  }, []);

  // 4-7-8 Biyometrik Nefes Animasyonu (Framer Motion)
  // Büyüme (4s), Tutma (7s), Sönme (8s) = Toplam 19 Saniye
  const breathingVariants = {
    animate: {
      scale: [1, 1.05, 1.05, 1],
      boxShadow: [
        "0px 0px 0px rgba(198, 169, 107, 0)",
        "0px 0px 40px rgba(198, 169, 107, 0.2)",
        "0px 0px 40px rgba(198, 169, 107, 0.2)",
        "0px 0px 0px rgba(198, 169, 107, 0)"
      ],
      transition: {
        duration: 19,
        times: [0, 4/19, 11/19, 1], // Animasyonun kilit kare zamanlamaları
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full z-10">
      
      {/* 1. Başlık Modülü & Hover Deşifresi */}
      <div className="text-center mb-16 h-32 flex flex-col justify-end">
        <AnimatePresence mode="wait">
          {!isLLMTriggered ? (
            <motion.div
              key="default-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: "blur(10px)", y: -10 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className={`text-4xl md:text-5xl font-light tracking-widest uppercase ${THEME.colors.textBrass}`}>
                Hücresel Gerçeklik
              </h1>
              <p className={`mt-4 text-sm tracking-[0.2em] uppercase ${THEME.colors.textMuted}`}>
                Sistem otonominizi analiz etmeye hazır.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="llm-title"
              initial={{ opacity: 0, filter: "blur(20px) brightness(2)" }}
              animate={{ opacity: 1, filter: "blur(0px) brightness(1)" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className={`text-3xl md:text-4xl font-semibold tracking-wide ${THEME.colors.textBrass}`}>
                Tükenmişliği reddedin. <br/> 
                <span className="font-light italic text-white/90">Mitokondriyal dirilişiniz için tam zamanı.</span>
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Etkileşim Alanı (Hover Hedefi) & NAD+ Kartı */}
      <motion.div 
        className={`p-6 md:p-10 border ${THEME.colors.borderBrass} bg-black/40 backdrop-blur-md rounded-2xl w-full max-w-lg text-center cursor-crosshair transition-colors hover:bg-black/60`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1 }}
      >
        <h2 className={`text-xl font-medium tracking-widest ${THEME.colors.textBrass} mb-2`}>NAD+ INFUSION PROTOCOL</h2>
        <p className={`text-xs ${THEME.colors.textMuted} mb-8 leading-relaxed`}>
          {isLLMTriggered 
            ? "[Kognitif kilit açıldı. Tıbbi matris sizin için yeniden hesaplanıyor...]"
            : "[Lütfen bu bölgede bekleyin. Sistem zihinsel rezonansınızı okuyor.]"}
        </p>

        {/* 3. Biyometrik Buton (4-7-8 Nefes Animasyonu) */}
        {!isListening ? (
          <motion.button
            variants={breathingVariants}
            animate="animate"
            onClick={onStartScan}
            className={`px-8 py-4 rounded-full border border-sovereign-gold/50 text-sovereign-gold text-sm tracking-[0.15em] uppercase hover:bg-sovereign-gold hover:text-[#141416] transition-colors duration-500`}
          >
            VIP Concierge'i Başlat
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center space-x-3"
          >
            <div className="w-2 h-2 bg-sovereign-gold rounded-full animate-ping"></div>
            <span className={`text-sm tracking-widest uppercase ${THEME.colors.textBrass}`}>
              Biyobelirteçler Analiz Ediliyor...
            </span>
          </motion.div>
        )}
      </motion.div>

    </div>
  );
}
