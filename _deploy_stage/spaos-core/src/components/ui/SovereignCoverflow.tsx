import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Keyboard } from 'swiper/modules';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';

// Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';

// Store & Data
import {
  activeCategory,
  activeAuraColor,
  triggerHardwareIoT,
  lockedRitual,
  type RitualData
} from '../../store/spaosStore';
import ritualsData from '../../data/rituals.json';

const rituals = ritualsData as RitualData[];

export default function SovereignCoverflow() {
  const currentCategory = useStore(activeCategory);
  const auraColor = useStore(activeAuraColor);
  const locked = useStore(lockedRitual);
  
  const [filteredRituals, setFilteredRituals] = useState<RitualData[]>([]);

  // Update data based on active category
  useEffect(() => {
    setFilteredRituals(rituals.filter(r => r.category === currentCategory));
  }, [currentCategory]);

  const handleSlideChange = (swiper: any) => {
    // 600ms Debounce Logic against disco effect
    const activeIndex = swiper.activeIndex;
    const activeRitual = filteredRituals[activeIndex];
    
    if (activeRitual && activeRitual.sensory_iot.trigger_on_focus) {
      setTimeout(() => {
        // Double check if user is still on the same slide
        if (swiper.activeIndex === activeIndex) {
          activeAuraColor.set(activeRitual.sensory_iot.ui_aura_color);
          triggerHardwareIoT(activeRitual.sensory_iot.hardware_payload);
        }
      }, 600); // 600ms Focus lock
    }
  };

  return (
    <div className="relative w-full h-[700px] flex items-center justify-center pt-10">
      
      {/* Background Aura (Immersive Color Mask) */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none transition-colors duration-[1500ms]"
        style={{ backgroundColor: auraColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      
      {/* Back layer: The Coverflow (Blurs when locked) */}
      <motion.div 
        animate={{
          filter: locked ? 'blur(20px)' : 'blur(0px)',
          scale: locked ? 0.95 : 1,
          opacity: locked ? 0.3 : 1
        }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        className="w-full h-full flex items-center justify-center absolute inset-0 z-10 pointer-events-auto"
      >
        {filteredRituals.length > 0 && (
          <Swiper
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          speed={900}
          keyboard={{ enabled: true }}
          modules={[EffectCoverflow, Keyboard]}
          onSlideChange={handleSlideChange}
          onInit={handleSlideChange}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 180,
            modifier: 2.5,
            slideShadows: false, // Disabling default swiper shadows to use pure CSS drop shadows
          }}
          className="w-full h-[460px] z-10"
        >
          {filteredRituals.map((ritual) => (
            <SwiperSlide 
              key={ritual.id} 
              onClick={() => lockedRitual.set(ritual)}
              className="w-[320px] h-[460px] rounded-[16px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/5 bg-[#0a0a0a] group relative cursor-pointer" 
              style={{ WebkitBoxReflect: 'below 3px linear-gradient(transparent, transparent, rgba(0,0,0,0.15))' }}
            >
              <motion.img 
                layoutId={`card-image-${ritual.id}`}
                src={ritual.presentation.media.card_cover} 
                alt={ritual.presentation.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-[.swiper-slide-active]:scale-[1.03]"
              />
              
              {/* Data Clarity Shadow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />

              {/* Typography Layer (Staggered Entrance) */}
              <div className="relative z-20 w-full h-full flex flex-col justify-end items-center text-center p-6 bg-black/10">
                <span className="text-[#d4af37] text-[10px] font-semibold tracking-[0.3em] mb-3 opacity-0 group-[.swiper-slide-active]:opacity-100 group-[.swiper-slide-active]:translate-y-0 translate-y-4 transition-all duration-700 delay-100">
                  {ritual.presentation.badge}
                </span>
                
                <h3 className="text-[#f5f5f7] font-['Cinzel'] text-2xl font-medium tracking-wide mb-3 opacity-0 group-[.swiper-slide-active]:opacity-100 group-[.swiper-slide-active]:translate-y-0 translate-y-4 transition-all duration-700 delay-200">
                  {ritual.presentation.title}
                </h3>
                
                <p className="text-[#888891] text-xs font-light leading-relaxed mb-6 opacity-0 group-[.swiper-slide-active]:opacity-100 group-[.swiper-slide-active]:translate-y-0 translate-y-4 transition-all duration-700 delay-300">
                  {ritual.presentation.short_desc}
                </p>
                
                <div className="flex gap-4 opacity-0 group-[.swiper-slide-active]:opacity-100 group-[.swiper-slide-active]:translate-y-0 translate-y-4 transition-all duration-700 delay-400 border-t border-white/10 pt-4 w-full justify-center">
                    <span className="text-white/60 text-xs tracking-widest">{ritual.presentation.pricing.duration_min} DK</span>
                    <span className="text-[#d4af37] text-xs tracking-widest border-l border-white/10 pl-4 flex items-center gap-1">
                      € {ritual.presentation.pricing.base_eur}
                      {ritual.presentation.pricing.surge_eligible && <span className="text-[9px] opacity-50">+</span>}
                    </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      </motion.div>
    </div>
  );
}
