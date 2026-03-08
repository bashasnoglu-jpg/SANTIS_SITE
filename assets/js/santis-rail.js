/**
 * SANTIS OS - SOVEREIGN RAIL MATRIX
 * Overdamped Spring, EMA Velocity Tracking, Projected Magnetic Snap, Kill-Switch
 */

export class SovereignRail {
    constructor(containerSelector) {
        this.track = typeof containerSelector === 'string' ? document.querySelector(containerSelector) : containerSelector;
        if (!this.track) return;

        this.cards = Array.from(this.track.querySelectorAll('.nv-rail-card'));
        if (this.cards.length === 0) this.cards = Array.from(this.track.children);

        // Fiziksel Durumlar (Kuantum Hafızası)
        this.currentX = 0;       // Ekrandaki anlık konum
        this.targetX = 0;        // Mıknatısın çekeceği hedef konum
        this.velocity = 0;       // Anlık Hız (EMA)

        // Aktif Kart 
        this.currentIndex = 0;

        // Sensör Radarı
        this.isDragging = false;
        this.isAnimating = false;
        this.startX = 0;
        this.lastX = 0;
        this.lastTime = 0;
        this.dragScrollStartX = 0;
        this.dragScrollStartLeft = 0;

        // Yay Ayarları (Sessiz Lüks)
        this.STIFFNESS = 0.06;   // Çekim gücü (Düşük = Ağırbaşlı)
        this.DAMPING = 0.85;     // Sönümleme (Yüksek = Overdamped, zıplama yok)
        this.MOMENTUM_MULTIPLIER = 12; // Gelecek izdüşüm çarpanı

        // Native scroll tercihi: transform fiziği yerine scrollLeft kullan
        this.useNativeScroll = true;

        // Telemetry Callbacks (Test ve HUD İçin)
        this.onTelemetryUpdate = null;

        this.initSensors();

        if (window.SantisBus) {
            window.SantisBus.emit('santis:rail-ready', { id: this.track.id || 'unknown' });
        }

        console.log("🚂 [Sovereign Rail] Fizik Motoru Online. Kuantum Rayları Hazır.");
    }

    initSensors() {
        // Event Delegation for clicks (Solves CTA Rebind Issue)
        this.initEventDelegation();

        // Native drag-to-scroll (mouse/touch) — scrollLeft üzerinden
        this.track.addEventListener('pointerdown', (e) => {
            this.dragScrollStartX = e.clientX;
            this.dragScrollStartLeft = this.track.scrollLeft;
            this.isDragging = true;
            this.track.style.cursor = 'grabbing';
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.dragScrollStartX;
            this.track.scrollLeft = this.dragScrollStartLeft - dx;
            this.syncIndexWithScroll();
        }, { passive: true });

        window.addEventListener('pointerup', () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.track.style.cursor = 'grab';
        });

