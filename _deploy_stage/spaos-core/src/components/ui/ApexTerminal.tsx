import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { create } from 'zustand';
import { Fingerprint, Target, Activity, Zap, X, Crosshair, ChevronRight, Sparkles } from 'lucide-react';

// ============================================================================
// 🧠 REAKTÖR 1: ZİHİN KONTROL MERKEZİ (Sıfır Gecikme / Zero-Latency)
// ============================================================================
interface ApexState {
  activeUniverse: string;
  ambientColor: string;
  focusedCard: any;
  isTunnelActive: boolean;
  shiftUniverse: (universe: string, hexColor: string) => void;
  sealTheProtocol: (card: any) => void;
  abortProtocol: () => void;
}

const useApexStore = create<ApexState>((set) => ({
  activeUniverse: 'ALL',
  ambientColor: 'rgba(255, 255, 255, 0.05)', // Obsidyen zemin üzerine Krom Işığı
  focusedCard: null,
  isTunnelActive: false,
  
  shiftUniverse: (universe, hexColor) => set({ activeUniverse: universe, ambientColor: hexColor, focusedCard: null }),
  sealTheProtocol: (card) => set({ focusedCard: card, isTunnelActive: true }),
  abortProtocol: () => set({ focusedCard: null, isTunnelActive: false })
}));

// ============================================================================
// ⚙️ REAKTÖR 2: TİTANYUM FİZİĞİ & İSVİÇRE VERİTABANI
// ============================================================================
// Acımasız, ağır ve keskin fizik (Alman otomobili kapısı tokluğu - Mass: 1.4)
const apexSpring = { type: "spring" as const, stiffness: 120, damping: 25, mass: 1.4 };
const noiseTexture = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' opacity='0.08' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";

const UNIVERSES = [
  { id: 'ALL', label: 'APEX BOARD', color: 'rgba(255, 255, 255, 0.05)', icon: Target },
  { id: 'HAMAM', label: 'THERMAL MÜHÜR', color: 'rgba(20, 184, 166, 0.15)', icon: Activity },
  { id: 'MASAJ', label: 'KINETIC FLOW', color: 'rgba(139, 92, 246, 0.15)', icon: Zap },
  { id: 'CİLT', label: 'CELLULAR', color: 'rgba(244, 63, 94, 0.15)', icon: Sparkles } // Ekledim ki Cilt de çalışsın
];

// Sparkles is now imported at the top with other lucide-react icons.

