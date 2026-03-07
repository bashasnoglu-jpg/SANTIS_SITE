/**
 * 🌍 SANTIS SOVEREIGN RAIL ENGINE v3.0 (ULTRA-MEGA)
 * Kineti-Core Physics, Panopticon Parallax, Zero Tolerance Snap
 */

class SovereignRail {
    constructor(viewport) {
        this.viewport = viewport;
        this.track = viewport.querySelector('.rail-track');

        // Physics State
        this.isDown = false;
        this.startX = 0;
        this.scrollLeft = 0;
        this.velX = 0;
        this.momentumID = null;
        this.parallaxID = null;
        this.originalScrollWidth = 0;
        this.originalCardCount = 0;

        // Navigation
        this.controlsContainer = viewport.querySelector('.slider-controls') || viewport.querySelector('.rail-controls') || (viewport.nextElementSibling?.classList.contains('rail-controls') ? viewport.nextElementSibling : null);
        this.dotsContainer = this.controlsContainer?.querySelector('.rail-dots');
        this.prevBtn = this.controlsContainer?.querySelector('.slider-prev') || this.controlsContainer?.querySelector('.rail-prev');
        this.nextBtn = this.controlsContainer?.querySelector('.slider-next') || this.controlsContainer?.querySelector('.rail-next');

        if (this.track) this.init();
    }

