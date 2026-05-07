import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

// ----------------------------------------------------------------------
// BİYOMETRİK İSTATİSTİK PANELİ (Stash Status: HEALTHY)
// Sadece tailwind.config.js içindeki deterministik token'lar kullanılmıştır.
// ----------------------------------------------------------------------

export default function BiometricStatsPanel({ 
  cortisolScore = 88, 
  nadLevel = 34, 
  resurrectionRate = 12 
}) {
  
  // Hareket Token'ları: 120 FPS akıcılık ve özel easing eğrisi
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 }, // y: 16 (Spacing Token: '4' yani 16px)
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } // quiet-luxury eğrisi
    }
  };

  return (
    // bg-sovereign-dark: İlkel palet
    // p-8: 8 noktalı ölçek (32px)
    <div className="w-full max-w-5xl mx-auto p-8 bg-sovereign-dark rounded-2xl border border-sovereign-brass/20 shadow-2xl">
      
      {/* BAŞLIK MODÜLÜ */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-sovereign-brass/10 pb-6">
        <div>
          {/* text-2xl: Majör Üçlü Ölçeği (31px) */}
          <h2 className="text-2xl text-sovereign-brass font-light tracking-widest uppercase">
            Hücresel Telemetri
          </h2>
          <p className="mt-2 text-sm text-sovereign-muted uppercase tracking-wider flex items-center gap-2">
            Stash Durumu: 
            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded border border-green-500/20 text-xs">
              Kullanıma Uygun (Healthy)
            </span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-sm text-sovereign-muted tracking-widest">CANLI MATRİS BAĞLANTISI</span>
        </div>
      </header>

      {/* VERİ GRID MODÜLÜ */}
      {/* gap-6: 8 noktalı ölçek (24px boşluk) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        
        {/* KART 1: Kortizol Yıkımı */}
        {/* bg-sovereign-surface: Yarı saydam izolasyon */}
        {/* ease-quiet-luxury: Konfigürasyondan çekilen hareket token'ı */}
        <motion.div variants={itemVariants} className="p-6 bg-sovereign-surface rounded-xl border border-white/5 relative overflow-hidden group hover:border-sovereign-brass/30 transition-colors duration-500 ease-quiet-luxury">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700 ease-quiet-luxury"></div>
          <h3 className="text-base text-sovereign-muted tracking-wide">Kortizol Skoru</h3>
          <div className="mt-4 flex items-baseline gap-2">
            {/* text-4xl: Majör Üçlü Ölçeği (48px) */}
            <span className="text-4xl text-white font-light">{cortisolScore}</span>
            <span className="text-sm text-sovereign-muted">/ 100</span>
          </div>
          <p className="mt-4 text-xs text-red-400 uppercase tracking-widest">Kritik Hücresel Yıkım</p>
        </motion.div>

        {/* KART 2: NAD+ İnfüzyonu */}
        <motion.div variants={itemVariants} className="p-6 bg-sovereign-surface rounded-xl border border-white/5 relative overflow-hidden group hover:border-sovereign-brass/30 transition-colors duration-500 ease-quiet-luxury">
          <div className="absolute top-0 left-0 w-full h-1 bg-sovereign-brass/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700 ease-quiet-luxury"></div>
          <h3 className="text-base text-sovereign-muted tracking-wide">NAD+ Rezervi</h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl text-white font-light">{nadLevel}</span>
            <span className="text-sm text-sovereign-muted">%</span>
          </div>
          <p className="mt-4 text-xs text-sovereign-brass uppercase tracking-widest">Tüketilmiş Durumda</p>
        </motion.div>

        {/* KART 3: Hücresel Diriliş */}
        <motion.div variants={itemVariants} className="p-6 bg-sovereign-surface rounded-xl border border-white/5 relative overflow-hidden group hover:border-sovereign-brass/30 transition-colors duration-500 ease-quiet-luxury">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700 ease-quiet-luxury"></div>
          <h3 className="text-base text-sovereign-muted tracking-wide">Hücresel Diriliş</h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl text-white font-light">{resurrectionRate}</span>
            <span className="text-sm text-sovereign-muted">%</span>
          </div>
          <p className="mt-4 text-xs text-sovereign-muted uppercase tracking-widest">Sovereign Matrix Bekleniyor</p>
        </motion.div>

      </motion.div>
    </div>
  );
}
