/* Santis V10 Core: Atmosphere & Neural Aesthetics (Ultra God-Mode) */
const SantisV10 = {
    settings: {
        noiseOpacity: 0.05,
        particlesActive: true,
        particleCount: window.innerWidth < 768 ? 20 : 50,
        vignetteStrength: 'radial-gradient(circle at center, transparent 0%, rgba(5,5,5,0.95) 100%)',
        baseColor: '#0a0a09', // Sovereign Void
        personas: {
            'hammam-whale': '#0f0d0a',
            'recovery-seeker': '#0a0b0f',
            'skincare-elite': '#0d0c0c'
        }
    },

    init() {
        console.log("⚡ [Santis V10 Atmosphere] Sovereign Mode Engaged. Initializing layers...");
        this.setupBreathingVoid();
        this.injectFractalNoise();
        this.addCinematicVignette();

        if (this.settings.particlesActive) {
            this.igniteParticleEngine();
        }

        this.syncWithChameleon();
        this.syncWithSentinel();
        this.syncWithScoreEngine();

        console.log("🌌 [Santis V10 Atmosphere] Cinematic Layering Complete.");
    },

    setupBreathingVoid() {
        if (!document.getElementById('santis-breathing-layer')) {
            const meshDiv = document.createElement('div');
            meshDiv.id = 'santis-breathing-layer';
            meshDiv.className = 'santis-breathing-layer';

            Object.assign(meshDiv.style, {
                position: 'fixed',
                top: '-10%', left: '-10%', width: '120vw', height: '120vh',
                zIndex: '-3',
                background: 'radial-gradient(circle at 10% 20%, #050505 0%, transparent 40%), radial-gradient(circle at 80% 80%, #0a0b0f 0%, transparent 40%), radial-gradient(circle at 40% 60%, rgba(15, 13, 10, 0.4) 0%, transparent 50%)',
                backgroundColor: 'var(--santis-v10-bg, #0a0a09)',
                backgroundSize: '100% 100%',
                transition: 'background-color 4s cubic-bezier(0.16, 1, 0.3, 1)'
            });
            document.documentElement.appendChild(meshDiv);
            document.documentElement.style.setProperty('--santis-v10-bg', this.settings.baseColor);
        }

        // Kinetik Mühür 1: The V10 GPU ENGINE
        if (!this.atmosphereEngine) {
            this.atmosphereEngine = new SantisAtmosphereEngine();
        }
    },

    injectFractalNoise() {
        if (document.getElementById('santis-procedural-noise')) return;

        // Base64 encoded SVG directly injected to avoid network requests
        // Uses feTurbulence for organic, cinematic 35mm film grain effect
        const encodedNoise = encodeURIComponent(`
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch"/>
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
            </svg>
        `);

        const noiseDiv = document.createElement('div');
        noiseDiv.id = "santis-procedural-noise";

        Object.assign(noiseDiv.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: '-2', // Below everything but above base color
            opacity: this.settings.noiseOpacity,
            backgroundImage: `url("data:image/svg+xml;utf8,${encodedNoise}")`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'overlay'
        });

        document.documentElement.appendChild(noiseDiv);
    },

    addCinematicVignette() {
        if (document.getElementById('santis-vignette')) return;

        const vignette = document.createElement('div');
        vignette.id = "santis-vignette";
        Object.assign(vignette.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: '-1', // Above noise, below particles
            background: this.settings.vignetteStrength,
            transition: 'background 3s ease'
        });

        document.documentElement.appendChild(vignette);
    },

    igniteParticleEngine() {
        if (document.getElementById('santis-particle-canvas')) return;

        console.log("✨ [Santis V10 Atmosphere] Igniting Quantum Dust Engine...");
        const canvas = document.createElement('canvas');
        canvas.id = 'santis-particle-canvas';

        Object.assign(canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: '0', // Subtle interaction layer
            opacity: '0.4'
        });

        document.documentElement.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // Handle Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Particles Data
        const particles = Array.from({ length: this.settings.particleCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.1,
            speedX: (Math.random() - 0.5) * 0.2, // Very slow drifting
            speedY: Math.random() * -0.3 - 0.1, // Floating upwards slowly
            opacity: Math.random() * 0.5 + 0.1
        }));

        const driftAnimation = () => {
            if (!this.settings.particlesActive) return; // Kill switch check

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`; // Santis Gold
                ctx.fill();

                // Move
                p.x += p.speedX;
                p.y += p.speedY;

                // Reset if bounds hit
                if (p.x < 0 || p.x > canvas.width || p.y < 0) {
                    p.x = Math.random() * canvas.width;
                    p.y = canvas.height + p.size;
                }
            });

            requestAnimationFrame(driftAnimation);
        };

        driftAnimation();
    },

    syncWithChameleon() {
        // Listen to persona changes
        const persona = sessionStorage.getItem('santis_persona') || 'default';
        this.applyPersonaVibe(persona);

        // Allow real-time event listener if Ghost/Chameleon broadcast it
        window.addEventListener('santis-persona-changed', (e) => {
            this.applyPersonaVibe(e.detail.persona);
        });
    },

    applyPersonaVibe(personaName) {
        if (!personaName) return;
        const normalized = personaName.toLowerCase().replace(/\s+/g, '-');
        const targetColor = this.settings.personas[normalized] || this.settings.baseColor;
        document.documentElement.style.setProperty('--santis-v10-bg', targetColor);
        console.log(`🎭 [Santis V10 Atmosphere] Layer shifted to match Vibe: ${normalized} (${targetColor})`);
    },

    syncWithSentinel() {
        // Listen to performance drops to active "Paranoid / Shield Mode"
        window.addEventListener('santis-performance-drop', () => {
            console.warn("🛡️ [Santis V10 Atmosphere] Sentinel Triggered: Engaging Pure Black Shield. Imploding Particle Engine.");
            this.settings.particlesActive = false; // Stop requestAnimationFrame logic

            const canvas = document.getElementById('santis-particle-canvas');
            if (canvas) canvas.remove();

            // Strip visual overload
            const meshLayer = document.getElementById('santis-breathing-layer');
            if (meshLayer) {
                meshLayer.style.animation = 'none';
                meshLayer.style.background = '#000000';
            }
            document.documentElement.style.setProperty('--santis-v10-bg', '#000000');

            const vignette = document.getElementById('santis-vignette');
            if (vignette) vignette.style.background = 'transparent';
        });
    },

    syncWithScoreEngine() {
        console.log("🌌 [Santis V10] Reactive Aura: Synchronizing with Ghost Score...");

        window.addEventListener('santis:score_update', (e) => {
            const score = e.detail.score;
            const body = document.body;
            const currentAura = body.getAttribute('data-aura');

            // STAGE 2: SURGE (Skor 95+)
            if (score >= 95) {
                if (currentAura !== 'surge') {
                    body.setAttribute('data-aura', 'surge');
                    this.mutateQuantumDust('surge');
                    console.log("✨ [V10 Atmosphere] Aura Mutated: SURGE");
                }
            }
            // STAGE 1: AWAKENED (Skor 70+)
            else if (score >= 70) {
                if (currentAura !== 'awakened') {
                    body.setAttribute('data-aura', 'awakened');
                    this.mutateQuantumDust('awakened');
                    console.log("✨ [V10 Atmosphere] Aura Mutated: AWAKENED");
                }
            }
            // STAGE 0: DORMANT (Skor < 70)
            else {
                if (currentAura) {
                    body.removeAttribute('data-aura');
                    this.mutateQuantumDust('dormant');
                }
            }
        });
    },

    mutateQuantumDust(state) {
        // Quantum Dust dizisi (this.particles) üzerinde hız ve renk mutasyonu
        if (!this.particles || this.particles.length === 0) return;

        this.particles.forEach(p => {
            // baseSpeed parametrelerini kontrol et, yoksa tanımla
            if (typeof p.baseSpeedY === 'undefined') p.baseSpeedY = p.speedY;

            if (state === 'surge') {
                p.speedY = p.baseSpeedY * 2.5; // %150 Hızlanma
                p.color = 'rgba(255, 215, 0, 0.9)'; // Saf Royal Gold
            } else if (state === 'awakened') {
                p.speedY = p.baseSpeedY * 1.5; // %50 Hızlanma
                p.color = 'rgba(218, 165, 32, 0.6)'; // Isınan Altın
            } else {
                p.speedY = p.baseSpeedY; // Orijinal hıza dönüş
                p.color = 'rgba(255, 255, 255, 0.1)'; // Temel Parçacık
                p.baseSpeedY = undefined; // State temizlendiğinde reset
            }
        });
    }
};

// Auto-boot sequence
document.addEventListener('DOMContentLoaded', () => {
    SantisV10.init();
});

class SantisAtmosphereEngine {
    constructor() {
        this.layers = document.querySelectorAll('.santis-breathing-layer');
        // VRAM sızıntısına karşı WeakMap
        this.activeAnimations = new WeakMap();

        if (this.layers.length > 0) {
            this.initObserver();
            console.log("⚡ [V10 ATMOSPHERE] GPU Compositing Aktif. CPU Yükü: %0 | VRAM Kalkanı: ON");
        }
    }

    initObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const el = entry.target;
                if (entry.isIntersecting) {
                    el.style.willChange = 'transform, opacity';
                    this.startBreathing(el);
                } else {
                    el.style.willChange = 'auto';
                    this.stopBreathing(el);
                }
            });
        }, { threshold: 0.01, rootMargin: "150px 0px" });

        this.layers.forEach(layer => this.observer.observe(layer));
    }

    startBreathing(el) {
        if (this.activeAnimations.has(el)) return;

        let frame = Math.random() * 1000;
        const animate = () => {
            frame += 0.015;
            const yOffset = Math.sin(frame) * 10;
            const scale = 1 + Math.sin(frame * 0.8) * 0.02;

            el.style.transform = `translate3d(0, ${yOffset}px, 0) scale(${scale})`;
            this.activeAnimations.set(el, requestAnimationFrame(animate));
        };
        this.activeAnimations.set(el, requestAnimationFrame(animate));
    }

    stopBreathing(el) {
        if (this.activeAnimations.has(el)) {
            cancelAnimationFrame(this.activeAnimations.get(el));
            this.activeAnimations.delete(el);
            el.style.transform = 'translate3d(0, 0px, 0) scale(1)';
        }
    }
}

/* =========================================================
   SANTIS OMNI-SCROLL V4.1 (THE ULTIMATE FIX)
   Piksel hesabı yapmaz, CSS ile kavga etmez. Kusursuz akar.
========================================================= */
const initOmniScroll = () => {
    console.log("⚡ [Omni-Scroll V4.1] Intersection Observer Devrede. Sıfır Titreme.");

    const carousels = document.querySelectorAll('.rail-track, .santis-rail-track');

    carousels.forEach(track => {
        if (track.hasAttribute('data-v4-observer')) {
            // Zaten kuruluysa, sadece kart listesini güncelle ve observer'a ekle (Re-init)
            const newCards = Array.from(track.querySelectorAll('.nv-rail-card, .nv-card, .ritual-card'));
            if (track._v4Observer && newCards.length > 0) {
                newCards.forEach(card => {
                    if (!card.hasAttribute('data-observed')) {
                        track._v4Observer.observe(card);
                        card.setAttribute('data-observed', 'true');
                    }
                });
            }
            return;
        }

        const section = track.closest('section') || track.parentElement;
        if (!section) return;

        const prevBtn = section.querySelector('button.prev, button:has(svg path[d*="M15 19l-7-7"]), .slider-prev');
        const nextBtn = section.querySelector('button.next, button:has(svg path[d*="M9 5l7 7"]), .slider-next');
        const dotsContainer = section.querySelector('.flex.justify-center.gap-2, .dots-container, .rail-dots, .nv-rail-dots');
        const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('button, span')) : [];
        const cards = Array.from(track.querySelectorAll('.nv-rail-card, .nv-card, .ritual-card'));

        if (!cards.length) return;

        track.setAttribute('data-v4-observer', 'true');

        // 1. NOKTALARI GÜNCELLEME YARDIMCISI
        const updateDots = (activeIndex) => {
            dots.forEach((dot, index) => {
                if (index === activeIndex) {
                    dot.style.backgroundColor = '#d4af37'; // Aktif (Gold)
                    dot.style.background = '#B39B59'; // Sovereign Gold override for span
                    dot.style.width = '24px';
                } else {
                    dot.style.backgroundColor = 'rgba(255,255,255,0.2)'; // Pasif
                    dot.style.background = 'rgba(179,155,89,0.35)'; // Default override for span
                    dot.style.width = '6px';
                }
            });
        };

        // Kinetik Spam Koruması (250ms rAF Throttle Kalkanı)
        let isThrottled = false;
        const throttleScroll = (callback) => {
            if (isThrottled) return;
            isThrottled = true;
            window.requestAnimationFrame(() => {
                callback();
                setTimeout(() => { isThrottled = false; }, 250); // Sovereign standard: 250ms Fluid UX
            });
        };

        // Kuantum Kaydırma Motoru (Matematiksel Kesinlik, Sıfır Dikey Zıplama)
        const executeSovereignScroll = (targetIndex) => {
            const targetCard = cards[targetIndex];
            if (!targetCard) return;

            // Browser `scrollIntoView` hatalarını engellemek için doğrudan ofset hesabı
            const trackRect = track.getBoundingClientRect();
            const cardRect = targetCard.getBoundingClientRect();
            const paddingLeft = parseFloat(window.getComputedStyle(track).paddingLeft) || 0;

            const scrollDistance = cardRect.left - trackRect.left - paddingLeft;
            track.scrollBy({ left: scrollDistance, behavior: 'smooth' });
        };

        // 2. GÖZLEMCİ (OBSERVER) - Hangi kartın ekranda olduğunu kendi anlar
        const observerOptions = {
            root: track,
            threshold: 0.5 // Kartın en az %50'si ekrandaysa onu aktif say
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Pasiflik Sendromunu Kırmak (Aktif Aura)
                    cards.forEach(c => c.classList.remove('is-active-aura'));
                    entry.target.classList.add('is-active-aura');

                    const activeIndex = cards.indexOf(entry.target);
                    track.dataset.activeIndex = activeIndex; // Aktif indexi hafızaya al
                    updateDots(activeIndex); // Noktayı otomatik sarı yap
                }
            });
        }, observerOptions);

        track._v4Observer = observer; // Re-init için observer'ı track nesnesine iliştir

        // Tüm kartları gözlemlemeye başla
        cards.forEach(card => {
            observer.observe(card);
            card.setAttribute('data-observed', 'true');
        });

        // 3. OKLARA TIKLAMA (Sovereign Scroll Kilitli)
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                throttleScroll(() => {
                    let currentIndex = parseInt(track.dataset.activeIndex || 0);
                    let targetIndex = Math.max(0, currentIndex - 1);
                    executeSovereignScroll(targetIndex);
                });
            }, { capture: true });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                throttleScroll(() => {
                    let currentIndex = parseInt(track.dataset.activeIndex || 0);
                    let targetIndex = Math.min(cards.length - 1, currentIndex + 1);
                    executeSovereignScroll(targetIndex);
                });
            }, { capture: true });
        }

        // 4. NOKTALARA TIKLAMA
        dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                throttleScroll(() => {
                    executeSovereignScroll(index);
                });
            }, { capture: true });
        });

        // 5. MASAÜSTÜ İÇİN KİNETİK SÜRÜKLEME (Drag-to-Scroll Kancası)
        let isDown = false;
        let startX;
        let scrollLeft;
        let dragDistance = 0;

        track.addEventListener('mousedown', (e) => {
            isDown = true;
            dragDistance = 0; // Sıfırla
            track.classList.add('is-dragging');
            track.style.cursor = 'grabbing';
            track.style.scrollBehavior = 'auto'; // Smooth'u devre dışı bırak
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        });

        const stopDrag = () => {
            if (!isDown) return;
            isDown = false;
            track.classList.remove('is-dragging');
            track.style.cursor = 'grab';
            track.style.scrollBehavior = 'smooth';

            // Eğer drag yapıldıysa, kısa süreliğine click eventi yut (Hack)
            if (dragDistance > 5) {
                setTimeout(() => dragDistance = 0, 50);
            }
        };

        track.addEventListener('mouseleave', stopDrag);
        track.addEventListener('mouseup', stopDrag);

        track.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault(); // Varsayılan sürükleme eylemlerini (text seçimi vs) durdur
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5; // Kinetik hız çarpanı
            dragDistance = Math.abs(walk);
            track.scrollLeft = scrollLeft - walk;
        });

        // Kuantum Kalkanı: Eğer sürükleme yapıldıysa (dragDistance > 5) içindeki tıklamaları İPTAL et
        track.addEventListener('click', (e) => {
            if (dragDistance > 5 || track.classList.contains('is-dragging')) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    initOmniScroll();
});

// Kuantum Motoru Modüler Olarak Dışarı Aktarılıyor
window.initOmniScroll = initOmniScroll;

// Zırhlanmış Kuantum Kartları DOM'a oturduktan 100ms sonra motoru çalıştır.
document.addEventListener('santis:cards-rendered', () => {
    setTimeout(initOmniScroll, 100);
});
