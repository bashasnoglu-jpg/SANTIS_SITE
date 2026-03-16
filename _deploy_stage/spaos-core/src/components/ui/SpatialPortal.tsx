import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { lockedRitual } from '../../store/spaosStore';

// V21: The Invisible Checkout Payload type
type V21CheckoutPayload = {
  guest_token: string;
  intent_type: string;
  financial_payload: {
    base_price: number;
    ai_surge_fee: number;
    cross_sell_added: string[];
    total_auth: number;
  };
  hardware_execution: {
    immediate_room_state: string;
    pre_arrival_spa_state: string;
  };
};

export default function SpatialPortal() {
  const activeRitual = useStore(lockedRitual);
  const [surgeActive, setSurgeActive] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);

  // V21 Lock State
  const [sealActive, setSealActive] = useState(false);
  const [zenState, setZenState] = useState(false);

  // Slide-to-Seal mechanics
  const x = useMotionValue(0);
  const slideProgress = useTransform(x, [0, 200], [0, 1]); // the slider width is roughly 250px so 200px drag is full
  const slideBg = useTransform(x, [0, 200], ["rgba(255,255,255,0.05)", "rgba(212,175,55,0.3)"]);
  const sealTextOpacity = useTransform(slideProgress, [0, 0.5], [1, 0]);

  // Acoustic Shock Engine (Web Audio API)
  const playAcousticShock = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      // Deep sub-bass oscillator (432Hz root, shifting down)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.5); // Dive deep
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 2);
    } catch (e) {
      console.warn("Acoustic Shock blocked by browser policy until interaction.", e);
    }
  };

  // AI Surge Odometer Logic
  useEffect(() => {
    if (activeRitual) {
      setCurrentPrice(activeRitual.presentation.pricing.base_eur);
      
      // If surge is eligible, simulate AI demand spike after 1 second
      if (activeRitual.presentation.pricing.surge_eligible) {
        const timer = setTimeout(() => {
          setSurgeActive(true);
          // Odometer effect: rapidly increment price to base + 30
          let val = activeRitual.presentation.pricing.base_eur;
          const target = val + 30;
          const int = setInterval(() => {
            val += 2;
            setCurrentPrice(val);
            if (val >= target) clearInterval(int);
          }, 30);
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        setSurgeActive(false);
      }
    }
  }, [activeRitual]);

  const handleSealComplete = () => {
    if (sealActive) return; // Prevent double trigger
    setSealActive(true);
    
    // Build the Biyolojik Kurye JSON
    const payload: V21CheckoutPayload = {
      guest_token: "cus_stripe_9876xyz",
      intent_type: "phygital_booking",
      financial_payload: {
        base_price: activeRitual?.presentation.pricing.base_eur || 0,
        ai_surge_fee: surgeActive ? 30 : 0,
        cross_sell_added: ["24k_gold_mask"], // Simplified for mock
        total_auth: currentPrice + 90 // Base + Surge + Gold Mask (example value)
      },
      hardware_execution: {
        immediate_room_state: "trigger_golden_pulse",
        pre_arrival_spa_state: "sauna_heater_on"
      }
    };

    console.log("[SpaOS V21] 📦 BİYOLOJİK KURYE HAZIR: Kasa Mühürleniyor...", payload);

    // Astro Server-side API tetiklemesi (Fiziksel ışık için Ağ İsteği)
    fetch('/api/hardware/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Hardware API error: ", err));
    
    // Astro Server-side API tetiklemesi (Stripe B2B Split Payment)
    fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Stripe Checkout error: ", err));

    // Simulate 1500ms API Latency
    setTimeout(() => {
      setZenState(true);
      playAcousticShock();
      console.log('💳 V21 KASA MÜHÜRLENDİ -> 🦅 FINAL IoT Webhook: Room Lights Pulled "Triumphant Gold" & 432Hz Sub-bass Fired!');
    }, 1500);
  };

  return (
    <AnimatePresence>
      {activeRitual && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col justify-end p-8 md:p-16"
        >
          {/* Spatial Z-Axis Anchor (The Image flying to full screen) */}
          <motion.img 
            layoutId={`card-image-${activeRitual.id}`}
            src={activeRitual.presentation.media.card_cover}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* Deep Void Gradient */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/60 to-transparent"
          />

          {/* Close Button (Hidden if processing or zen) */}
          <AnimatePresence>
            {!sealActive && !zenState && (
              <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => lockedRitual.set(null)}
                className="absolute top-10 right-10 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl hover:bg-white/20 transition-colors"
              >
                ✕
              </motion.button>
            )}
          </AnimatePresence>

          {/* V21 Final Zen State (The Phygital Climax) */}
          <AnimatePresence>
            {zenState && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]"
              >
                <div className="text-center font-['Cinzel'] tracking-widest text-[#d4af37]">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 2 }}
                    className="text-2xl font-light"
                  >
                    Sığınağınız hazırlanıyor. Suyun sesi sizi yönlendirecek...
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Content (Staggered Entrance) - Fades out entirely during Zen State */}
          <AnimatePresence>
            {!zenState && (
              <motion.div 
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 1 }}
                className="relative z-20 max-w-4xl w-full mx-auto flex flex-col items-start"
              >
                <motion.span  
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[#d4af37] text-xs font-semibold tracking-[0.4em] mb-4 uppercase"
            >
              {activeRitual.presentation.badge}
            </motion.span>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-['Cinzel'] text-5xl md:text-7xl font-light text-white mb-6"
            >
              {activeRitual.presentation.title}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/70 text-base md:text-lg font-light leading-relaxed max-w-2xl mb-12"
            >
              {activeRitual.presentation.short_desc}
            </motion.p>

            {/* AI Commerce Matrix */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col md:flex-row gap-8 w-full items-start md:items-end justify-between border-t border-white/10 pt-8"
            >
              <div className="flex gap-12">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 tracking-[0.2em] uppercase mb-2">Süre</span>
                  <span className="font-['Cinzel'] text-2xl text-white">{activeRitual.presentation.pricing.duration_min} DK</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                    Yatırım
                    {surgeActive && <span className="text-[#d4af37] text-[8px] border border-[#d4af37]/30 px-1 rounded animate-pulse">AI DEMAND</span>}
                  </span>
                  <span className={`font-['Cinzel'] text-2xl transition-colors duration-500 ${surgeActive ? 'text-[#d4af37]' : 'text-white'}`}>
                    € {currentPrice}
                  </span>
                </div>
              </div>

              {/* V21 Slide to Seal mechanism */}
              <div className="relative w-64 h-16 rounded-full overflow-hidden border border-white/10 shrink-0 pointer-events-auto shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] bg-black/40">
                <motion.div 
                  className="absolute inset-0 z-0 origin-left"
                  style={{ backgroundColor: slideBg }}
                />
                
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <motion.span 
                    style={{ opacity: sealTextOpacity }}
                    className="text-[#d4af37] text-[10px] font-semibold tracking-[0.2em] uppercase pl-10"
                  >
                    {sealActive ? "MÜHÜRLENİYOR..." : "MÜHÜRLEMEK İÇİN KAYDIR"}
                  </motion.span>
                </div>

                <motion.div
                  drag={!sealActive ? "x" : false}
                  dragConstraints={{ left: 0, right: 196 }} // 256(w) - 60(knob) = 196 max drag
                  dragElastic={0.05}
                  onDragEnd={(e, info) => {
                    // if dragged over 150px, snap to end and seal
                    if (info.offset.x > 150) {
                      x.set(196);
                      handleSealComplete();
                    }
                  }}
                  style={{ x }}
                  className="absolute top-1 left-1 w-14 h-14 rounded-full bg-[#d4af37] flex items-center justify-center cursor-grab active:cursor-grabbing z-20 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                >
                  <span className="text-black text-lg">➞</span>
                </motion.div>
                
                {/* Full fill state visualization */}
                <motion.div
                  className="absolute inset-0 bg-[#d4af37] z-10"
                  initial={{ x: "-100%" }}
                  animate={sealActive ? { x: 0 } : { x: "-100%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={sealActive ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-black text-xs font-bold tracking-[0.2em]">İŞLENİYOR...</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Biological Upsell (Glassmorphism Pannel) */}
            {activeRitual.commerce_brain.cross_sell_matrix.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, type: "spring" }}
                className="w-full mt-8 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-[#d4af37] text-[10px] tracking-[0.2em] uppercase mb-1">Biyolojik Optimizasyon</span>
                  <span className="text-white/80 text-sm">{activeRitual.commerce_brain.cross_sell_matrix[0].pitch_logic}</span>
                </div>
                <button className="whitespace-nowrap bg-white/10 border border-white/20 text-white px-6 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors pointer-events-auto">
                  + EKLE
                </button>
              </motion.div>
            )}

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
