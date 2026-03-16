import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { lockedRitual } from '../../store/spaosStore';
import type { ServicePresentation } from '../../store/spaosStore';

interface StackedCarouselProps {
  items: any[]; // The raw JSON data items for the category
}

export default function StackedCarousel({ items }: StackedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll logic (optional, but good for empty idle kiosk)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  // Trigger the Spatial Dive (Zen State) when the active card is clicked
  const handleCardClick = (index: number, item: any) => {
    if (index === currentIndex) {
      // Map raw data to the structure expected by lockedRitual (if needed)
      const ritualData = {
        id: item.id || `virtual-${Math.random()}`,
        presentation: {
          badge: item.category || 'SANTIS',
          title: item.name || item.title,
          short_desc: item.desc || item.description || '',
          media: {
            card_cover: item.image || item.src,
            tunnel_video: item.video || '',
          },
          pricing: {
            duration_min: item.duration ? parseInt(item.duration) : 60,
            base_eur: item.price ? parseInt(item.price.replace(/[^0-9]/g, '')) : 150,
            surge_eligible: true
          }
        },
        commerce_brain: { cross_sell_matrix: [] }
      };
      
      lockedRitual.set(ritualData as any);
    } else {
      // If clicking a background card, just bring it to front
      setCurrentIndex(index);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center perspective-[1200px] overflow-hidden">
      
      {/* Background World Map & Glow */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
        <div className="w-[80%] h-[80%] rounded-[100%] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)] blur-3xl"></div>
        {/* Placeholder for SVG Map */}
         <div className="absolute inset-0 bg-[url('/assets/img/patterns/world-map-dots.svg')] bg-center bg-no-repeat bg-contain opacity-10"></div>
      </div>

      <div className="relative w-full max-w-5xl h-full flex items-center justify-center z-10">
        <AnimatePresence>
          {items.map((item, index) => {
            
            // Calculate relative position with wrapping (Modulo math)
            const diff = index - currentIndex;
            let absDiff = Math.abs(diff);
            
            // Handle wrap-around for smooth infinite looping
            if (absDiff > items.length / 2) {
              absDiff = items.length - absDiff;
            }

            // State Math Calculations
            const zIndex = 50 - absDiff;
            const scale = 1 - (absDiff * 0.15);
            const opacity = absDiff > 2 ? 0 : 1 - (absDiff * 0.4);
            
            // Determine X offset based on direction
            let xOffset = 0;
            if (index !== currentIndex) {
              // Calculate shortest path direction
               let dir = diff;
               if (Math.abs(diff) > items.length / 2) {
                 dir = diff > 0 ? diff - items.length : diff + items.length;
               }
               xOffset = dir > 0 ? absDiff * 180 : -absDiff * 180;
            }

            const blur = absDiff > 0 ? `blur(${absDiff * 2}px)` : 'blur(0px)';
            const isActive = absDiff === 0;

            return (
              <motion.div
                key={index}
                className={`absolute cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-2xl overflow-hidden border ${isActive ? 'border-[#d4af37]/50 shadow-[0_0_40px_rgba(212,175,55,0.2)]' : 'border-white/10'}`}
                style={{
                  width: '320px',
                  height: '480px',
                  zIndex,
                  filter: blur
                }}
                initial={false}
                animate={{
                  x: xOffset,
                  scale,
                  opacity,
                }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                onClick={() => handleCardClick(index, item)}
                layoutId={isActive ? `card-image-${item.id || index}` : undefined} // Link to SpatialPortal
              >
                
                {/* Background Image */}
                <div className="absolute inset-0 bg-gray-900">
                  <img 
                    src={item.image || item.src} 
                    alt={item.name || item.title} 
                    className="w-full h-full object-cover opacity-60"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10"></div>
                </div>

                {/* Card Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                  {/* Top Bar */}
                  <div className="flex justify-between items-start w-full">
                     <span className="text-[#d4af37] text-[9px] tracking-[0.2em] uppercase font-semibold">
                       {item.category || 'SANTIS'}
                     </span>
                     {isActive && (
                       <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                         AVAILABLE
                       </span>
                     )}
                  </div>

                  {/* Center Content (Title) */}
                  <div className="w-full text-center mt-auto mb-6">
                    <h3 className="font-['Cinzel'] text-2xl md:text-3xl text-white font-light drop-shadow-md">
                      {item.name || item.title}
                    </h3>
                  </div>

                  {/* Bottom Stats */}
                  <div className="flex justify-between items-end border-t border-white/10 pt-4">
                    <div>
                      <span className="block text-[9px] text-white/40 tracking-[0.1em] uppercase">Süre</span>
                      <span className="text-white font-mono text-sm">{item.duration || '60 Dk'}</span>
                    </div>
                    <div className="text-right">
                       <span className="block text-[9px] text-[#d4af37]/60 tracking-[0.1em] uppercase">Yatırım</span>
                       <span className="text-[#d4af37] font-['Cinzel'] text-lg font-bold">{item.price || '€150'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Manual Navigation Controls */}
      <div className="absolute bottom-4 right-8 flex gap-4 z-50">
        <button onClick={handlePrev} className="w-10 h-10 rounded-full border border-white/20 bg-black/40 flex flex-center items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm">
          ←
        </button>
        <button onClick={handleNext} className="w-10 h-10 rounded-full border border-white/20 bg-black/40 flex flex-center items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm">
          →
        </button>
      </div>
    </div>
  );
}
