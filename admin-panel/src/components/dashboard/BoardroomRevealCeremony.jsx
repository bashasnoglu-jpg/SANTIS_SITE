import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * 🎭 BOARDROOM REVEAL CEREMONY
 * Admin panel açılışında devreye giren sinematik tören katmanı.
 * GSAP "Liquid Weight" orkestrasyonu ile sistemi yöneticinin huzuruna çıkarır.
 */
const BoardroomRevealCeremony = ({ onComplete }) => {
  const overlayRef = useRef(null);
  const textRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    // 1. Başlangıç Durumu (Sisli ve Sessiz)
    gsap.set(overlayRef.current, { opacity: 1, backdropFilter: 'blur(40px)' });
    gsap.set(textRef.current, { y: 20, opacity: 0 });
    gsap.set(progressRef.current, { scaleX: 0 });

    // 2. Tören Akışı
    tl.to(textRef.current, { 
      opacity: 1, 
      y: 0, 
      duration: 1.5, 
      ease: 'expo.out',
      delay: 0.5 
    })
    .to(progressRef.current, { 
      scaleX: 1, 
      duration: 2, 
      ease: 'power2.inOut' 
    }, "-=0.5")
    .to(textRef.current, { 
      opacity: 0, 
      y: -10, 
      duration: 0.8, 
      ease: 'power2.in' 
    })
    .to(overlayRef.current, { 
      opacity: 0, 
      backdropFilter: 'blur(0px)', 
      duration: 1.5, 
      ease: 'expo.inOut',
      pointerEvents: 'none'
    });

    // Ana dashboard öğeleri için staggered (sıralı) giriş fısıltısı
    tl.from(".animate-reveal", {
      opacity: 0,
      y: 30,
      stagger: 0.15,
      duration: 1.2,
      ease: 'expo.out',
      clearProps: "all"
    }, "-=1.2");

  }, [onComplete]);

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-sovereign-void flex flex-col items-center justify-center pointer-events-auto"
    >
      <div className="text-center">
        <h1 
          ref={textRef}
          className="text-sovereign-ink font-serif text-3xl tracking-widest mb-8"
        >
          SANTIS OS <br/>
          <span className="text-xs font-sans tracking-widest text-sovereign-bronze opacity-60">SOVEREIGN ARCHITECT INITIALIZING</span>
        </h1>
        
        <div className="w-64 h-px bg-sovereign-panel relative overflow-hidden mx-auto">
          <div 
            ref={progressRef}
            className="absolute inset-0 bg-sovereign-accent origin-left"
          ></div>
        </div>
      </div>

      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sovereign-accent/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default BoardroomRevealCeremony;