        // Dikey wheel'i yataya çevir ama native scroll kullan
        this.track.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            e.preventDefault();
            this.track.scrollBy({ left: e.deltaY, behavior: 'smooth' });
            this.syncIndexWithScroll();
        }, { passive: false });

        // Scroll sırasında aktif kartı senkronize et
        this.track.addEventListener('scroll', () => this.syncIndexWithScroll(), { passive: true });

        // Physics motoru için önceki kod; native mod aktifken erken çık
        if (this.useNativeScroll) return;

        this.track.addEventListener('pointerdown', (e) => {
            if (this.isSafeMode) return;
            this.isDragging = true;
            this.isAnimating = false; // Kullanıcı dokunduğunda animasyonu durdur
            this.startX = e.clientX - this.currentX;
            this.lastX = e.clientX;
            this.lastTime = performance.now();
            this.velocity = 0; // Yeni dokunuş, eski enerjiyi sıfırla
            this.track.style.cursor = 'grabbing';
            this.track.style.transition = 'none'; // Native CSS transition kapalı
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging || this.isSafeMode) return;

            // 1. Konum Güncellemesi
            const currentClientX = e.clientX;
            this.currentX = currentClientX - this.startX;
            this.targetX = this.currentX;

            // 2. Zaman ve Mesafe Farkı
            const currentTime = performance.now();
            const dt = currentTime - this.lastTime;
            const dx = currentClientX - this.lastX;

            // 3. EMA Hız Filtresi (Kuantum Radarı)
            if (dt > 0) {
                const instantVelocity = dx / dt;
                // %60 Yeni Hız, %40 Eski Hız
                this.velocity = (instantVelocity * 0.6) + (this.velocity * 0.4);
            }

            this.lastX = currentClientX;
            this.lastTime = currentTime;

            this.updateTransform();
            this.reportTelemetry();
        });

        window.addEventListener('pointerup', () => {
            if (!this.isDragging || this.isSafeMode) return;
            this.isDragging = false;
            this.track.style.cursor = 'grab';

            this.executeSovereignSnap();
        });
    }

    initEventDelegation() {
        this.track.addEventListener('click', (e) => {
            const ctaBtn = e.target.closest('button[onclick*="window.location" i], a[href]');
            if (!ctaBtn) return;

            // Eğer isAnimating true veya isDragging true ise tıklamaları engelle (Sürüklerken yanlışlıkla tıklamamak için)
            if (this.isDragging || Math.abs(this.velocity) > 0.5) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { capture: true });

        // MutationObserver to watch for newly injected cards (Telemetry rebind watcher)
        const observer = new MutationObserver(() => {
            this.cards = Array.from(this.track.querySelectorAll('.nv-rail-card'));
            if (this.cards.length === 0) this.cards = Array.from(this.track.children);
            if (this.cards.length > 0 && !this.isSafeMode) {
                this.checkKillSwitch();
            }
        });
        observer.observe(this.track, { childList: true, subtree: false });
    }

    checkKillSwitch() {
        // Eğer rail ekranda görünmüyorsa (tab arkasındaysa vs.), kill-switch'i tetikleme!
        // Çünkü display: none olan elementlerin genişliği 0 okunur ve bu sahte (false) bir alarmdır.
        if (!this.track || this.track.offsetParent === null) return false;

        const trackWidth = this.track.getBoundingClientRect().width;
        const totalCards = this.cards.length;

        // Kuantum Çökmesi (0 width, NaN velocity, vs)
        if (trackWidth === 0 || totalCards === 0 || isNaN(this.velocity)) {
            this.enableSafeMode();
            return true;
        }
        return false;
    }

    enableSafeMode() {
        if (this.isSafeMode) return;

        console.warn('🚨 [Sovereign Rail] CRITICAL FAILURE: Kill-Switch Triggered. Activating Safe Fallback.');
        this.isSafeMode = true;
        this.track.classList.add('rail-safe');
        this.track.classList.add('kill-switch-active');
        this.track.style.transform = 'none'; // Kuantum çekimi iptal
        this.track.style.cursor = 'auto';
        this.isAnimating = false;

        if (window.SovereignDataSanitizer) {
            window.santisDebug = { ...window.santisDebug, killSwitchFired: true, safeModeEnabled: true };
        }
    }

    executeSovereignSnap() {
        if (this.isSafeMode) return;

        // 1. Gelecek İzdüşümü (Kader Tahmini)
        const projectedX = this.currentX + (this.velocity * this.MOMENTUM_MULTIPLIER);

        // 2. Yönelimsel Tolerans (Niyet Okuma)
        const direction = Math.sign(this.velocity);
        const speedThreshold = 0.3; // px/ms

        let closestCardIndex = 0;
        let minDistance = Infinity;

        // Kartların konumlarını tara
        this.cards.forEach((card, index) => {
            const cardTargetX = -card.offsetLeft;
            const distance = Math.abs(projectedX - cardTargetX);

            if (distance < minDistance) {
                minDistance = distance;
                closestCardIndex = index;
            }
        });

        // "En Az Bir Kart" Sıçrama Kuralı (Flick yaptıysa zorla bir sonrakine at)
        if (Math.abs(this.velocity) > speedThreshold) {
            let currentCardIndex = this.cards.findIndex(c => -c.offsetLeft <= this.currentX);
            if (currentCardIndex === -1 && this.currentX > 0) currentCardIndex = 0;
            else if (currentCardIndex === -1) currentCardIndex = this.cards.length - 1;

            if (direction < 0) {
                closestCardIndex = Math.max(closestCardIndex, currentCardIndex + 1);
            } else {
                closestCardIndex = Math.min(closestCardIndex, currentCardIndex - 1);
            }
        }

        // 3. Sınır Zırhı (Clamp)
        closestCardIndex = Math.max(0, Math.min(closestCardIndex, this.cards.length - 1));
        this.currentIndex = closestCardIndex;

        // 4. Nihai Hedefi Mühürle
        this.targetX = -this.cards[this.currentIndex].offsetLeft;

        // Momentum Korunumu: this.velocity sıfırlanmaz.
        this.startEngine();
        this.updateDots();
    }

    // --- MANUEL BUTON KONTROLLERİ ---
    scrollNext() {
        if (this.useNativeScroll || this.isSafeMode) {
            const step = this.getScrollStep();
            this.track.scrollBy({ left: step, behavior: 'smooth' });
            this.syncIndexWithScroll(true);
            return;
        }
        if (this.currentIndex < this.cards.length - 1) {
            this.currentIndex = Math.min(this.cards.length - 1, this.currentIndex + 1);
            this.targetX = -this.cards[this.currentIndex].offsetLeft;
            this.startEngine();
            this.updateDots();
        }
    }

    scrollPrev() {
        if (this.useNativeScroll || this.isSafeMode) {
            const step = this.getScrollStep();
            this.track.scrollBy({ left: -step, behavior: 'smooth' });
            this.syncIndexWithScroll(true);
            return;
        }
        if (this.currentIndex > 0) {
            this.currentIndex = Math.max(0, this.currentIndex - 1);
            this.targetX = -this.cards[this.currentIndex].offsetLeft;
            this.startEngine();
            this.updateDots();
        }
    }

    attachControls(prevBtn, nextBtn) {
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollPrev();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollNext();
            });
        }
    }

    // --- NOKTA GÖSTERGELERi (Pagination Dots) ---
    attachDots(dotsContainer) {
        this.dotsContainer = dotsContainer;
        this.updateDots();
    }

    updateDots() {
        if (!this.dotsContainer) return;
        Array.from(this.dotsContainer.children).forEach((dot, i) => {
            const isActive = (i === this.currentIndex);
            dot.style.width = isActive ? '22px' : '6px';
            dot.style.background = isActive ? '#B39B59' : 'rgba(179,155,89,0.35)';
            dot.style.borderRadius = '4px';
        });
    }

    syncIndexWithScroll(forceUpdate = false) {
        if (!this.cards || this.cards.length === 0) return;
        const trackRect = this.track.getBoundingClientRect();
        let closestIndex = 0;
        let minDist = Infinity;
        this.cards.forEach((card, idx) => {
            const cardRect = card.getBoundingClientRect();
            const dist = Math.abs(cardRect.left - trackRect.left);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = idx;
            }
        });
        if (forceUpdate || closestIndex !== this.currentIndex) {
            this.currentIndex = closestIndex;
            this.updateDots();
        }
    }

    getScrollStep() {
        if (!this.cards || this.cards.length === 0) return 320;
        const gap = parseFloat(getComputedStyle(this.track).columnGap || getComputedStyle(this.track).gap || '20');
        return this.cards[0].getBoundingClientRect().width + gap;
    }

    startEngine() {
        if (this.isAnimating || this.isSafeMode) return;
        if (this.checkKillSwitch()) return;
        this.isAnimating = true;

        const tick = () => {
            if (!this.isAnimating || this.isDragging || this.isSafeMode) return;

            // THE OVERDAMPED SPRING (Ağırbaşlı Yay Fiziği)
            const springForce = (this.targetX - this.currentX) * this.STIFFNESS;
            this.velocity += springForce;
            this.velocity *= this.DAMPING;
            this.currentX += this.velocity;

            if (isNaN(this.currentX)) {
                this.enableSafeMode();
                return;
            }

            // Kills-Switch: Kuantum Durma Noktası (Sub-Pixel Anti-Aliasing)
            if (Math.abs(this.targetX - this.currentX) < 0.5 && Math.abs(this.velocity) < 0.01) {
                this.currentX = this.targetX;
                this.velocity = 0;
                this.isAnimating = false;
                console.log("🛑 [Sovereign Rail] Sistem Uyku Moduna Geçti.");
            }

            this.updateTransform();
            this.reportTelemetry();

            if (this.isAnimating) {
                requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);
    }

    updateTransform() {
        if (this.isSafeMode) return;
        // GPU Hızlandırmalı Translate3D
        this.track.style.transform = `translate3d(${this.currentX}px, 0, 0)`;
    }

    reportTelemetry() {
        if (this.onTelemetryUpdate) {
            this.onTelemetryUpdate({
                velocity: this.velocity.toFixed(3),
                currentX: this.currentX.toFixed(1),
                targetX: this.targetX.toFixed(1),
                distance: Math.abs(this.targetX - this.currentX).toFixed(1),
                state: this.isDragging ? 'DRAGGING' : (this.isAnimating ? 'SNAP_ENGINE_ACTIVE' : (this.isSafeMode ? 'SAFE_MODE' : 'IDLE'))
            });
        }
    }
}

