import React from 'react';

export default function SovereignDashboard() {
  return (
    <main className="min-h-screen bg-black text-[#D4AF37] selection:bg-[#D4AF37]/30 selection:text-white">
      {/* VANTA-BLACK DEPTH: 
        Tailwind v4 ile gelen 'bg-black' artık çok daha derin. 
        Burada bir 'radial-gradient' ile o sessiz lüks derinliğini veriyoruz.
      */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        
        {/* SOVEREIGN SEAL - Altın Mühür Animasyonu */}
        <div className="mb-12 animate-in fade-in zoom-in duration-1000 ease-out">
          <div className="relative w-32 h-32 flex items-center justify-center border border-[#D4AF37]/20 rounded-full bg-black/50 backdrop-blur-xl shadow-[0_0_40px_rgba(212,175,55,0.1)]">
            <span className="text-5xl font-serif tracking-tighter select-none">S</span>
            {/* Altın Parıltı Efekti */}
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/40 animate-pulse" />
          </div>
        </div>

        {/* WELCOME TEXT - Minimalist Otorite */}
        <header className="text-center space-y-4 max-w-2xl">
          <h1 className="text-sm uppercase tracking-[0.5em] font-light text-[#D4AF37]/80 animate-in slide-in-from-bottom duration-700 delay-300">
            SANTIS SOVEREIGN OS
          </h1>
          <p className="text-4xl md:text-5xl font-serif font-light text-white leading-tight animate-in slide-in-from-bottom duration-1000 delay-500">
            Sığınağa Hoş Geldiniz.
          </p>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-8 opacity-50" />
        </header>

        {/* DASHBOARD CARDS - Quiet Luxury UX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
          
          <DashboardCard 
            title="RİTÜELLER" 
            desc="Sothys aromalı özel seanslar." 
            count="3 Aktif"
          />
          
          <DashboardCard 
            title="SANCTUARY" 
            desc="Kişisel dinlenme alanı ve veriler." 
            active
          />
          
          <DashboardCard 
            title="KONSİYERJ" 
            desc="Sovereign asistanınız hazır." 
            count="2 Mesaj"
          />

        </div>

        {/* FOOTER - Status Bar */}
        <footer className="mt-auto pt-16 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/40">
          Sovereign OS v4.2.2 • Secure Connection Established
        </footer>
      </div>
    </main>
  );
}

// Alt Bileşen: Dashboard Kartı
function DashboardCard({ title, desc, count, active }: { title: string, desc: string, count?: string, active?: boolean }) {
  return (
    <div className={`
      group relative p-8 border border-[#D4AF37]/10 bg-black/40 backdrop-blur-md 
      transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
      hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.02] hover:-translate-y-1
      hover:shadow-[0_8px_32px_-4px_rgba(212,175,55,0.15)] cursor-pointer
      ${active ? 'ring-1 ring-[#D4AF37]/20 shadow-[0_0_30px_rgba(212,175,55,0.05)]' : ''}
    `}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xs tracking-[0.2em] font-medium text-[#D4AF37]">{title}</h3>
          {count && <span className="text-[10px] text-white/40">{count}</span>}
        </div>
        <p className="text-white/60 text-sm font-light leading-relaxed group-hover:text-white transition-colors">
          {desc}
        </p>
      </div>
      {/* Kart Altı Parıltı (Line) */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/0 to-transparent group-hover:via-[#D4AF37]/60 transition-all duration-1000 ease-out" />
      
      {/* Vanta-Black Inner Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
}
