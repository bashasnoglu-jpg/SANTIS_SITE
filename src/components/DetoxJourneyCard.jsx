import React, { useState } from 'react';

export default function DetoxJourneyCard({ isUserLoggedIn }) {
  const [status, setStatus] = useState("idle"); // idle, locking, locked
  
  const basePrice = 270;
  const packagePrice = 229.5; // %15 İndirimli
  const memberPrice = 218;    // Ekstra %5 İndirimli

  const handleReservation = async () => {
    setStatus("locking");
    // Backend acquireUltraMegaLock API'si tetiklenir
    setTimeout(() => setStatus("locked"), 1500); 
  };

  return (
    // CAM EFEKTİ (Glassmorphism) KAPSAYICI - Deep Charcoal & Gold
    <div className="relative w-full max-w-md p-8 overflow-hidden rounded-3xl bg-[#121214]/80 backdrop-blur-xl border border-lux-gold/30 shadow-2xl transition-all duration-500 hover:border-lux-gold/60">
      
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-light tracking-widest text-lux-gold uppercase">İmza Koleksiyon</span>
        {isUserLoggedIn && (
           <span className="px-3 py-1 bg-lux-gold/10 text-lux-gold text-[10px] rounded-full border border-lux-gold/30">VIP ÜYE</span>
        )}
      </div>

      <h2 className="text-3xl font-light text-white font-serif mb-2">Arınma & Detoks</h2>
      <p className="text-sm text-gray-400 font-light mb-6">
        Fas Hamamı, Karbon Peeling ve Refleksoloji ile 150 dakikalık toksinlerden arınma ritüeli.
      </p>

      {/* Fiyat ve Growth Hack Alanı */}
      <div className="p-5 rounded-2xl bg-black/50 border border-white/5 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-gray-500 line-through mb-1">Tekil Fiyat: €{basePrice}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-white">€{isUserLoggedIn ? memberPrice : packagePrice}</span>
            </div>
          </div>
          
          {/* ÜYE DEĞİLSE HAVUCU GÖSTER (FOMO) */}
          {!isUserLoggedIn ? (
            <div className="text-right">
              <button className="text-[11px] uppercase tracking-wider text-lux-gold hover:text-white transition-colors border-b border-lux-gold/30 pb-0.5">
                Santis Club'a Katıl
              </button>
              <p className="text-[10px] text-gray-400 mt-1">Ekstra %5 indirimle <strong>€218</strong> öde</p>
            </div>
          ) : (
             <div className="text-right">
               <p className="text-xs text-lux-gold mt-1">✨ %15 Paket + %5 VIP İndirimi</p>
             </div>
          )}
        </div>
      </div>

      {/* Rezervasyon Butonu */}
      <button 
        onClick={handleReservation}
        disabled={status !== "idle"}
        className={`w-full py-4 rounded-xl font-medium tracking-wide transition-all duration-300 flex justify-center items-center gap-2 text-sm
          ${status === "locked" ? "bg-emerald-900/80 text-emerald-200 border border-emerald-500/50" : 
            "bg-gradient-to-r from-lux-gold to-[#B08D28] text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"}`}
      >
        {status === "locking" ? "SİSTEM KİLİTLENİYOR..." : 
         status === "locked" ? "✓ YERİNİZ AYRILDI (10 DK)" : "HEMEN REZERVE ET"}
      </button>
    </div>
  );
}