/**
 * AUTO-INJECTOR
 * Sayfadaki tüm `data-rail-engine="true"` rayları başlatır,
 * ok/dot kontrollerini bağlar ve mouse-wheel dikey kaydırmayı yataya yönlendirir.
 */
window.initSovereignRails = function initSovereignRails() {
    const rails = [];

    const sections = document.querySelectorAll('section[data-rail-engine="true"]');
    sections.forEach(section => {
        // Rail track element (ana container)
        const track = section.querySelector('.rail-track') || section;
        if (!track) return;

        const rail = new SovereignRail(track);
        rails.push(rail);

        // Prev / Next buttons (aynı section içinde)
        const prevBtn = section.querySelector('.slider-prev');
        const nextBtn = section.querySelector('.slider-next');
        rail.attachControls(prevBtn, nextBtn);

        // Pagination dots
        const dotsContainer = section.querySelector('.rail-dots');
        const buildDots = () => {
            if (!dotsContainer || !rail.cards || rail.cards.length === 0) return;
            dotsContainer.innerHTML = '';
            rail.cards.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.style.cssText = 'width:6px;height:6px;border-radius:999px;background:rgba(179,155,89,0.35);transition:all .25s ease;cursor:pointer;';
                dot.addEventListener('click', () => {
                    rail.currentIndex = idx;
                    rail.targetX = -rail.cards[idx].offsetLeft;
                    rail.startEngine();
                    rail.updateDots();
                });
                dotsContainer.appendChild(dot);
            });
            rail.attachDots(dotsContainer);
        };

        // İlk yükte ve kartlar değişince yeniden kur
        buildDots();
        const observer = new MutationObserver(buildDots);
        observer.observe(track, { childList: true });
    });

    if (rails.length === 0) {
        console.warn('[Sovereign Rail] Başlatılacak ray bulunamadı.');
    } else {
        console.log(`[Sovereign Rail] ${rails.length} ray aktif edildi.`);
    }

    return rails;
};
