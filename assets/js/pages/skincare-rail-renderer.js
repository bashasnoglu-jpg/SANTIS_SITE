/* ==========================================================================
   SANTIS SOVEREIGN RAIL RENDERER v1.0
   Kategori bazlı yatay card rail'leri (Netflix-style)
   Her .santis-rail[data-category-id] için services.json'dan filtreli kart dizer.
========================================================================== */

(function initSovereignRails() {
    'use strict';

    // Rail tanımları: HTML'deki data-category-id → services.json categoryId
    const RAIL_MAP = {
        'sothys-purifying': ['sothys-purifying', 'purify', 'detox'],
        'sothys-hydra':     ['sothys-hydra', 'hydra', 'skincare'],
        'sothys-antiage':   ['sothys-antiage', 'antiage', 'anti-aging'],
        'sothys-men':       ['sothys-men', 'men', 'erkek']
    };

    // ─── Kart HTML Şablonu ─────────────────────────────────────────────────
    function buildCard(item, index) {
        const title    = item.name || item.content?.tr?.title || 'Santis Bakımı';
        const price    = item.price_eur
                         ? `€${item.price_eur}`
                         : (item.price?.amount ? `€${item.price.amount}` : '');
        const img      = item.image
                         || (item.media?.hero ? `/assets/img/cards/${item.media.hero}` : '/assets/img/cards/massage.webp');
        const href     = item.detailUrl || '#';
        const shortDesc = item.content?.tr?.shortDesc || item.description || '';

        const card = document.createElement('a');
        card.href  = href;
        card.className = 'santis-rail-card santis-await-reveal';
        card.style.transitionDelay = `${(index % 6) * 0.07}s`;

        card.innerHTML = `
            <div class="santis-rail-card-inner">
                <img
                    src="${img}"
                    alt="${title}"
                    loading="lazy"
                    decoding="async"
                    class="santis-rail-card-img"
                    width="300" height="380"
                >
                <div class="santis-rail-card-overlay">
                    ${price ? `<span class="santis-rail-card-price">${price}</span>` : ''}
                    <h3 class="santis-rail-card-title">${title}</h3>
                    ${shortDesc ? `<p class="santis-rail-card-desc">${shortDesc}</p>` : ''}
                </div>
                <div class="santis-rail-glare"></div>
            </div>
        `;
        return card;
    }

    // ─── Rail'e Kart Bas ───────────────────────────────────────────────────
    function renderRail(track, items) {
        if (!track || !items.length) {
            if (track) track.closest('.santis-rail')?.classList.add('is-empty');
            return;
        }
        const frag = document.createDocumentFragment();
        items.forEach((item, i) => frag.appendChild(buildCard(item, i)));
        track.appendChild(frag);
    }

    // ─── Scroll Reveal (IntersectionObserver) ─────────────────────────────
    function initReveal(container) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-revealed');
                obs.unobserve(entry.target);
            });
        }, { rootMargin: '-20px 0px', threshold: 0.08 });

        container.querySelectorAll('.santis-rail-card.santis-await-reveal')
            .forEach(card => observer.observe(card));
    }

    // ─── Yatay Sürükleme (Momentum Physics — Cover Flow ile aynı his) ──────────
    function initDragScroll(track) {
        let isDown    = false;
        let startX    = 0;
        let scrollLeft = 0;
        let velocity  = 0;
        let lastX     = 0;
        let lastTime  = 0;
        let rafId     = null;

        // Momentum döngüsü (requestAnimationFrame)
        function momentumLoop() {
            if (Math.abs(velocity) < 0.5) {
                velocity = 0;
                return;
            }
            track.scrollLeft -= velocity;
            velocity *= 0.92;          // Sürtünme katsayısı (0.88 = hızlı dur, 0.96 = uzun kayar)
            rafId = requestAnimationFrame(momentumLoop);
        }

        track.addEventListener('mousedown', e => {
            isDown     = true;
            startX     = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
            velocity   = 0;
            lastX      = e.pageX;
            lastTime   = performance.now();
            if (rafId) cancelAnimationFrame(rafId);
            track.style.cursor = 'grabbing';
            track.style.userSelect = 'none';
        });

        document.addEventListener('mouseup', () => {
            if (!isDown) return;
            isDown = false;
            track.style.cursor = 'grab';
            track.style.userSelect = '';
            // Serbest bırakınca momentumu ateşle
            rafId = requestAnimationFrame(momentumLoop);
        });

        document.addEventListener('mousemove', e => {
            if (!isDown) return;
            e.preventDefault();
            const x    = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5;

            // Anlık hız hesabı
            const now   = performance.now();
            const dt    = now - lastTime || 1;
            velocity    = (lastX - e.pageX) / dt * 12; // Fırlatma kuvveti
            lastX       = e.pageX;
            lastTime    = now;

            track.scrollLeft = scrollLeft - walk;
        });

        // Touch (mobil parmak) desteği
        let touchStartX = 0;
        let touchScrollLeft = 0;

        track.addEventListener('touchstart', e => {
            touchStartX    = e.touches[0].pageX;
            touchScrollLeft = track.scrollLeft;
            velocity        = 0;
            if (rafId) cancelAnimationFrame(rafId);
        }, { passive: true });

        track.addEventListener('touchmove', e => {
            const dx = e.touches[0].pageX - touchStartX;
            track.scrollLeft = touchScrollLeft - dx;
        }, { passive: true });

        track.addEventListener('touchend', e => {
            // Parmak kaldırılınca momentum devam eder
            rafId = requestAnimationFrame(momentumLoop);
        }, { passive: true });
    }

    // ─── Ana Ateşleme ──────────────────────────────────────────────────────
    async function boot() {
        const rails = document.querySelectorAll('.santis-rail[data-category-id]');
        if (!rails.length) return;

        let allServices = [];
        try {
            const res  = await fetch('/assets/data/services.json');
            allServices = await res.json();
            if (!Array.isArray(allServices)) {
                allServices = allServices.services || allServices.categories?.flatMap(c => c.services || c.items) || [];
            }
        } catch (err) {
            console.warn('⚠️ [Rail Renderer] services.json yüklenemedi:', err.message);
            return;
        }

        rails.forEach(rail => {
            const catId  = rail.dataset.categoryId;
            const allowed = RAIL_MAP[catId] || [catId];
            const track  = rail.querySelector('.santis-rail-track');

            // Kategori filtresi
            const filtered = allServices.filter(item => {
                const itemCat  = (item.categoryId || item.category || '').toLowerCase();
                const itemTags = (item.tags || []).map(t => t.toLowerCase());
                return allowed.some(a => itemCat.includes(a) || itemTags.includes(a));
            });

            renderRail(track, filtered);
            initDragScroll(track);

            console.log(`🎠 [Rail Renderer] "${catId}" → ${filtered.length} kart hazır.`);
        });

        // Tüm kartlar yerleştikten sonra reveal observer'ı çalıştır
        const wrapper = document.querySelector('.santis-rails-wrapper');
        if (wrapper) initReveal(wrapper);

        // ─── Öne Çıkan Bakımlar Cover Flow Carousel'i yeniden ateşle ──────
        // (bento-orchestrator kaldırıldığından bu çağrı buraya taşındı)
        setTimeout(() => {
            if (typeof window.initCoverFlowCarousel === 'function') {
                window.initCoverFlowCarousel();
                console.log('🎡 [Rail Renderer] Cover Flow Carousel yeniden ateşlendi.');
            }
        }, 200);
    }

    // DOM hazır olduğunda veya zaten hazırsa başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