const MASTER_SERVICES = [
  { id: 'v4-1', universe: 'HAMAM', title: 'OSMANLI', subtitle: 'KROM & ALTIN YAPRAKLAR. Geleneksel ritüelin modern obsesyonu.', duration: '60 DK', price: '€ 150', img: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?q=80&w=1200&auto=format&fit=crop', accent: 'rgba(20, 184, 166, 0.5)' },
  { id: 'v4-2', universe: 'MASAJ', title: 'NIRVANA', subtitle: 'TİTANYUM TAŞLARI. Kas hafızasını sıfırlayan derin doku basıncı.', duration: '90 DK', price: '€ 220', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop', accent: 'rgba(139, 92, 246, 0.5)' },
  { id: 'v4-3', universe: 'CİLT', title: 'OBSIDIAN', subtitle: 'AKTİF KARBON PEELING. Cildin kuantum seviyesinde yenilenmesi.', duration: '45 DK', price: '€ 180', img: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=1200&auto=format&fit=crop', accent: 'rgba(244, 63, 94, 0.5)' },
  { id: 'v4-4', universe: 'MASAJ', title: 'ZERO-G', subtitle: 'YERÇEKİMSİZ ORTAM. Meditatif Thai esnemesi ve kinetik akış.', duration: '120 DK', price: '€ 300', img: 'https://images.unsplash.com/photo-1600334129128-68505d1115ba?q=80&w=1200&auto=format&fit=crop', accent: 'rgba(245, 158, 11, 0.5)' }
];

// ============================================================================
// 🌌 REAKTÖR 3: RAY-TRACING KART BİLEŞENİ (Donanım İvmeli Işık Kırılması)
// ============================================================================
const ApexCard = ({ service, index }: any) => {
  const sealTheProtocol = useApexStore(state => state.sealTheProtocol);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Farenin kart üzerindeki hareketini 60FPS yakala (React State DEĞİLDİR, render tetiklemez!)
  const handleMouseMove = ({ clientX, clientY }: React.MouseEvent) => {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  // GPU Shader Hesaplaması
  const rayTraceLight = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, ${service.accent}, transparent 60%)`;
  const glare = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.2), transparent 40%)`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      layoutId={`apex-card-${service.id}`}
      initial={{ opacity: 0, scale: 0.9, x: 100, filter: "grayscale(100%)" }}
      animate={{ opacity: 1, scale: 1, x: 0, filter: "grayscale(0%)" }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      transition={{ ...apexSpring, delay: index * 0.05 }}
      // Brutalizm: #020202 Arka plan ve dümdüz 2px köşeler.
      className="relative shrink-0 w-[320px] md:w-[380px] h-[500px] md:h-[580px] overflow-hidden group border border-white/10 bg-[#020202] rounded-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing"
    >
      {/* KROM VE IŞIK YANSIMALARI (Ray-Tracing - Fareyi Takip Eder) */}
      <motion.div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen" style={{ background: rayTraceLight }} />
      <motion.div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay" style={{ background: glare }} />

      {/* Görsel Katman - Başlangıçta Krom Solgunluğu */}
      <motion.img 
        layoutId={`apex-img-${service.id}`}
        src={service.img} 
        alt={service.title} 
        className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale-[80%] group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-[2s] ease-out group-hover:scale-110"
        draggable="false"
      />
      
      {/* Zifiri Obsidyen Geçiş */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/80 to-transparent opacity-95" />
      
      <motion.div layoutId={`apex-content-${service.id}`} className="absolute inset-0 p-8 flex flex-col justify-end pointer-events-none z-30">
        
        {/* İsviçre Bankacılığı Tipografisi (Monospace + Euro) */}
        <div className="flex justify-between items-end pb-6 mb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 ease-out border-b border-white/10">
          <span className="text-[10px] font-mono tracking-[0.4em] text-white/40 uppercase">{service.duration}</span>
          <span className="font-mono text-3xl font-light tracking-tighter text-white">{service.price}</span>
        </div>

        <motion.div layoutId={`apex-univ-${service.id}`} className="text-[9px] font-mono tracking-[0.4em] text-white/50 mb-3 uppercase flex items-center gap-2">
          <Crosshair size={12} className="animate-spin-slow" /> {service.universe}
        </motion.div>

        {/* Parçalı Başlık (Hacimsel) */}
        <motion.h3 layoutId={`apex-title-${service.id}`} className="text-5xl md:text-6xl font-black mb-4 tracking-tighter text-white leading-[0.85] uppercase">
          {service.title.split(' ').map((word: string, i: number) => <span key={i} className="block">{word}</span>)}
        </motion.h3>
        
        <motion.p layoutId={`apex-subtitle-${service.id}`} className="text-white/40 text-[11px] font-mono tracking-widest mb-8 line-clamp-2 uppercase border-l border-white/20 pl-4">{service.subtitle}</motion.p>
        
        <div className="pointer-events-auto">
          <button 
            onClick={() => sealTheProtocol(service)}
            className="w-full py-4 border border-white/10 flex items-center justify-between px-6 bg-transparent hover:bg-white hover:text-black transition-all duration-500 group/btn rounded-[2px]"
          >
            <span className="text-[10px] font-mono tracking-[0.3em] font-bold uppercase">SİSTEME BAĞLAN</span>
            <ChevronRight size={18} className="text-white/30 group-hover/btn:text-black group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// 🕳️ REAKTÖR 4: ANA TERMİNAL & HACİMSEL EXPANSION (GOD MODE)
// ============================================================================
export default function ApexTerminal({ initialCategory = 'ALL' }: { initialCategory?: string }) {
  const { activeUniverse, ambientColor, shiftUniverse, focusedCard, isTunnelActive, abortProtocol } = useApexStore();
  const carouselRef = useRef<HTMLDivElement>(null);

  // set initial
  useEffect(() => {
     if(initialCategory && initialCategory !== 'ALL'){
        const target = UNIVERSES.find(u => u.id === initialCategory);
        if(target) shiftUniverse(target.id, target.color);
     }
  }, [initialCategory]);

  // KÜRESEL IŞIK TAKİBİ (Global Dynamic Ambient Light)
  const globalMouseX = useMotionValue(0);
  const globalMouseY = useMotionValue(0);
  const smoothX = useSpring(globalMouseX, { damping: 40, stiffness: 100 });
  const smoothY = useSpring(globalMouseY, { damping: 40, stiffness: 100 });

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      // Işık farenin tersi yönünde hareket ederek derinlik hissi (parallax) yaratır.
      globalMouseX.set((window.innerWidth / 2 - e.clientX) * 0.5);
      globalMouseY.set((window.innerHeight / 2 - e.clientY) * 0.5);
    };
    window.addEventListener("mousemove", handleGlobalMove);
    return () => window.removeEventListener("mousemove", handleGlobalMove);
  }, []);

  const filteredServices = activeUniverse === 'ALL' ? MASTER_SERVICES : MASTER_SERVICES.filter(s => s.universe === activeUniverse);

  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden selection:bg-white/20 text-white font-sans flex flex-col select-none">
      
      {/* --- KÜRESEL DİNAMİK IŞIK TAKİBİ (Parallax Ambient Light) --- */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[150vw] h-[150vw] rounded-full pointer-events-none blur-[150px] mix-blend-screen opacity-50 z-0"
        style={{ 
          background: `radial-gradient(circle, ${ambientColor} 0%, transparent 60%)`,
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%"
        }}
      />
      
      {/* --- FİZİKSEL NOISE (Donanım İvmeli Obsidyen Kumlanması) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-[0.12]" style={{ backgroundImage: `url("${noiseTexture}")` }} />

      {/* --- APEX HEADER --- */}
      <header className="relative z-20 px-8 md:px-16 pt-12 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5">
        <div>
          <h1 className="flex items-center gap-3 text-[10px] font-mono tracking-[0.6em] text-white/40 mb-4 uppercase">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" /> APEX KIOSK V4.0
          </h1>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-none uppercase">
            Sovereign <span className="font-light text-white/40">Elite.</span>
          </h2>
        </div>

        <nav className="flex gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-[2px] overflow-x-auto no-scrollbar max-w-full">
          {UNIVERSES.map((u) => {
            const isActive = activeUniverse === u.id;
            const Icon = u.icon;
            return (
              <button
                key={u.id}
                onClick={() => shiftUniverse(u.id, u.color)}
                className={`relative flex items-center gap-3 px-6 py-3 transition-colors duration-500 whitespace-nowrap overflow-hidden rounded-[2px]
                  ${isActive ? 'text-black' : 'text-[#666] hover:text-white'}`}
              >
                {isActive && (
                  <motion.div layoutId="activeApexChip" className="absolute inset-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" transition={apexSpring} />
                )}
                <Icon size={14} className={isActive ? 'relative z-10' : 'relative z-10'} />
                <span className="text-[10px] font-mono font-bold tracking-[0.3em] relative z-10">{u.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* --- BRUTALİST KART DRAG EKSENİ --- */}
      <div className="relative z-10 flex-1 w-full flex items-center overflow-hidden" ref={carouselRef}>
        <motion.div 
          className="flex gap-6 md:gap-10 px-8 md:px-16 cursor-grab active:cursor-grabbing items-center h-[75vh]"
          drag="x"
          dragConstraints={carouselRef}
          dragElastic={0.01} // Neredeyse sıfır esneklik. İsviçre kasası gibi sert çarpma.
          transition={apexSpring}
          style={{ touchAction: "pan-y" }}
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => (
              <ApexCard key={service.id} service={service} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* --- REAKTÖR 4: SPAOS PHYGiTAL UPLINK (TÜNEL & HACİMSEL TİPOGRAFİ) --- */}
      <AnimatePresence>
        {isTunnelActive && focusedCard && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#020202]/95 backdrop-blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              layoutId={`apex-card-${focusedCard.id}`}
              className="absolute inset-0 md:inset-8 w-full md:w-auto h-full md:h-auto overflow-hidden bg-[#020202] border border-white/5 shadow-[0_0_150px_rgba(255,255,255,0.05)] flex flex-col md:flex-row rounded-[2px]"
            >
              <button onClick={abortProtocol} className="absolute top-6 right-6 md:top-10 md:right-10 p-4 bg-white/5 border border-white/10 text-white/50 hover:bg-white hover:text-black transition-all z-50 group rounded-[2px]">
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>

              <div className="relative w-full h-[40vh] md:h-full md:w-5/12 overflow-hidden">
                <motion.img layoutId={`apex-img-${focusedCard.id}`} src={focusedCard.img} className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale-[50%]" />
                <div className="absolute inset-0 bg-[#020202]/40 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#020202] via-[#020202]/60 to-transparent" />
              </div>

              <motion.div layoutId={`apex-content-${focusedCard.id}`} className="relative z-10 w-full md:w-7/12 h-[60vh] md:h-full flex flex-col justify-center p-8 md:p-24 overflow-hidden">
                
                {/* 15rem Hacimsel Tipografi Arka Planı (Şeffaf Devasa Yazı) */}
                <div className="absolute top-0 right-0 opacity-[0.02] pointer-events-none leading-[0.8] select-none text-right flex flex-col items-end pr-8 pt-8 z-0">
                  {focusedCard.title.split(' ').map((w: string,i: number) => <span key={i} className="text-[8rem] md:text-[15rem] font-black uppercase tracking-tighter">{w}</span>)}
                </div>

                <div className="relative z-10">
                  <motion.div layoutId={`apex-univ-${focusedCard.id}`} className="text-[#888] font-mono tracking-[0.5em] text-[10px] mb-6 flex items-center gap-4 uppercase">
                    <span className="w-12 h-[1px] bg-[#444]"></span> KİLİT AÇILDI: {focusedCard.universe}
                  </motion.div>
                  
                  <motion.h2 layoutId={`apex-title-${focusedCard.id}`} className="text-6xl md:text-[7rem] font-black mb-6 tracking-tighter text-white leading-[0.85] uppercase">
                    {focusedCard.title.split(' ').map((word: string, i: number) => <span key={i} className="block">{word}</span>)}
                  </motion.h2>

                  <motion.p layoutId={`apex-subtitle-${focusedCard.id}`} className="text-lg text-white/40 mb-16 font-mono max-w-xl leading-relaxed uppercase tracking-widest border-l border-white/20 pl-6">
                    Sistem otonom hale geçti. Kuantum arayüzü, odanızın IoT sensörlerini biyometrik imzanıza göre optimize ediyor. İsviçre bankacılık protokolü ile mühürleme bekleniyor.
                  </motion.p>
                </div>
                
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-t border-white/10 pt-8 relative z-10">
                  <div className="flex flex-col mb-6 sm:mb-0">
                    <span className="text-[10px] text-white/30 tracking-[0.4em] font-mono mb-2 uppercase">Onay Bekleyen Yatırım</span>
                    <span className="font-mono text-5xl md:text-6xl font-light tracking-tighter text-white">{focusedCard.price}</span>
                  </div>

                  <button className="relative group px-12 py-6 bg-white text-black flex items-center gap-4 overflow-hidden rounded-[2px] border border-transparent hover:bg-transparent hover:text-white hover:border-white transition-all duration-500">
                    <Fingerprint size={24} className="group-hover:scale-110 transition-transform duration-500" />
                    <span className="font-mono text-xs tracking-[0.3em] font-bold uppercase">Protokolü Başlat</span>
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
