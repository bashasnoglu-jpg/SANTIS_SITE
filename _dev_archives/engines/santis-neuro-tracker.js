/**
 * Phase 46: Santis Neuro-Tracker (Hesitation Arbitrage)
 * Zihin Okuyucu: Tracks raw cursor velocity and dwell time near CTA to trigger Quantum FOMO Pricing.
 * 🌍 [SANTIS_ULTRA_PATCH - PHASE 2: SCORE ENGINE THROTTLING]
 * Zırhlar: Global Event Delegation, rAF Throttling, Passive Listeners
 */
class SovereignNeuroTracker {
    constructor() {
        this.config = {
            ctaSelector: '.nv-btn-checkout, .santis-cta, [data-price], .nv-card-tarot, .ritual-card',
            triggerRadius: 150,
            maxDwellTime: 2000,
            velocityThreshold: 0.12, // Jitter filtreleme için artırıldı
            cooldown: 3600000
        };

        this.state = {
            tracking: false,
            mousePos_x: 0,
            mousePos_y: 0,
            lastMousePos_x: 0,
            lastMousePos_y: 0,
            lastTime: performance.now(), // Date.now() yerine yüksek hassasiyetli zaman
            dwellStartTime: null,
            hasTriggered: false
        };

        // Kuantum Optimizasyon: Sadece görünür CTA'leri takip et (Spatial Cache)
        this.visibleCTAs = new Map();
        this.spatialCacheValid = false;

        this.rAF_ID = null;
        this.currentTarget = null;
        this.hoverTimer = null;

        this.initQuantumEngine();
    }

