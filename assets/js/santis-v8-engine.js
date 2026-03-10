/**
 * 🦅 SANTIS ULTRA CARD ENGINE V8.5 (AESTHETIC & LÜKS SÜRÜM)
 * Apple/LV Standard Luxury Cards | Unbreakable CSS Rails | Smart Category AI
 * v8.5 — 2026-03-10
 */

const SantisCardEngineV8 = (() => {
    let DATA = [];
    const SEEN_CARDS = new Set();

    /* ── 1. KIRILMAZ LÜKS CSS ZIRHI ── */
    function injectLuxuryStyles() {
        if (document.getElementById('santis-v8-luxury-styles')) return;
        const style = document.createElement('style');
        style.id = 'santis-v8-luxury-styles';
        style.textContent = `
            .santis-v8-rail {
                display: flex !important;
                flex-wrap: nowrap !important;
                overflow-x: auto !important;
                gap: 2rem !important;
                padding: 1rem 0 3rem 0 !important;
                width: 100% !important;
                scroll-snap-type: x mandatory !important;
                -webkit-overflow-scrolling: touch !important;
                scrollbar-width: none !important;
            }
            .santis-v8-rail::-webkit-scrollbar { display: none !important; }

            .santis-v8-grid {
                display: grid !important;
                gap: 2rem !important;
                width: 100% !important;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
            }

            .santis-card-v8 {
                position: relative !important;
                flex: 0 0 auto !important;
                width: 300px !important;
                aspect-ratio: 3 / 4;
                background: #050505;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                scroll-snap-align: start;
                transform: translateZ(0);
                border: 1px solid rgba(212,175,55,0.1);
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transition: all 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
            }
            .santis-v8-grid .santis-card-v8 {
                width: 100% !important;
            }
            .santis-card-v8:hover {
                border-color: rgba(212,175,55,0.4);
                transform: translateY(-10px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(212,175,55,0.1);
            }
            .santis-card-img {
                position: absolute; inset: 0;
                width: 100%; height: 100%;
                object-fit: cover;
                transition: transform 2s cubic-bezier(0.25,0.46,0.45,0.94);
                opacity: 0.9;
            }
            .santis-card-v8:hover .santis-card-img {
                transform: scale(1.08);
                opacity: 1;
            }
            .santis-card-overlay {
                position: absolute; inset: 0;
                transition: background 0.6s ease;
                background: linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.3) 50%, transparent 100%);
            }
            .santis-card-v8:hover .santis-card-overlay {
                background: linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.6) 60%, rgba(212,175,55,0.08) 100%);
            }
            .santis-card-content {
                position: absolute; bottom: 0; left: 0; width: 100%;
                padding: 2rem 1.5rem;
                display: flex; flex-direction: column;
                transform: translateY(20px);
                transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
                z-index: 10;
            }
            .santis-card-v8:hover .santis-card-content { transform: translateY(0); }
            .santis-card-cat {
                color: #D4AF37; font-size: 0.65rem; letter-spacing: 0.3em;
                text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;
            }
            .santis-card-title {
                color: #fff; font-family: ui-serif, Georgia, serif;
                font-size: 1.3rem; line-height: 1.3; margin: 0 0 1rem;
                text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                transition: color 0.4s ease;
            }
            .santis-card-v8:hover .santis-card-title { color: #D4AF37; }
            .santis-card-footer {
                display: flex; justify-content: space-between; align-items: center;
                border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;
                opacity: 0; transition: opacity 0.6s ease;
            }
            .santis-card-v8:hover .santis-card-footer {
                opacity: 1;
                border-top-color: rgba(212,175,55,0.3);
            }
            .santis-card-price { color: #fff; font-size: 1rem; letter-spacing: 0.1em; font-weight: 300; }
            .santis-card-btn {
                color: #D4AF37; font-size: 0.7rem; letter-spacing: 0.2em;
                text-transform: uppercase; display: flex; align-items: center;
                gap: 0.5rem; font-weight: 600;
            }
            .santis-card-btn::after { content: '⟶'; font-size: 1.1rem; transition: transform 0.3s ease; }
            .santis-card-v8:hover .santis-card-btn::after { transform: translateX(5px); }
        `;
        document.head.appendChild(style);
    }

    /* ── 2. BOOT ── */
    async function init(injectedData = null) {
        injectLuxuryStyles();

        const sockets = document.querySelectorAll('.santis-socket, #santis-matrix-container, .rail-container');
        if (!sockets.length) return console.warn('[V8.5] Hedef socket bulunamadı.');

        try {
            if (injectedData && Array.isArray(injectedData) && injectedData.length > 0) {
                DATA = injectedData;
            } else if (window.SovereignDataMatrix && window.SovereignDataMatrix.length > 0) {
                DATA = window.SovereignDataMatrix;
            } else {
                const res = await fetch('/assets/data/services.json?v=' + Date.now());
                DATA = await res.json();
            }

            DATA = DATA.map(item => ({
                ...item,
                id: item.id || item.slug || ('v8-' + Math.random().toString(36).substr(2, 9)),
                category: (item.category || item.categoryId || '').toLowerCase().trim(),
                title: item.title || item.name || 'Sovereign İksir',
                price_eur: parseFloat(item.price_eur || (item.price && item.price.amount) || item.price || 0) || 0,
                image: (item.image && item.image.length > 5)
                    ? item.image
                    : '/assets/img/cards/santis_card_massage_lux.webp'
            }));

            sockets.forEach(s => {
                if (!s.classList.contains('santis-v8-rail') && !s.classList.contains('santis-v8-grid')) {
                    s.innerHTML = '';
                }
            });

            renderSockets(sockets);
            bindFilters();
            killLoaders();
            console.log('[V8.5] ' + DATA.length + ' formül işlendi.');

        } catch (e) {
            console.error('🚨 [V8.5]:', e);
            killLoaders();
        }
    }

    /* ── 3. CONTEXT ── */
    function renderSockets(sockets) {
        const path = window.location.pathname.toLowerCase();

        sockets.forEach(socket => {
            let cat = (socket.dataset.category || socket.id || 'all').toLowerCase().trim();
            const layout = socket.dataset.layout || (path.includes('/urunler') ? 'grid' : 'rail');
            const limit = parseInt(socket.dataset.limit) || 0;

            if (!socket.dataset.category || cat === 'santis-matrix-container') {
                if (path.includes('/masajlar')) cat = 'massage';
                else if (path.includes('/hamam')) cat = 'hammam';
                else if (path.includes('/cilt-bakimi')) cat = 'skincare';
                else if (path.includes('/urunler')) cat = 'all';
                else if (path.includes('/rituals')) cat = 'journey';
                else cat = 'all';
            }

            let items = filterData(cat);
            if (limit > 0) items = items.slice(0, limit);
            if (!items.length) return;

            if (layout === 'rail') renderRail(socket, items, cat);
            else renderGrid(socket, items, cat);
        });
    }

    /* ── 4. FİLTRE ── */
    function filterData(cat) {
        if (!cat || cat === 'all') return DATA;
        return DATA.filter(item => {
            const c = item.category;
            if (c === cat) return true;
            if (cat === 'massage' || cat === 'masaj') return c.includes('massage') || c.includes('masaj') || c.includes('terapi') || c.includes('doku');
            if (cat === 'hammam' || cat === 'hamam') return c.includes('hamam') || c.includes('hammam') || c.includes('kese');
            if (cat === 'skincare' || cat === 'cilt') return c.includes('skincare') || c.includes('cilt') || c.includes('sothys') || c.includes('beauty');
            if (cat === 'journey' || cat === 'ritual') return c.includes('journey') || c.includes('ritual') || c.includes('paket');
            return c.includes(cat) || cat.includes(c);
        });
    }

    /* ── 5. RENDER ── */
    function renderRail(container, items, socketCat) {
        container.className = 'santis-socket santis-v8-rail';
        const frag = document.createDocumentFragment();
        items.forEach((item, i) => {
            const key = 'rail-' + socketCat + '-' + item.id;
            if (SEEN_CARDS.has(key)) return;
            SEEN_CARDS.add(key);
            frag.appendChild(createCard(item, 'rail', i));
        });
        container.appendChild(frag);
    }

    function renderGrid(container, items, socketCat) {
        container.className = 'santis-socket santis-v8-grid';
        const frag = document.createDocumentFragment();
        items.forEach((item, i) => {
            const key = 'grid-' + socketCat + '-' + item.id;
            if (SEEN_CARDS.has(key)) return;
            SEEN_CARDS.add(key);
            frag.appendChild(createCard(item, 'grid', i));
        });
        container.appendChild(frag);
    }

    /* ── 6. KART FORGE ── */
    function createCard(item, layout, index) {
        const title = item.title;
        const price = item.price_eur > 0 ? '\u20AC' + item.price_eur : 'VIP';
        const img = item.image;
        const targetUrl = item.url || item.detailUrl || null;
        const dispCat = (item.category || 'Koleksiyon').split('-').pop().replace(/_/g, ' ').toUpperCase();

        const article = document.createElement('article');
        article.className = 'santis-card-v8';
        article.style.opacity = '0';
        article.style.transform = 'translateY(12px)';
        article.style.transition = 'opacity .6s ease, transform .6s ease';

        article.innerHTML = [
            '<img src="' + img + '" alt="' + title.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async" class="santis-card-img">',
            '<div class="santis-card-overlay"></div>',
            '<div class="santis-card-content">',
            '  <div class="santis-card-cat">' + dispCat + '</div>',
            '  <h3 class="santis-card-title">' + title + '</h3>',
            '  <div class="santis-card-footer">',
            '    <span class="santis-card-price">' + price + '</span>',
            '    <span class="santis-card-btn">İncele</span>',
            '  </div>',
            '</div>'
        ].join('');

        setTimeout(() => {
            article.style.opacity = '1';
            article.style.transform = 'translateY(0)';
        }, (index % 12) * 90);

        article.addEventListener('click', e => {
            e.preventDefault();

            // 🚨 COEP / V17 GÜVENLİK YAMASI: 
            // JSON'da eski usül (statik .html) bir URL olsa bile onu ezip, 
            // her şeyi V17 Dynamic Detail Page'e yönlendiriyoruz!
            if (window.BoutiqueQuickView) return window.BoutiqueQuickView.open({ ...item, isProduct: layout === 'grid', title, image: img });
            if (window.SovereignVault) return window.SovereignVault.open({ ...item, title, image: img });

            window.location.href = '/tr/urunler/detay.html?id=' + item.id;
        });

        return article;
    }

    /* ── 7. FİLTRE BUTONLARI ── */
    function bindFilters() {
        const btns = document.querySelectorAll('.boutique-filter');
        const gridSocket = document.querySelector('.santis-socket[data-layout="grid"]');
        if (!btns.length || !gridSocket) return;

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filterVal = (btn.getAttribute('data-filter') || 'all').toLowerCase();
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                gridSocket.style.opacity = '0';
                setTimeout(() => {
                    gridSocket.innerHTML = '';
                    gridSocket.dataset.category = filterVal;
                    gridSocket.className = 'santis-socket';
                    SEEN_CARDS.clear();
                    renderSockets([gridSocket]);
                    gridSocket.style.opacity = '1';
                }, 300);
            });
        });
    }

    /* ── 8. LOADER ── */
    function killLoaders() {
        document.querySelectorAll('#santis-loader, .sovereign-loader, .loading-screen')
            .forEach(l => { l.style.opacity = '0'; setTimeout(() => l.style.display = 'none', 500); });
    }

    return { init };
})();

