/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🗺️ SANTIS PAGE ROUTER v1.0                                ║
 * ║  Data Loader · Service Catalog · Path Resolver · Init       ║
 * ║  Kernel'e bağlı: resolveModule('router')                   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Kernel bağımlılığı: ['interaction'] (önce interaction-engine yüklenir)
 */

/* ─── 1. ROOT PATH RESOLVER ──────────────────────────────────────────────── */
function getSantisRootPath() {
    if (window.SITE_ROOT) return window.SITE_ROOT;
    // santis-core.js veya app.js üzerinden root'u bul
    const script = document.querySelector(
        'script[src*="/assets/js/app.js"], script[src*="/assets/js/core/santis-core.js"]'
    );
    if (!script) return '';
    const src = script.getAttribute('src');
    const match = src.match(/^(.*?)\/assets\/js\//);
    return match ? match[1] : '';
}

/* ─── 2. CONTENT LOADER — Data Bridge + API Client ──────────────────────── */
async function loadContent() {
    // Fallback data — önce fetch, yoksa boş obje
    if (!window.SANTIS_FALLBACK) {
        try {
            const res = await fetch(window.location.origin + '/assets/data/fallback_data.json');
            if (res.ok) window.SANTIS_FALLBACK = await res.json();
        } catch (_) {
            window.SANTIS_FALLBACK = { global: {} };
        }
    }
    const localFallbackData = window.SANTIS_FALLBACK || { global: {} };

    try {
        // API Client dinamik yükle
        if (!window.SantisAPI) {
            await new Promise(resolve => {
                const s = document.createElement('script');
                s.src = '/assets/js/api-client.js';
                s.onload  = resolve;
                s.onerror = resolve; // hata durumunda bile devam et
                document.head.appendChild(s);
            });
        }

        // Fallback data fetch
        let base = {};
        if (location.protocol === 'file:') {
            base = window.SANTIS_FALLBACK || { global: {} };
        } else {
            const DATA_URL = `/assets/data/fallback-data.json?v=${Date.now()}`;
            const res = await fetch(DATA_URL, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (!res.ok) throw new Error('JSON Fetch Failed');
            const data = await res.json();
            base = data.global ? data : { global: data };
        }

        // Servis kataloğunu normalleştir
        if (!base.global.services) {
            base.global.services = {};
            const keys = [
                'hammam', 'classicMassages', 'extraEffective', 'faceSothys',
                'asianMassages', 'sportsTherapy', 'ayurveda', 'signatureCouples', 'kidsFamily'
            ];
            window.productCatalog = [];
            keys.forEach(key => {
                if (Array.isArray(base.global[key])) {
                    base.global[key].forEach(svc => {
                        if (svc.id) {
                            base.global.services[svc.id] = svc;
                            svc.categoryId = key;
                            window.productCatalog.push(svc);
                        }
                    });
                }
            });
        }

        // API mode — canlı veri
        if (window.SantisAPI && window.SANTIS_API_ONLINE) {
            const currentHotel = (window._routerState?.hotel) || localStorage.getItem('santis_hotel');
            let apiData = null;
            if (currentHotel) {
                const menuData = await window.SantisAPI.getHotelMenu(currentHotel);
                if (menuData?.menu) apiData = menuData.menu;
            }
            if (!apiData) apiData = await window.SantisAPI.getMasterCatalog();
            if (Array.isArray(apiData) && apiData.length > 0) {
                window.productCatalog = apiData;
                base.global.services = {};
                apiData.forEach(svc => {
                    if (svc.id) {
                        if (svc.category && !svc.categoryId) svc.categoryId = svc.category;
                        base.global.services[svc.id] = svc;
                    }
                });
                console.log('[Router] API Data injected. Items:', apiData.length);
            }
        }

        // Global data-ready sinyali
        if (window.productCatalog?.length > 0) {
            window.SANTIS_DATA_READY = true;
            document.dispatchEvent(new Event('santis-data-ready'));
            window.dispatchEvent(new Event('santis-data-ready'));
            console.log(`[Router] 🌌 Product Seed Broadcasted. Items: ${window.productCatalog.length}`);
        }

        return base;

    } catch (e) {
        console.error('[Router] Primary data fetch failed. Falling back cautiously.', e.message);
        if (Object.keys(localFallbackData).length === 0 && !sessionStorage.getItem('santis_safe_load_retried')) {
            sessionStorage.setItem('santis_safe_load_retried', 'true');
            setTimeout(() => window.location.reload(true), 500);
        }
        return window.SANTIS_FALLBACK || localFallbackData;
    }
}

/* ─── 3. PAGE INIT ───────────────────────────────────────────────────────── */
window._routerState = {
    lang:             'tr',
    hotel:            '',
    activeCategoryId: null
};

async function _routerInit() {
    const params = new URLSearchParams(window.location.search);
    window._routerState.lang  = 'tr';
    window._routerState.hotel = params.has('hotel')
        ? (localStorage.setItem('santis_hotel', params.get('hotel')), params.get('hotel'))
        : (localStorage.getItem('santis_hotel') || '');

    const CONTENT = await loadContent();
    if (!CONTENT) return;

    // Service catalog sayfaları
    const isServicePage = !!(
        document.getElementById('service-results') ||
        document.getElementById('svcDrawer')       ||
        document.querySelector('.category-toolbar')
    );
    if (isServicePage) {
        document.getElementById('svcOverlay')?.addEventListener('click',  () => window.closeServiceDrawer?.());
        document.getElementById('svcDrawerClose')?.addEventListener('click', () => window.closeServiceDrawer?.());
        document.getElementById('closeBookingBtn2')?.addEventListener('click', () => window.closeBookingModal?.());
        document.getElementById('bookingCloseBtn')?.addEventListener('click',  () => window.closeBookingModal?.());

        const view    = params.get('view');
        const section = params.get('section');
        if (view) window.setActiveCategoryFromRoute?.(view);
        window.renderAll?.();

        if (section === 'booking') {
            window.scrollToSection?.('booking');
            window.openBookingModal?.();
        } else if (view) {
            const target = document.getElementById(view) || document.querySelector(`[data-section="${view}"]`);
            if (target) window.scrollToSection?.(view);
            else if (window._routerState.activeCategoryId) window.scrollToSection?.('service-results');
        }
    }

    // Homepage guard
    if (typeof window.renderHomeGallery  === 'function') window.renderHomeGallery();
    if (typeof window.initCinematicIntro === 'function') window.initCinematicIntro();
    if (typeof window.initScrollObserver === 'function') setTimeout(() => window.initScrollObserver(), 100);

    // Favicon fallback
    if (!document.querySelector("link[rel*='icon']")) {
        const rootPath     = getSantisRootPath();
        const normalizedRoot = rootPath ? (rootPath.endsWith('/') ? rootPath : rootPath + '/') : '/';
        const fl = document.createElement('link');
        fl.rel   = 'shortcut icon';
        fl.href  = normalizedRoot + 'favicon.ico';
        document.head.appendChild(fl);
    }

    // Kernel sinyali
    if (globalThis.__SANTIS__?.services?.bus) {
        globalThis.__SANTIS__.services.bus.emit('router:page-ready', {
            path: location.pathname, ts: performance.now()
        });
    }
    if (typeof window.initSantisCards === 'function') {
        requestAnimationFrame(() => {
            window.initSantisCards();
            setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
        });
    }
    console.log('[Page Router v1.0] ✅ Page init complete:', location.pathname);
}

/* ─── 4. PATH RESOLVER — window.SANTIS_RESOLVE_PATH ─────────────────────── */
window.SANTIS_RESOLVE_PATH = function(slug) {
    let section = 'masajlar';
    const catalog = window.productCatalog || [];
    const item    = catalog.find(p => p.slug === slug || p.id === slug);
    if (item) {
        const cat = (item.categoryId || item.category || '').toLowerCase();
        if      (cat.includes('hammam') || cat.includes('hamam')) section = 'hamam';
        else if (cat.includes('skin')   || cat.includes('cilt')  || cat.includes('face') || cat.includes('sothys')) section = 'cilt-bakimi';
    }
    const lang = (window.SITE_LANG || 'tr').toLowerCase();
    return `/${lang}/${section}/${slug}.html`;
};

/* ─── 5. DATA GUARD — window.getSantisData ───────────────────────────────── */
window.getSantisData = function() {
    try {
        const all = [
            ...(window.SANTIS_HAMMAM   || []),
            ...(window.SANTIS_MASSAGES || []),
            ...(window.SANTIS_SKINCARE || [])
        ];
        if (all.length === 0) console.warn('[Router] Warning: Data sets empty.');
        return all;
    } catch (e) {
        console.error('[Router] Critical: Data Bridge Failed.', e);
        return [];
    }
};

/* ─── 6. LAUNCH ──────────────────────────────────────────────────────────── */
_routerInit();
