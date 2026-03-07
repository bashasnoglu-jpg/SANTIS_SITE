/**
 * SANTIS OS - KINETIC DETAIL ENGINE v1.0
 * The Ultra-Deep Architecture: Lenis + GSAP + Canvas Scrubbing + JSON Hydration
 */

const CinematicEngine = {
    ritualData: null,
    lenis: null,

    init: async function () {
        console.log("🎬 [Cinematic Engine] Booting System...");

        // 1. Hydrate Data
        const ritualId = window.RITUAL_ID;
        if (!ritualId) {
            console.error("❌ Fatal: No RITUAL_ID injected.");
            return;
        }

        try {
            const res = await fetch('/assets/data/services.json');
            const db = await res.json();

            // The new Sovereign Master Catalog is a flat array
            this.ritualData = db.find(r => r.id === ritualId || r.slug === ritualId);

            if (!this.ritualData) throw new Error("Ritual not found in Ledger: " + ritualId);
            console.log(`✅ Hydrating: ${this.ritualData.title || this.ritualData.name}`);
            this.buildDOM();

            // Give DOM time to paint
            requestAnimationFrame(() => {
                this.initLenis();
                this.initGSAP();
                this.initCanvasScrubbing();
                this.attachStickyBarLogic();
            });

        } catch (e) {
            console.error("🔥 Hydration Failed: ", e);
        }
    },

    buildDOM: function () {
        const content = document.getElementById('ritual-content');
        const data = this.ritualData;

        // Change Body Atmosphere
        document.body.style.backgroundColor = data.atmosphere_color || '#050505';

        // 1. Build Hero
        let html = `
            <div class="hero-section min-h-screen flex flex-col items-center justify-center text-center w-full z-10 -mt-32">
                <span class="inline-block px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] uppercase tracking-[5px] rounded-full mb-6 opacity-0 translate-y-4 gsap-hero-element">${data.category}</span>
                <h1 class="text-5xl md:text-8xl font-serif text-white tracking-wide italic mb-4 gsap-hero-element opacity-0 translate-y-8 drop-shadow-2xl">${data.title}</h1>
                <p class="font-sans text-lg md:text-xl text-gray-300 font-light max-w-2xl gsap-hero-element opacity-0 translate-y-4">${data.subtitle}</p>
                <div class="mt-16 w-[1px] h-24 bg-gradient-to-b from-white/50 to-transparent mx-auto gsap-hero-element opacity-0"></div>
            </div>
            
            <div class="timeline-section w-full max-w-4xl mx-auto py-32 flex flex-col gap-32 relative z-10">
        `;

        // 2. Build Timeline
        if (data.timeline) {
            data.timeline.forEach((step, idx) => {
                const isLeft = idx % 2 === 0;
                html += `
                    <div class="timeline-item flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full ${isLeft ? '' : 'md:flex-row-reverse'} opacity-0 translate-y-16">
                        <div class="flex-1 flex flex-col ${isLeft ? 'md:items-end text-left md:text-right' : 'md:items-start text-left'}">
                            <span class="font-mono text-[#D4AF37] text-xl tracking-widest mb-2">${step.time}</span>
                            <h3 class="font-serif italic text-3xl md:text-5xl text-white tracking-wide mb-4">${step.title}</h3>
                            <p class="text-gray-400 font-sans text-sm md:text-base font-light max-w-sm">${step.description}</p>
                        </div>
                        <div class="hidden md:flex w-24 h-[1px] bg-white/10 relative">
                            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-[#D4AF37] ${idx === data.timeline.length - 1 ? 'bg-[#D4AF37] shadow-[0_0_20px_#D4AF37]' : 'bg-[#111]'}"></div>
                        </div>
                        <div class="flex-1"></div>
                    </div>
                `;
            });
        }

        html += `</div>`;

        // 3. Inject
        content.innerHTML = html;

        // 4. Update Sticky Bar
        document.getElementById('sticky-title').innerText = data.title;
        document.getElementById('sticky-duration').innerText = data.duration;
        document.getElementById('sticky-price').innerText = data.price;
    },

    initLenis: function () {
        console.log("🌊 [Lenis] Frictionless Scroll Initiated");
        this.lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        // Link Lenis to GSAP ScrollTrigger
        this.lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            this.lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
    },

    initGSAP: function () {
        console.log("🎯 [GSAP] ScrollTriggers Armed");

        // 1. Hero Entrance Sync
        gsap.to('.gsap-hero-element', {
            y: 0,
            opacity: 1,
            duration: 1.5,
            stagger: 0.2,
            ease: "power3.out",
            delay: 0.2
        });

        // 2. Timeline Reveal (IntersectionObserver Replacement via GSAP)
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach(item => {
            gsap.to(item, {
                scrollTrigger: {
                    trigger: item,
                    start: "top 85%",
                    end: "top 50%",
                    scrub: 1, // Smooth scrub vs instant trigger
                },
                y: 0,
                opacity: 1,
                ease: "none"
            });
        });

        // 3. Sticky Bar Reveal
        ScrollTrigger.create({
            trigger: ".hero-section",
            start: "bottom top",
            onEnter: () => document.getElementById('sovereign-sticky-bar').classList.remove('translate-y-full'),
            onLeaveBack: () => document.getElementById('sovereign-sticky-bar').classList.add('translate-y-full')
        });
    },

    initCanvasScrubbing: function () {
        console.log("🎨 [Canvas] Video Frame Scrubbing Matrix Armed");
        // For phase 1, we map single hero_image to canvas context.
        // Full Image Sequence implementation requires physical 150+ frames.
        const canvas = document.getElementById("hero-scrub-canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const img = new Image();
        img.src = this.ritualData.hero_image;

        img.onload = () => {
            // Draw initial Frame
            this.drawImageCover(ctx, img, canvas);

            // Setup Parallax & Sub-pixel scrub mapping
            gsap.to(canvas, {
                scrollTrigger: {
                    trigger: "body",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 0.5
                },
                scale: 1.2, // Simulate slow forward plunge
                y: "20%", // Classic Apple Parallax
                filter: "blur(10px)", // Fade into heavy steam
                ease: "none"
            });
        };
    },

    drawImageCover: function (ctx, img, canvas) {
        // Equivalent to object-fit: cover for canvas
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        let drawX = 0, drawY = 0, drawW = canvas.width, drawH = canvas.height;

        if (imgRatio > canvasRatio) {
            drawW = canvas.height * imgRatio;
            drawX = (canvas.width - drawW) / 2;
        } else {
            drawH = canvas.width / imgRatio;
            drawY = (canvas.height - drawH) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
    },

    attachStickyBarLogic: function () {
        const btn = document.getElementById('btn-ritual-reserve');
        if (!btn) return;

        btn.addEventListener('click', () => {
            // Will integrate 10-Min Atomic Redis Hold Here (Phase 87)
            if (typeof window.triggerSovereignCheckout === 'function') {
                // Trigger the existing Modal Logic from Phase 68
                window.triggerSovereignCheckout(this.ritualData.id);
            } else {
                console.warn("⚠️ Sovereign Checkout Engine not found globally yet.");
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CinematicEngine.init();
});