/* Geriye dönük uyumluluk */
window.SantisCardEngineV8 = SantisCardEngineV8;
window.SantisV8Engine = { boot: SantisCardEngineV8.init };

/* ── BOOT TETİKLEYİCİ ── */
(function () {
    console.log("[V8.5] Engine standby. Waiting for DOM & DATA barriers...");

    let domReady = false;
    let dataReady = false;
    let dataPayload = null;
    let bootTriggered = false;

    function checkLocks() {
        if (domReady && dataReady && !bootTriggered) {
            bootTriggered = true;
            console.log("⚡ [V8] DOM & DATA barriers passed. Rendering cards...");
            SantisCardEngineV8.init(dataPayload || window.SovereignDataMatrix);
        }
    }

    // V11 Sovereign Bus Architecture - Execution bound to DOMContentLoaded to guarantee all Edge Kernels are loaded
    function engageSovereignLocks() {
        if (window.SantisBus) {
            window.SantisBus.on('santis:dom-ready', () => {
                domReady = true;
                checkLocks();
            });

            window.SantisBus.on('santis:rail-ready', (evt) => {
                dataReady = true;
                if (evt && evt.detail) dataPayload = evt.detail;
                else if (Array.isArray(evt)) dataPayload = evt;
                checkLocks();
            });
        } else {
            // Legacy Failsafe (If Bus is entirely missing somehow)
            domReady = true;
            document.addEventListener('santis:rail-ready', (e) => { dataReady = true; dataPayload = e.detail; checkLocks(); }, { once: true });

            setTimeout(() => {
                if (!bootTriggered && !document.querySelector('.santis-card-v8')) {
                    console.warn('[V8.5] Absolute Failsafe: Phantom Render Race Condition forced boot.');
                    dataReady = true;
                    checkLocks();
                }
            }, 3000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', engageSovereignLocks);
    } else {
        engageSovereignLocks();
    }
})();