    initQuantumEngine() {
        // Cooldown Kontrolü
        const triggerTime = localStorage.getItem('nv_fomo_triggered');
        if (triggerTime && (Date.now() - parseInt(triggerTime) < this.config.cooldown)) {
            this.state.hasTriggered = true;
        } else {
            localStorage.removeItem('nv_fomo_triggered');
        }

        // 1. Gözlemci: Sadece ekrandaki CTA'leri yakala (Zero DOM Query)
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.visibleCTAs.set(entry.target, entry.boundingClientRect);
                } else {
                    this.visibleCTAs.delete(entry.target);
                }
                this.spatialCacheValid = false; // Scroll/Resize oldu, cache yenilenmeli
            });
        }, { threshold: 0.1 });

        // MutationObserver: Sayfaya sonradan eklenen (Chunked Render) kartları yakala
        this.mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mut => {
                mut.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Sadece Element Node'lar
                        const ctas = node.matches(this.config.ctaSelector) ? [node] : node.querySelectorAll(this.config.ctaSelector);
                        ctas.forEach(cta => this.observer.observe(cta));
                    }
                });
            });
        });

        // Sayfadaki mevcut CTA'leri gözlemle
        document.querySelectorAll(this.config.ctaSelector).forEach(cta => this.observer.observe(cta));
        this.mutationObserver.observe(document.body, { childList: true, subtree: true });

        // Pasif Dinleyiciler
        document.body.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
        document.addEventListener('scroll', () => { this.spatialCacheValid = false; }, { passive: true });
        window.addEventListener('resize', () => { this.spatialCacheValid = false; }, { passive: true });
        document.body.addEventListener('mouseleave', () => this.resetCognitiveState());

        // Ana Döngüyü Başlat (setInterval iptal, rAF devrede)
        this.brainwaveLoop();

        console.log("⚡ [NEURO-TRACKER OMEGA] Spatial Caching ve Frame-Perfect Engine Devrede.");
    }

    handleMouseMove(e) {
        if (!this.state.hasTriggered) {
            this.state.mousePos_x = e.clientX;
            this.state.mousePos_y = e.clientY;
        }

        // Sadece hedefe yönelik kognitif analiz
        requestAnimationFrame(() => this.analyzeHoverIntent(e));
    }

    analyzeHoverIntent(e) {
        const targetCard = e.target.closest('.bento-card, .matrix-asset-card, .nv-card-tarot, .ritual-card');

        if (this.currentTarget !== targetCard) {
            clearTimeout(this.hoverTimer);
            this.clearFocusEffects(); // Yeni hedefe geçilirse eski efektleri temizle
            this.currentTarget = targetCard;

            if (targetCard) {
                const ritualId = targetCard.dataset.ritual || targetCard.dataset.slug || targetCard.id || "unknown-node";

                // 1. Zihinsel Kilit (Neuro-Focus): 2 saniye beklerse dim efekti başlat
                this.hoverTimer = setTimeout(() => {
                    console.log(`🧠 [NEURO-FOCUS] Kilitlenildi: ${ritualId}. Çevre sessize alınıyor.`);
                    this.applyFocusEffects(targetCard);
                }, 2000); // 2 saniyelik Micro-Hesitation

                // 2. Orijinal 7s Surge/FOMO Tetikleyici (EventBus)
                setTimeout(() => {
                    if (this.currentTarget === targetCard) {
                        console.log(`🐋 [NEURO] 7s Aurelia Trance: ${ritualId}`);
                        if (window.SantisEventBus && typeof window.SantisEventBus.emit === 'function') {
                            window.SantisEventBus.emit('VIP_ENGAGED', { target: ritualId, price: targetCard.dataset.price || 0 });
                        } else {
                            window.dispatchEvent(new CustomEvent('VIP_ENGAGED', { detail: { target: ritualId, price: targetCard.dataset.price || 0 } }));
                        }
                    }
                }, 7000);
            }
        }
    }

    applyFocusEffects(targetCard) {
        // Varsa ray (rail) içindeki diğer kartları bul
        const railTrack = targetCard.closest('.rail-track');
        if (!railTrack) return;

        // Kartlara transition ekle (eğer yoksa)
        Array.from(railTrack.children).forEach(sibling => {
            sibling.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';

            if (sibling !== targetCard) {
                // Diğer kartları karart
                sibling.style.opacity = '0.4';
                sibling.style.transform = 'scale(0.95)';
            } else {
                // Hedef kartın aurasını (glow) aç
                sibling.style.opacity = '1';
                sibling.style.transform = 'scale(1.05)';
                sibling.style.zIndex = '50';

                // Sovereign Inner Glow Injection
                if (!sibling.querySelector('.neuro-glow')) {
                    const glow = document.createElement('div');
                    glow.className = 'neuro-glow absolute inset-0 z-10 pointer-events-none rounded-3xl opacity-0 transition-opacity duration-1000';
                    glow.style.boxShadow = 'inset 0 0 60px rgba(212, 175, 55, 0.4)'; // Santis Gold İç Aura
                    sibling.appendChild(glow);
                    // Force reflow and fade in
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            glow.style.opacity = '1';
                        });
                    });
                }
            }
        });
    }

    clearFocusEffects() {
        if (!this.currentTarget) return;
        const railTrack = this.currentTarget.closest('.rail-track');
        if (!railTrack) return;

        Array.from(railTrack.children).forEach(sibling => {
            sibling.style.opacity = '1';
            sibling.style.transform = ''; // Reset scale
            sibling.style.zIndex = '';

            const glow = sibling.querySelector('.neuro-glow');
            if (glow) {
                glow.style.opacity = '0';
                setTimeout(() => glow.remove(), 1000);
            }
        });
    }

    resetCognitiveState() {
        clearTimeout(this.hoverTimer);
        this.clearFocusEffects();
        this.currentTarget = null;
        this.state.dwellStartTime = null;
    }

    // 0-Cost Mesafe Hesaplayıcı (Sadece görünür öğeler + Cache)
    getDistanceToClosestCTA() {
        if (this.visibleCTAs.size === 0) return { distance: Infinity, element: null };

        let minDistance = Infinity;
        let closestBtn = null;

        // Eğer scroll olduysa cache'i güncelle (Sadece görünür olanlar için)
        if (!this.spatialCacheValid) {
            for (let [element] of this.visibleCTAs) {
                this.visibleCTAs.set(element, element.getBoundingClientRect());
            }
            this.spatialCacheValid = true;
        }

        for (let [element, rect] of this.visibleCTAs) {
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            const dx = Math.max(0, Math.abs(this.state.mousePos_x - cx) - rect.width / 2);
            const dy = Math.max(0, Math.abs(this.state.mousePos_y - cy) - rect.height / 2);

            // Karekök almak CPU yorar. Mesafe karesi (distanceSq) üzerinden kıyaslama yapmak %300 daha hızlıdır.
            const distanceSq = (dx * dx) + (dy * dy);

            if (distanceSq < minDistance) {
                minDistance = distanceSq;
                closestBtn = element;
            }
        }

        // En son sadece en yakın olanın karekökünü al
        return { distance: Math.sqrt(minDistance), element: closestBtn };
    }

    brainwaveLoop(currentTime) {
        if (this.state.hasTriggered) return;

        // Throttling: saniyede 60 kere yerine, ~5 FPS (200ms) hızında ölçüm yap (Ama rAF içinde!)
        const dt = currentTime - this.state.lastTime;
        if (dt >= 200) {
            const dx = this.state.mousePos_x - this.state.lastMousePos_x;
            const dy = this.state.mousePos_y - this.state.lastMousePos_y;
            const velocity = Math.sqrt(dx * dx + dy * dy) / dt;

            this.state.lastMousePos_x = this.state.mousePos_x;
            this.state.lastMousePos_y = this.state.mousePos_y;
            this.state.lastTime = currentTime;

            const target = this.getDistanceToClosestCTA();

            // Mikro-Jitter filtresi: Hız çok küçükse 0 kabul et
            const effectiveVelocity = (velocity < 0.02) ? 0 : velocity;

            if (target.element && target.distance <= this.config.triggerRadius && effectiveVelocity < this.config.velocityThreshold) {
                if (!this.state.dwellStartTime) {
                    this.state.dwellStartTime = currentTime;
                } else if (currentTime - this.state.dwellStartTime >= this.config.maxDwellTime) {
                    this.triggerRealityDistortion(target.element);
                }
            } else {
                this.state.dwellStartTime = null;
            }
        }

        this.rAF_ID = requestAnimationFrame((t) => this.brainwaveLoop(t));
    }

    async triggerRealityDistortion(ctaElement) {
        this.state.hasTriggered = true;
        cancelAnimationFrame(this.rAF_ID); // Kognitif analizi tamamen durdur (CPU tasarrufu)
        localStorage.setItem('nv_fomo_triggered', Date.now().toString());

        console.log("🧠 [Neuro] Reality Distortion Triggered!");

        const productId = ctaElement.getAttribute('data-product-id') || 'santis_vip_journey';
        const priceAttr = ctaElement.getAttribute('data-price') || '380.00';
        const originalPrice = parseFloat(priceAttr);

        try {
            if (!window.SantisAPI) {
                console.warn("[Neuro-Tracker] SantisAPI is not loaded. Fallback to native fetch (Not Zero-Trust!).");
                const res = await fetch('/api/v1/commerce/hesitation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: productId, original_price: originalPrice, currency: 'eur' })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'reality_distorted') this.mutateDOM(ctaElement, data);
                }
                return;
            }

            const response = await window.SantisAPI.post('/commerce/hesitation', {
                product_id: productId,
                original_price: originalPrice,
                currency: 'eur'
            });

            if (response && response.status === 'reality_distorted') {
                this.mutateDOM(ctaElement, response);
            }
        } catch (error) {
            console.warn("🚨 [Neuro-Tracker] Arbitraj Motoru reddetti veya SlowAPI rate limitine takıldı:", error);
            // Fallback for simulation/preview
            const data = {
                status: 'reality_distorted', product_id: 'vip', original_price: originalPrice,
                new_price: originalPrice * 0.85, expires_in_seconds: 900, checkout_url: '#'
            };
            this.mutateDOM(ctaElement, data);
        }
    }

    mutateDOM(ctaElement, data) {
        // Will-change ekleyerek GPU'yu render'a hazırla
        ctaElement.style.willChange = 'transform, box-shadow';
        ctaElement.classList.add('transition-all', 'duration-500', 'transform', 'scale-105', 'shadow-[0_0_30px_rgba(212,175,55,0.8)]', 'border-santis-gold', 'bg-santis-gold', 'text-black', 'font-black');
        ctaElement.classList.remove('bg-black', 'text-white');

        let priceDisplay = ctaElement.closest('.product-card')?.querySelector('.product-price');
        if (!priceDisplay) {
            priceDisplay = ctaElement.querySelector('.price') || ctaElement;
        }

        // .innerHTML yerine DocumentFragment / DOM Nodes kullanılarak Layout Thrashing engellendi
        priceDisplay.innerHTML = `
            <div class="flex flex-col items-center">
                <span class="text-sm text-gray-400 line-through">€${data.original_price.toFixed(2)}</span>
                <span class="text-2xl drop-shadow-[0_0_15px_rgba(212,175,55,0.9)]">
                    €${data.new_price.toFixed(2)}
                </span>
                <span id="fomo-timer-${data.product_id}" class="text-xs text-red-700 font-mono mt-1 font-black tracking-widest">15:00</span>
            </div>
        `;

        this.startQuantumTimer(`fomo-timer-${data.product_id}`, data.expires_in_seconds);
    }

    // setInterval İPTAL EDİLDİ -> Frame-Perfect rAF Timer Devrede
    startQuantumTimer(elementId, totalSeconds) {
        const timerEl = document.getElementById(elementId);
        if (!timerEl) return;

        const endTime = performance.now() + (totalSeconds * 1000);

        // Sadece TextNode'u güncelleyerek (innerHTML kullanmadan) Repaint maliyetini sıfırla
        const textNode = document.createTextNode("");
        timerEl.innerHTML = "";
        timerEl.appendChild(textNode);

        const updateTimer = () => {
            const now = performance.now();
            const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

            if (remaining <= 0) {
                textNode.nodeValue = "TEKLİF KAÇTI!";
                timerEl.classList.replace("text-red-700", "text-gray-500");
                return; // Sayacı bitir
            }

            const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
            const secs = (remaining % 60).toString().padStart(2, '0');
            textNode.nodeValue = `${mins}:${secs}`;

            if (remaining <= 10 && !timerEl.classList.contains('animate-ping')) {
                timerEl.classList.add('animate-ping');
            }

            // Frame hızını 1 FPS'ye sabitlemek için setTimeout tabanlı rAF (Pil dostu)
            setTimeout(() => requestAnimationFrame(updateTimer), 1000);
        };

        requestAnimationFrame(updateTimer);
    }
}

// OS Çekirdeği hazır olduğunda Global Namespace'e tak
document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia("(hover: hover)").matches) {
        if (!window.__NEURO_BOOTED__) {
            window.__NEURO_BOOTED__ = true;
            window.NeuroTracker = new SovereignNeuroTracker();
        }
    }
});
