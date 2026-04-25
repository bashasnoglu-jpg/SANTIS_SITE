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
async function hydratePageFromCoreState() {
  const api = window.SantisApi;

  if (!api || typeof api.getCoreState !== "function") {
    throw new Error("[Page Router] SantisApi.getCoreState unavailable");
  }

  const state = await api.getCoreState();

  window.SantisCoreState = state;
  window.productCatalog = state.catalog;

  window.dispatchEvent(
    new CustomEvent("SANTIS_DATA_READY", {
      detail: {
        source: "CoreState",
        catalog: state.catalog,
        state,
      },
    })
  );

  console.log("[Page Router] ✅ Hydrated from CoreState.");
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

    try {
        await hydratePageFromCoreState();
    } catch (e) {
        console.error("Failed to hydrate page:", e);
        return;
    }

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
