/**
 * ⚡ SANTIS V7 QUANTUM RAIL ENGINE — Sovereign Soft-Match Edition
 * Kategori eşleştirme: "masaj" → massage-asian, massage-premium vb.
 * Loader kill, JIT render, fallback chains.
 */

const QuantumRail = {
    init(data) {
        // Container: santis-matrix-container → rail-container → santis-boutique-grid
        this.railContainer = document.getElementById('santis-matrix-container')
            || document.querySelector('.rail-container')
            || document.getElementById('santis-boutique-grid');

        this.loader = document.getElementById('santis-sovereign-loader')
            || document.getElementById('santis-loader')
            || document.querySelector('.sovereign-loader, .santis-loader, [data-sovereign-loader]');

        if (!this.railContainer) {
            console.debug('💤 [Quantum Rail] Bu sayfada Rail kapsayıcısı yok. Motor uyku modunda.');
            this.killLoader();
            return;
        }

        // Sayfa kategorisi: data-category attr → URL'den otomatik
        const attrCat = (this.railContainer.getAttribute('data-category') || '').toLowerCase().trim();
        const urlCat = this._detectCategoryFromUrl();
        const targetCategory = attrCat || urlCat;

        // 🧠 SOFT-MATCH: "masaj" → massage-*, "hamam" → ritual-hammam, hammam-*
        const arr = Array.isArray(data) ? data : (data?.detail || []);
        this.products = arr.filter(item => {
            const cat = (item.category || item.categoryId || '').toLowerCase().trim();
            if (!targetCategory || targetCategory === 'all') return true;
            return cat.includes(targetCategory) || targetCategory.includes(cat.split('-')[0]);
        });

        console.log(`🚂 [Quantum Rail] [${targetCategory}] → ${this.products.length} kart`);

        if (this.products.length === 0) {
            this.railContainer.innerHTML = `
                <p style="color:#D4AF37;text-align:center;padding:2rem;font-size:.85rem;letter-spacing:.1em;">
                    Bu koleksiyon güncelleniyor…
                </p>`;
            this.killLoader();
            return;
        }

        this.renderRail();
    },

    _detectCategoryFromUrl() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('masaj')) return 'massage';
        if (path.includes('hamam')) return 'hammam';
        if (path.includes('cilt')) return 'skincare';
        if (path.includes('ritual')) return 'ritual';
        if (path.includes('journey')) return 'journey';
        return 'all';
    },

    renderRail() {
        this.railContainer.innerHTML = '';
        this.railContainer.style.cssText = [
            'display:flex', 'gap:1.25rem', 'overflow-x:auto',
            'scroll-snap-type:x mandatory', 'padding:1rem .5rem 1.5rem',
            'scrollbar-width:none', '-ms-overflow-style:none'
        ].join(';');

        const frag = document.createDocumentFragment();

        this.products.forEach((item, i) => {
            const title = item.title || item.name || 'Sovereign Ritüeli';
            const imgUrl = (item.image && item.image.length > 5)
                ? item.image
                : '/assets/img/cards/santis_card_massage_lux.webp';
            const priceRaw = item.price_eur || item.price;
            const priceStr = priceRaw ? `€${priceRaw}` : 'VIP';

            const card = document.createElement('article');
            card.className = 'rail-item';
            card.style.cssText = [
                'min-width:260px', 'max-width:280px', 'scroll-snap-align:start',
                'flex-shrink:0', 'cursor:pointer',
                'opacity:0', 'transform:translateY(12px)',
                'transition:opacity .5s ease,transform .5s ease'
            ].join(';');

            card.innerHTML = `
                <div style="position:relative;width:100%;aspect-ratio:4/5;overflow:hidden;border-radius:3px;border:1px solid rgba(255,255,255,0.06);background:#0a0a0a">
                    <img src="${imgUrl}" alt="${title}" loading="lazy" decoding="async"
                         width="280" height="350"
                         style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 2s ease">
                    <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.6) 0%,transparent 60%)"></div>
                </div>
                <div style="padding:.6rem .25rem;text-align:center">
                    <h3 style="font-size:.85rem;color:#fff;margin-bottom:.3rem;letter-spacing:.05em;line-height:1.3">${title}</h3>
                    <span style="color:#D4AF37;font-size:.75rem;letter-spacing:.15em">${priceStr}</span>
                </div>`;

            // Staggered entrance
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, (i % 12) * 80);

            // Click → detail URL veya QuickView
            card.addEventListener('click', () => {
                const url = item.url || item.detailUrl;
                if (url) { window.location.href = url; }
                else if (window.BoutiqueQuickView) {
                    window.BoutiqueQuickView.open({ ...item, price_eur: priceRaw, isProduct: true });
                }
            });

            frag.appendChild(card);
        });

        this.railContainer.appendChild(frag);
        this.killLoader();
        console.log(`✅ [Quantum Rail] ${this.products.length} kart render edildi.`);
    },

    killLoader() {
        if (this.loader) {
            this.loader.style.transition = 'opacity .5s ease';
            this.loader.style.opacity = '0';
            setTimeout(() => {
                if (this.loader) this.loader.style.display = 'none';
            }, 550);
        }
        // Fallback: tüm sovereign-loader class'larını kapat
        document.querySelectorAll('.sovereign-loader,.santis-loader,[data-sovereign-loader]')
            .forEach(el => { el.style.opacity = '0'; setTimeout(() => el.style.display = 'none', 550); });
    }
};

// Dışarıya aç (SantisDataBridge ile uyumluluk)
window.SovereignQuantumRailV7 = function (containerId, data) {
    QuantumRail.init(data);
};
window.QuantumRail = QuantumRail;

// ── BOOT ────────────────────────────────────────────────────
(function bootRail() {
    if (window.__SANTIS_RAIL_READY__ && window.SovereignDataMatrix) {
        QuantumRail.init(window.SovereignDataMatrix);
    } else {
        document.addEventListener('santis:rail-ready', (e) => QuantumRail.init(e.detail), { once: true });

        // Fallback: 3s sonra services.json direkt çek
        setTimeout(() => {
            if (!document.querySelector('.rail-item')) {
                console.warn('⏳ [Quantum Rail] Data Bridge gecikti, manuel fetch...');
                fetch('/assets/data/services.json')
                    .then(r => r.json())
                    .then(d => QuantumRail.init(d))
                    .catch(() => QuantumRail.killLoader());
            }
        }, 3000);
    }
})();
