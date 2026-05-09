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

function normalizeRouterCatalog(catalog = {}) {
    return {
        programs: Array.isArray(catalog.programs) ? catalog.programs : [],
        hammam: Array.isArray(catalog.hammam) ? catalog.hammam : [],
        massages: Array.isArray(catalog.massages) ? catalog.massages : [],
        skincare: Array.isArray(catalog.skincare) ? catalog.skincare : [],
        extras: Array.isArray(catalog.extras) ? catalog.extras : [],
    };
}

function flattenRouterCatalog(catalog = {}) {
    const safeCatalog = normalizeRouterCatalog(catalog);
    return [
        ...safeCatalog.programs,
        ...safeCatalog.hammam,
        ...safeCatalog.massages,
        ...safeCatalog.skincare,
        ...safeCatalog.extras,
    ];
}

const SIGNATURE_CAROUSEL_LIMIT = 10;
const SIGNATURE_CAROUSEL_FILTERS = [
    'hue-rotate(180deg) saturate(150%)',
    'sepia(50%) hue-rotate(-20deg) contrast(120%)',
    'grayscale(20%) sepia(30%)',
    'hue-rotate(40deg) brightness(1.1)',
    'hue-rotate(280deg) saturate(200%)',
    'sepia(40%) hue-rotate(20deg)',
    'contrast(110%) brightness(0.9)',
    'hue-rotate(250deg) saturate(180%)',
    'grayscale(60%) brightness(0.7)',
    'sepia(50%) contrast(130%) saturate(150%)',
];

const SIGNATURE_COLOR_HEX = {
    hammamTheme: '16110C',
    journeyTheme: '10131A',
    massageTheme: '101712',
    skincareTheme: '121724',
    fallbackTheme: '12100D',
    gold: 'D4AF37',
    journeyAccent: 'C8A46A',
    massageAccent: 'A9C7A3',
    skincareAccent: 'B7C4D8',
};

function hexColor(token) {
    return `#${token}`;
}

const SIGNATURE_THEME_PALETTE = {
    hammam: { themeColor: hexColor(SIGNATURE_COLOR_HEX.hammamTheme), accentColor: hexColor(SIGNATURE_COLOR_HEX.gold) },
    journey: { themeColor: hexColor(SIGNATURE_COLOR_HEX.journeyTheme), accentColor: hexColor(SIGNATURE_COLOR_HEX.journeyAccent) },
    massage: { themeColor: hexColor(SIGNATURE_COLOR_HEX.massageTheme), accentColor: hexColor(SIGNATURE_COLOR_HEX.massageAccent) },
    skincare: { themeColor: hexColor(SIGNATURE_COLOR_HEX.skincareTheme), accentColor: hexColor(SIGNATURE_COLOR_HEX.skincareAccent) },
    fallback: { themeColor: hexColor(SIGNATURE_COLOR_HEX.fallbackTheme), accentColor: hexColor(SIGNATURE_COLOR_HEX.gold) },
};

function getRouterLocale() {
    return (window.SITE_LANG || window._routerState?.lang || 'tr').toLowerCase();
}

function getLocalizedProductContent(product = {}) {
    const content = product.content || {};
    const locale = getRouterLocale();
    return content[locale] || content.tr || content.en || content.de || {};
}

function normalizeCarouselImagePath(product = {}) {
    const rawPath = product.image || product.media?.card || product.media?.hero || product.heroImage || '';
    const path = String(rawPath).trim();

    if (!path) return '/assets/img/cards/hammam.webp';
    if (/^(https?:|data:|blob:)/i.test(path) || path.startsWith('/')) return path;
    if (path.startsWith('assets/')) return `/${path}`;
    return `/assets/img/cards/${path.replace(/^\.?\//, '')}`;
}

function resolveSignatureTitle(product = {}) {
    const content = getLocalizedProductContent(product);
    return content.title || content.heroTitle || product.title || product.name || 'Santis Ritual';
}

function resolveSignatureDescription(product = {}) {
    const content = getLocalizedProductContent(product);
    return (
        content.intro ||
        content.shortDesc ||
        product.description ||
        content.fullDesc ||
        'Santis Club imzasıyla tasarlanan, bedeni ve zihni aynı anda dengeleyen seçkin bir bakım ritüeli.'
    );
}

