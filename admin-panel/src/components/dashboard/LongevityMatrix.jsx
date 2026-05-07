import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

// ----------------------------------------------------------------------
// SATIŞ MATRİSİ (Decoy Effect)
// Fiyatlandırma algısını manipüle etmek için tasarlanmış 3'lü mimari
// ----------------------------------------------------------------------

const THEME = {
  colors: {
    bgCard: "bg-sovereign-dark/80 backdrop-blur-xl",
    borderBase: "border-white/5",
    borderHighlight: "border-sovereign-gold/50 fx-glow-soft-gold",
    textBrass: "text-sovereign-gold",
    textWhite: "text-zinc-50",
    textMuted: "text-zinc-500"
  }
};

export default function LongevityMatrix({ userStressScore }) {
  // Stres skoru 50'yi aşarsa, hastanın durumu "Kritik" olarak etiketlenir 
  // ve Sovereign paketin ikna gücü artırılır.
  const isCritical = userStressScore > 50;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-6xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className={`text-2xl font-light uppercase tracking-widest ${THEME.colors.textBrass}`}>
          Terapötik Protokoller
        </h2>
        <p className={`mt-2 text-sm uppercase tracking-widest ${THEME.colors.textMuted}`}>
          Biyometrik Veri: {isCritical ? "Yüksek Hücresel Yıkım Tespit Edildi" : "Hücresel Optimizasyon Öneriliyor"}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
        
        {/* 1. ENTRY (YEM / DECOY) - Sadece referans noktası oluşturmak için var */}
        <motion.div variants={cardVariants} className={`flex-1 w-full max-w-sm p-8 rounded-2xl border ${THEME.colors.borderBase} ${THEME.colors.bgCard} opacity-60 hover:opacity-100 transition-opacity`}>
          <h3 className={`text-lg font-medium tracking-wide ${THEME.colors.textWhite}`}>Temel Onarım</h3>
          <p className={`mt-2 text-xs ${THEME.colors.textMuted} h-12`}>Sınırlı NAD+ infüzyonu. Yalnızca yüzey seviyesi yorgunluklar için.</p>
          <div className="my-8">
            <span className={`text-3xl font-light ${THEME.colors.textWhite}`}>$3,500</span>
          </div>
          <button className="w-full py-3 rounded-lg border border-white/10 text-white/70 text-sm tracking-wider hover:bg-white/5 transition-colors">
            Protokolü Seç
          </button>
        </motion.div>

        {/* 2. SOVEREIGN CHOICE (HEDEF) - Algısal olarak en mantıklı seçenek */}
        <motion.div variants={cardVariants} className={`flex-1 w-full max-w-md p-10 rounded-2xl border ${THEME.colors.borderHighlight} ${THEME.colors.bgCard} transform lg:-translate-y-4 relative z-10`}>
          {/* Dikkat çekici rozet */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sovereign-gold text-sovereign-dark px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg">
            Sovereign Optimum
          </div>
          
          <h3 className={`text-xl font-medium tracking-wide ${THEME.colors.textBrass}`}>Klinik Diriliş Matrisi</h3>
          <p className={`mt-2 text-sm ${THEME.colors.textWhite} h-12`}>
            {isCritical 
              ? "Akustik analiziniz yoğun yıkım gösteriyor. Bu paket sizin için hücresel zorunluluktur." 
              : "Tam kapsamlı Eksozom ve maksimum doz NAD+ ile hücresel reset."}
          </p>
          <div className="my-8">
            <span className={`text-5xl font-light ${THEME.colors.textBrass}`}>$8,500</span>
          </div>
          <ul className="space-y-4 mb-8 text-sm text-zinc-400">
            <li className="flex items-center gap-3"><span className="text-sovereign-gold">✓</span> Sothys Paris Entegrasyonu</li>
            <li className="flex items-center gap-3"><span className="text-sovereign-gold">✓</span> 7/24 Biyometrik Takip</li>
            <li className="flex items-center gap-3"><span className="text-sovereign-gold">✓</span> Karadağ VIP Transfer</li>
          </ul>
          <button className="w-full py-4 rounded-lg bg-sovereign-gold text-sovereign-dark font-semibold text-sm tracking-widest uppercase hover:bg-white hover:shadow-lg hover:shadow-white/20 transition-all">
            Klinik Kaydı Başlat
          </button>
        </motion.div>

        {/* 3. ANCHOR (ÇAPA) - 8.500$ fiyatını "ucuz" göstermek için var olan ulaşılamaz lüks */}
        <motion.div variants={cardVariants} className={`flex-1 w-full max-w-sm p-8 rounded-2xl border ${THEME.colors.borderBase} ${THEME.colors.bgCard} opacity-60 hover:opacity-100 transition-opacity`}>
          <h3 className={`text-lg font-medium tracking-wide ${THEME.colors.textWhite}`}>God-System İzolasyonu</h3>
          <p className={`mt-2 text-xs ${THEME.colors.textMuted} h-12`}>Aylık özel Karadağ inzivası ve sınırsız genetik modifikasyon.</p>
          <div className="my-8">
            <span className={`text-3xl font-light ${THEME.colors.textWhite}`}>$25,000</span>
            <span className={`text-xs ${THEME.colors.textMuted}`}> /aylık</span>
          </div>
          <button className="w-full py-3 rounded-lg border border-white/10 text-white/70 text-sm tracking-wider hover:bg-white/5 transition-colors">
            Konsey Onayı İste
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}