    init() {
        // Core Setup
        this.setupInfiniteClone();
        this.setupDragEvents();
        this.setupTouchEvents();

        if (this.controlsContainer) {
            this.setupControls();
        }

        // Start Parallax Loop
        this.startParallaxEngine();

        this.resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => this.recalculateMetrics());
        });
        this.resizeObserver.observe(this.viewport);
    }

    setupInfiniteClone() {
        const cards = Array.from(this.track.children);
        this.originalCardCount = cards.length;
        if (cards.length === 0) return;

        const fragment = document.createDocumentFragment();

        cards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.classList.add('rail-clone');
            clone.setAttribute('aria-hidden', 'true');
            // Remove checkout specific IDs from clones to prevent duplication issues
            const ctaBtn = clone.querySelector('.santis-omni-cta');
            if (ctaBtn) ctaBtn.removeAttribute('id');
            fragment.appendChild(clone);
        });

        this.track.appendChild(fragment);

        window.requestAnimationFrame(() => this.recalculateMetrics());

        this.track.addEventListener('scroll', () => {
            if (!this.isDown && !this.momentumID) {
                this.handleInfiniteScroll();
            }
        }, { passive: true });
    }

    recalculateMetrics() {
        const firstClone = this.track.querySelector('.rail-clone');
        if (firstClone) {
            this.originalScrollWidth = firstClone.offsetLeft;
        } else {
            this.originalScrollWidth = this.track.scrollWidth / 2;
        }
    }

    handleInfiniteScroll() {
        if (this.track.scrollLeft >= this.originalScrollWidth) {
            const shift = this.originalScrollWidth;
            this.track.scrollLeft = this.track.scrollLeft - shift;
        } else if (this.track.scrollLeft <= 0) {
            const shift = this.originalScrollWidth - 1;
            this.track.scrollLeft = shift;
        }
        this.syncDots();
    }

    getCardWidth() {
        const firstCard = this.track.children[0];
        if (!firstCard) return 300;
        const style = window.getComputedStyle(firstCard);
        return firstCard.offsetWidth + parseInt(style.marginRight || 0) + parseInt(style.marginLeft || 0);
    }

    // --- QUANTUM SNAP PHYSICS (Kineti-Core) ---
    applyMagneticSnap() {
        const cardWidth = this.getCardWidth();
        if (cardWidth <= 0) return;

        // Bulunduğumuz scroll noktasında en yakın kartın index'i
        const closestIndex = Math.round(this.track.scrollLeft / cardWidth);
        const targetScroll = closestIndex * cardWidth;

        this.track.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });

        setTimeout(() => this.handleInfiniteScroll(), 600); // Snap bittikten sonra loop check
    }

    // --- PANOPTICON PARALLAX (Derinlik Simülasyonu) ---
    startParallaxEngine() {
        const tick = () => {
            // Sadece ekranda görünen elementleri bulup içlerindeki IMG'leri kaydırıyoruz.
            const scrollX = this.track.scrollLeft;
            const cardWidth = this.getCardWidth();
            const cards = Array.from(this.track.children);

            // Eğer sistem aşırı yüklenirse (120FPS düşerse) Parallax otomatik devreden çıkabilir
            // Şimdilik %15 tersine hareket formülü: x_img = (scroll_pos - offset) * 0.15
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const img = card.querySelector('img');
                if (img) {
                    const cardOffset = i * cardWidth;
                    // Kartın merkeze olan uzaklığı (normalized)
                    const distance = scrollX - cardOffset;

                    // Görseli kapsayıcısına göre %15 ters yönde kaydır.
                    // Aşırıya kaçmaması için clamp (sınır) eklenebilir, scale zaten 1.1 verildi.
                    const parallaxX = distance * 0.15;
                    img.style.transform = `scale(1.1) translateX(${parallaxX}px)`;
                }
            }
            this.parallaxID = requestAnimationFrame(tick);
        };
        tick();
    }

    // --- MASAÜSTÜ DRAG (MOMENTUM) ---
    setupDragEvents() {
        this.track.style.scrollBehavior = 'auto'; // CSS Smooth'u devreden çıkar, biz yöneteceğiz
        this.track.style.scrollSnapType = 'none'; // Native CSS snap'i iptal et, manyetik JS'ye geç

        this.viewport.addEventListener('mousedown', (e) => {
            if (e.target.closest('.slider-controls') || e.target.closest('button')) return;
            this.isDown = true;
            this.track.classList.add('is-dragging');
            this.startX = e.pageX;
            this.scrollLeft = this.track.scrollLeft;
            this.velX = 0;
            cancelAnimationFrame(this.momentumID);
            this.track.style.scrollBehavior = 'auto'; // Drag esnasında smooth iptal
        });

        const endDrag = () => {
            if (!this.isDown) return;
            this.isDown = false;
            this.track.classList.remove('is-dragging');

            // Momentum & Magnetic Snap başlat
            this.track.style.scrollBehavior = 'smooth';
            this.applyMagneticSnap();
        };

        window.addEventListener('mouseup', endDrag);
        this.viewport.addEventListener('mouseleave', endDrag);

        this.viewport.addEventListener('mousemove', (e) => {
            if (!this.isDown) return;
            e.preventDefault();
            const x = e.pageX;
            const walk = (x - this.startX) * 1.5; // Drag hızı

            // Sola ve sağa dragging limitlerini sonsuz döngüyle bağla
            let newScroll = this.scrollLeft - walk;
            if (newScroll < 0) newScroll = this.originalScrollWidth - Math.abs(newScroll);
            if (newScroll > this.originalScrollWidth * 2) newScroll = this.originalScrollWidth; // Overscroll koruması

            this.track.scrollLeft = newScroll;
            this.syncDots();
        });
    }

    // --- MOBİL TOUCH (PASSIVE YERİNE AKTİF IVME) ---
    setupTouchEvents() {
        let touchStartX = 0;
        let touchScrollLeft = 0;

        this.viewport.addEventListener('touchstart', (e) => {
            if (e.target.closest('.slider-controls') || e.target.closest('button')) return;
            // Native smooth durdurma
            this.track.style.scrollBehavior = 'auto';
            cancelAnimationFrame(this.momentumID);
            this.isDown = true;
            touchStartX = e.touches[0].pageX;
            touchScrollLeft = this.track.scrollLeft;
            this.track.classList.add('is-dragging');
        }, { passive: true });

        const endTouch = () => {
            if (!this.isDown) return;
            this.isDown = false;
            this.track.classList.remove('is-dragging');

            // Momentum & Magnetic Snap
            this.track.style.scrollBehavior = 'smooth';
            this.applyMagneticSnap();
        };

        this.viewport.addEventListener('touchend', endTouch, { passive: true });
        this.viewport.addEventListener('touchcancel', endTouch, { passive: true });

        this.viewport.addEventListener('touchmove', (e) => {
            if (!this.isDown) return;
            // Let native scrolling happen, we just track it to apply snap at the end
        }, { passive: true });
    }

    syncDots() {
        if (!this.dotsContainer || this.originalCardCount === 0) return;

        const cardWidth = this.getCardWidth();
        const rawIndex = Math.round(this.track.scrollLeft / cardWidth);
        const activeIndex = rawIndex % this.originalCardCount;

        const dots = this.dotsContainer.querySelectorAll('span');
        dots.forEach((dot, index) => {
            if (index === activeIndex) {
                dot.style.backgroundColor = 'white';
                dot.style.opacity = '1';
                dot.style.transform = 'scale(1.2)';
            } else {
                dot.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                dot.style.opacity = '0.5';
                dot.style.transform = 'scale(1)';
            }
        });
    }

    setupControls() {
        if (this.prevBtn && this.nextBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.track.style.scrollBehavior = 'smooth';
                this.track.scrollBy({ left: -this.getCardWidth(), behavior: 'smooth' });
                setTimeout(() => this.handleInfiniteScroll(), 500);
            });

            this.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.track.style.scrollBehavior = 'smooth';
                this.track.scrollBy({ left: this.getCardWidth(), behavior: 'smooth' });
                setTimeout(() => this.handleInfiniteScroll(), 500);
            });
        }

        if (!this.dotsContainer || this.originalCardCount === 0) return;
        this.dotsContainer.innerHTML = '';

        for (let i = 0; i < this.originalCardCount; i++) {
            const dot = document.createElement('span');
            dot.className = 'w-2 h-2 flex-shrink-0 flex-grow-0 rounded-full transition-all duration-300 cursor-pointer block';
            dot.style.backgroundColor = i === 0 ? 'white' : 'rgba(255, 255, 255, 0.3)';
            dot.style.opacity = i === 0 ? '1' : '0.5';
            dot.style.transform = i === 0 ? 'scale(1.2)' : 'scale(1)';

            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.track.style.scrollBehavior = 'smooth';
                this.track.scrollTo({ left: this.getCardWidth() * i, behavior: 'smooth' });
            });

            this.dotsContainer.appendChild(dot);
        }
    }
}

// OS Başlatıcı
window.initSovereignRails = function () {
    console.log("⚡ [Sovereign Rail] Başlatma Talebi Alındı (Ultra-Mega V3.0).");
    document.querySelectorAll('[data-rail-engine="true"]').forEach(viewport => {
        const track = viewport.querySelector('.rail-track');
        if (track && track.children.length === 0 && track.classList.contains('rituals-container')) {
            return; // Async render bekleniyor
        }

        if (!viewport.dataset.railInit) {
            new SovereignRail(viewport);
            viewport.dataset.railInit = "true";
            console.log(`🚂 [Sovereign Rail] Kineti-Core Yüklendi -> ${viewport.dataset.railId}`);
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.initSovereignRails === 'function') {
            window.initSovereignRails();
        }
    }, 100);
});