function resolveSignatureCategory(product = {}) {
    const category = String(product.categoryId || product.category || '').toLowerCase();

    if (category.includes('hammam') || category.includes('hamam')) return 'Hamam Ritüeli';
    if (category.includes('journey') || category.includes('program')) return 'Santis Journey';
    if (category.includes('sothys') || category.includes('skin') || category.includes('cilt')) return 'Cilt Bakımı';
    if (category.includes('massage') || category.includes('masaj')) return 'Masaj Terapisi';
    return 'Signature Ritual';
}

function getSignaturePaletteKey(product = {}) {
    const category = String(product.categoryId || product.category || '').toLowerCase();

    if (category.includes('hammam') || category.includes('hamam') || category.includes('ritual')) return 'hammam';
    if (category.includes('journey') || category.includes('program')) return 'journey';
    if (category.includes('sothys') || category.includes('skin') || category.includes('cilt')) return 'skincare';
    if (category.includes('massage') || category.includes('masaj')) return 'massage';
    return 'fallback';
}

function isHexColor(value) {
    return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function resolveSignatureTheme(product = {}) {
    const content = getLocalizedProductContent(product);
    const palette = SIGNATURE_THEME_PALETTE[getSignaturePaletteKey(product)] || SIGNATURE_THEME_PALETTE.fallback;
    const productTheme = product.themeColor || product.theme?.color || content.themeColor;
    const productAccent = (
        product.accentColor ||
        product.media?.color ||
        product.color ||
        product.theme?.accentColor ||
        content.accentColor
    );

    return {
        themeColor: isHexColor(productTheme) ? productTheme.trim() : palette.themeColor,
        accentColor: isHexColor(productAccent) ? productAccent.trim() : palette.accentColor,
    };
}

function resolveSignatureArea(product = {}) {
    const category = String(product.categoryId || product.category || '').toLowerCase();

    if (category.includes('hammam') || category.includes('hamam')) return 'Hamam';
    if (category.includes('skin') || category.includes('cilt') || category.includes('sothys')) return 'Yüz & Cilt';
    if (category.includes('journey') || category.includes('program')) return 'Tüm Deneyim';
    return 'Tüm Beden';
}

function resolveSignatureDuration(product = {}) {
    const duration = product.duration || product.durationMinutes || product.minutes;

    if (!duration) return 'Özel Plan';
    if (typeof duration === 'number') return `${duration} Dk`;
    if (/^\d+$/.test(String(duration))) return `${duration} Dk`;
    return String(duration);
}

function resolveSignaturePrice(product = {}) {
    if (product.price && product.price.amount) {
        return `${product.price.amount}${product.price.currency || '€'}`;
    }
    if (product.price_eur) return `${product.price_eur}€`;
    if (product.priceText) return product.priceText;
    return 'Danışınız';
}

function scoreSignatureProduct(product = {}, index = 0) {
    const category = String(product.categoryId || product.category || '').toLowerCase();
    const tags = Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : '';
    const content = getLocalizedProductContent(product);
    const searchable = `${category} ${tags} ${product.id || ''} ${product.slug || ''}`.toLowerCase();
    let score = 0;

    if (product.isFeatured || product.featured || product.highlight || product.highlighted) score += 1000;
    if (searchable.includes('ritual')) score += 340;
    if (searchable.includes('hammam') || searchable.includes('hamam')) score += 320;
    if (searchable.includes('journey') || searchable.includes('program')) score += 280;
    if (searchable.includes('signature') || searchable.includes('premium') || searchable.includes('classic')) score += 120;
    if (searchable.includes('couple') || searchable.includes('asian')) score += 90;
    if (searchable.includes('massage') || searchable.includes('masaj')) score += 70;
    if (searchable.includes('skin') || searchable.includes('sothys') || searchable.includes('cilt')) score += 50;
    if (normalizeCarouselImagePath(product)) score += 20;
    if (product.detailUrl || product.url) score += 10;
    if (content.signature || content.tagline || content.intro) score += 10;

    return score - index * 0.01;
}

function selectSignatureProducts(products = []) {
    const seen = new Set();
    const uniqueProducts = products.filter((product) => {
        const id = product.id || product.slug || product.name;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
    });

    return uniqueProducts
        .map((product, index) => ({ product, index, score: scoreSignatureProduct(product, index) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .slice(0, SIGNATURE_CAROUSEL_LIMIT)
        .map(({ product }) => product);
}

function applyInlineStyles(element, styles = {}) {
    Object.assign(element.style, styles);
    return element;
}

function createRevealMetric(label, value) {
    const metric = applyInlineStyles(document.createElement('div'), {
        background: 'rgba(0,0,0,0.4)',
        padding: '15px 30px',
        borderRadius: '12px',
        border: '1px solid rgba(212,175,55,0.3)',
        backdropFilter: 'blur(10px)',
    });
    const labelEl = applyInlineStyles(document.createElement('span'), {
        display: 'block',
        fontSize: '0.8rem',
        color: 'var(--santis-gold, rgb(212, 175, 55))',
        letterSpacing: '2px',
    });
    const valueEl = applyInlineStyles(document.createElement('strong'), {
        fontSize: '1.3rem',
    });

    labelEl.textContent = label;
    valueEl.textContent = value;
    metric.append(labelEl, valueEl);
    return metric;
}

function createSignatureRevealData(product = {}, title = '') {
    const revealData = document.createElement('div');
    revealData.className = 'santis-reveal-data';

    const heading = applyInlineStyles(document.createElement('h2'), {
        fontFamily: "'Playfair Display', serif",
        fontSize: '3.5rem',
        marginBottom: '20px',
        color: '#fff',
    });
    heading.dataset.morph = 'title';
    heading.textContent = title;

    const description = applyInlineStyles(document.createElement('p'), {
        fontSize: '1.2rem',
        color: 'rgba(255,255,255,0.9)',
        lineHeight: '1.9',
        marginBottom: '40px',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
    });
    description.textContent = resolveSignatureDescription(product);

    const metrics = applyInlineStyles(document.createElement('div'), {
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        marginBottom: '50px',
        flexWrap: 'wrap',
    });
    metrics.append(
        createRevealMetric('SÜRE', resolveSignatureDuration(product)),
        createRevealMetric('BÖLGE', resolveSignatureArea(product)),
        createRevealMetric('ÜCRET', resolveSignaturePrice(product))
    );

    const cta = applyInlineStyles(document.createElement('a'), {
        padding: '16px 40px',
        fontSize: '1.1rem',
        boxShadow: '0 10px 30px rgba(212,175,55,0.2)',
    });
    const bookingText = `Merhaba, ${title} için rezervasyon bilgisi almak istiyorum.`;
    cta.href = `https://wa.me/905348350169?text=${encodeURIComponent(bookingText)}`;
    cta.target = '_blank';
    cta.rel = 'noopener noreferrer';
    cta.className = 'santis-btn santis-btn-primary santis-magnetic';
    cta.textContent = 'HEMEN REZERVASYON';

    revealData.append(heading, description, metrics, cta);
    return revealData;
}

function createSignatureCarouselCard(product = {}, index = 0) {
    const title = resolveSignatureTitle(product);
    const imagePath = normalizeCarouselImagePath(product);
    const theme = resolveSignatureTheme(product);
    const card = document.createElement('div');
    const heading = document.createElement('h3');
    const meta = document.createElement('span');

    card.className = 'santis-stack-card';
    card.dataset.santisBg = imagePath;
    card.dataset.productId = product.id || product.slug || title;
    card.dataset.serviceId = product.id || product.slug || title;
    card.dataset.reveal = product.slug || product.id || `signature-${index + 1}`;
    card.dataset.themeColor = theme.themeColor;
    card.dataset.accentColor = theme.accentColor;
    card.dataset.assetPriority = index < 3 ? 'eager' : 'lazy';
    card.style.setProperty('--santis-reveal-delay', `${Math.min(index, 7) * 86}ms`);
    card.style.setProperty('--card-img', `url("${imagePath.replace(/["\\]/g, '\\$&')}")`);
    card.style.backgroundImage = `url("${imagePath.replace(/["\\]/g, '\\$&')}")`;
    card.style.filter = SIGNATURE_CAROUSEL_FILTERS[index % SIGNATURE_CAROUSEL_FILTERS.length];

    heading.dataset.morph = 'title';
    heading.textContent = title;

    meta.className = 'santis-stack-meta';
    meta.textContent = resolveSignatureCategory(product);

    card.append(heading, meta, createSignatureRevealData(product, title));
    return card;
}

function createSignatureRevealVeil() {
    const veil = document.createElement('div');
    const positions = ['left', 'center', 'right'];

    veil.className = 'santis-reveal-veil';
    veil.setAttribute('aria-hidden', 'true');

    positions.forEach((position) => {
        const wire = document.createElement('div');
        wire.className = `skeleton-card-wire skeleton-card-wire--${position}`;
        veil.appendChild(wire);
    });

    return veil;
}

function ensureSignatureRevealVeil(stage) {
    if (!stage) return null;
    return stage.querySelector('.santis-reveal-veil') || createSignatureRevealVeil();
}

function primeSignatureCarouselAssets(stage, products = []) {
    if (!stage || !Array.isArray(products)) return;

    stage._santisCarouselPreloads = products.map((product, index) => {
        const imagePath = normalizeCarouselImagePath(product);
        const image = new Image();

        image.decoding = 'async';
        image.fetchPriority = index < 3 ? 'high' : 'low';
        image.src = imagePath;
        return image;
    });
}

function syncSignatureCarouselWithCatalog(products = []) {
    const stage = document.querySelector('#sov-3d-stage-elements.santis-carousel-stage, #imza-deneyimler-v45 .santis-carousel-stage');
    const selectedProducts = selectSignatureProducts(Array.isArray(products) ? products : []);

    if (!stage) return { synced: false, reason: 'stage-missing', count: 0 };
    if (selectedProducts.length === 0) return { synced: false, reason: 'catalog-empty', count: 0 };

    const signature = selectedProducts.map((product) => product.id || product.slug || product.name).join('|');
    if (stage.dataset.santisCatalogSync === signature) {
        return { synced: false, reason: 'unchanged', count: selectedProducts.length };
    }

    const fragment = document.createDocumentFragment();
    const shouldShowReveal = stage.dataset.santisRevealComplete !== 'true';
    const revealVeil = shouldShowReveal ? ensureSignatureRevealVeil(stage) : null;

    selectedProducts.forEach((product, index) => {
        fragment.appendChild(createSignatureCarouselCard(product, index));
    });

    stage.replaceChildren(fragment);
    if (revealVeil) {
        stage.appendChild(revealVeil);
        stage.classList.add('is-loading');
        stage.setAttribute('aria-busy', 'true');
    }
    stage.dataset.santisCatalogSync = signature;
    stage.dataset.santisCatalogCount = String(selectedProducts.length);
    primeSignatureCarouselAssets(stage, selectedProducts);

    requestAnimationFrame(() => {
        if (typeof window.initCoverFlowCarousel === 'function') {
            window.initCoverFlowCarousel();
        }
        window.dispatchEvent(
            new CustomEvent('SANTIS_CAROUSEL_SYNCED', {
                detail: {
                    source: 'CoreState',
                    count: selectedProducts.length,
                    ids: selectedProducts.map((product) => product.id || product.slug || product.name),
                },
            })
        );
    });

    console.log(`[Page Router] ✅ Signature carousel synced (${selectedProducts.length} catalog items).`);
    return { synced: true, reason: 'core-state', count: selectedProducts.length };
}

/* ─── 2. CONTENT LOADER — Data Bridge + API Client ──────────────────────── */
async function hydratePageFromCoreState() {
    const api = window.SantisApi;

    if (!api || typeof api.getCoreState !== "function") {
        console.error("[PageRouter] SantisApi is unavailable. Canonical contract not loaded.");
        throw new Error("SantisApi.getCoreState unavailable");
    }

    const state = await api.getCoreState();
    const catalog = normalizeRouterCatalog(state.catalog);
    const products = flattenRouterCatalog(catalog);

    window.SantisCoreState = state;
    window.SantisCatalog = catalog;
    window.productCatalog = products;

    window.SANTIS_DATA_READY = true;

    let carouselSync = { synced: false, reason: 'not-run', count: 0 };

    try {
        carouselSync = syncSignatureCarouselWithCatalog(products);
    } catch (e) {
        console.error('[PageRouter] Signature carousel sync failed:', e);
    }

    window.dispatchEvent(
        new CustomEvent("SANTIS_DATA_READY", {
            detail: {
                source: "CoreState",
                catalog,
                products,
                state,
                carouselSync,
            },
        })
    );

    console.log(`[Page Router] ✅ Hydrated from CoreState (${products.length} catalog items).`);
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
