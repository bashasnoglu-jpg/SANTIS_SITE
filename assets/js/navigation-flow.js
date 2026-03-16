/**
 * ═══════════════════════════════════════════════════════════
 * SOVEREIGN NAVIGATION FLOW v1.0
 * Breadcrumb + Back CTA + Cross-Sell Rail + Footer Nav
 * Auto-injects after DOM is ready
 * ═══════════════════════════════════════════════════════════
 */
(function() {
    'use strict';

    // ─── ROUTE MAP ───────────────────────────────────
    const CATEGORY_MAP = {
        'hamam':       { label: 'Hamam Ritüelleri',   path: '/tr/hamam/index.html',      crossCat: 'massage' },
        'masajlar':    { label: 'Dünya Masajları',     path: '/tr/masajlar/index.html',    crossCat: 'hamam' },
        'cilt-bakimi': { label: 'Cilt Bakımı',         path: '/tr/cilt-bakimi/index.html', crossCat: 'massage' },
        'rituals':     { label: 'Sovereign Ritüeller', path: '/tr/rituals/index.html',     crossCat: 'hamam' },
        'urunler':     { label: 'Mağaza',              path: '/tr/urunler/index.html',     crossCat: 'massage' },
        'galeri':      { label: 'Galeri',              path: '/tr/galeri/index.html',       crossCat: null },
        'hakkimizda':  { label: 'Hakkımızda',          path: '/tr/hakkimizda/index.html',   crossCat: null },
        'hizmetler':   { label: 'Hizmetler',           path: '/tr/masajlar/index.html',     crossCat: 'hamam' },
        'bilgelik':    { label: 'Bilgelik',            path: '/tr/bilgelik/index.html',     crossCat: null },
        'blog':        { label: 'Blog',                path: '/tr/blog/index.html',         crossCat: null },
        'rezervasyon': { label: 'Rezervasyon',         path: '/tr/rezervasyon/index.html',  crossCat: null },
        'ekibimiz':    { label: 'Ekibimiz',            path: '/tr/ekibimiz/index.html',     crossCat: null },
        'hediye-karti':{ label: 'Hediye Kartı',        path: '/tr/hediye-karti/index.html', crossCat: null }
    };

    // ─── URL PARSER ──────────────────────────────────
    function parsePath() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        // Format A: ['tr', 'masajlar', 'klasik-isvec-masaji', 'index.html'] (subdirectory)
        // Format B: ['tr', 'hamam', 'bal-masaji.html']                     (flat file)
        // Format C: ['tr', 'masajlar', 'index.html']                       (category listing)
        // Format D: ['tr', 'index.html']                                   (homepage)

        const lang = segments[0]; // 'tr' or 'en'
        if (lang !== 'tr' && lang !== 'en') return null;

        const category = segments[1] || null;
        const isHome = !category || category === 'index.html';
        
        let subPage = null;
        let isIndex = false;

        if (isHome) {
            isIndex = true;
        } else if (segments.length === 2) {
            // /tr/hamam/ — category without file
            isIndex = true;
        } else if (segments.length === 3 && segments[2] === 'index.html') {
            // /tr/hamam/index.html — category listing
            isIndex = true;
        } else if (segments.length === 3 && segments[2].endsWith('.html')) {
            // /tr/hamam/bal-masaji.html — flat file detail page (Format B)
            subPage = segments[2].replace(/\.html$/i, '');
            isIndex = false;
        } else if (segments.length >= 3) {
            // /tr/masajlar/klasik-isvec-masaji/index.html — subdirectory (Format A)
            subPage = segments[2];
            isIndex = false;
        }

        return { lang, category, subPage, isHome, isIndex };
    }

    // ─── SLUG TO LABEL ───────────────────────────────
    function slugToLabel(slug) {
        if (!slug) return '';
        return slug
            .replace(/index\.html$/i, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    // ═══════════════════════════════════════════════════
    // 1. BREADCRUMB INJECTOR
    // ═══════════════════════════════════════════════════
    function injectBreadcrumb(parsed) {
        if (!parsed || parsed.isHome) return; // No breadcrumb on homepage
        if (document.querySelector('.cin-breadcrumb')) return; // Sovereign V6: Prevent collision with cinematic layout

        const cat = CATEGORY_MAP[parsed.category];
        const crumbs = [];

        // Level 1: Home
        crumbs.push({ label: 'Anasayfa', href: '/tr/index.html' });

        // Level 2: Category
        if (cat) {
            crumbs.push({
                label: cat.label,
                href: parsed.subPage ? cat.path : null // Link only if we're on a sub-page
            });
        } else if (parsed.category) {
            crumbs.push({
                label: slugToLabel(parsed.category),
                href: parsed.subPage ? `/tr/${parsed.category}/index.html` : null
            });
        }

        // Level 3: Sub-page (current)
        if (parsed.subPage) {
            crumbs.push({ label: slugToLabel(parsed.subPage), href: null });
        }

        // Build HTML
        const sep = '<span class="bc-separator">›</span>';
        const html = crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            if (isLast || !c.href) {
                return `<span class="bc-current">${c.label}</span>`;
            }
            return `<a href="${c.href}">${c.label}</a>`;
        }).join(sep);

        // Create breadcrumb nav with Schema.org markup
        const nav = document.createElement('nav');
        nav.className = 'sovereign-breadcrumb';
        nav.setAttribute('aria-label', 'Breadcrumb');
        nav.innerHTML = html;

        // Inject: ALWAYS before the main content wrapper (never inside it!)
        // Prevents breadcrumb from becoming a grid/flex item
        const target = document.getElementById('cinematic-wrapper') 
                    || document.getElementById('nv-main') 
                    || document.querySelector('main');
        if (target) {
            target.insertAdjacentElement('beforebegin', nav);
        }
    }

    // ═══════════════════════════════════════════════════
    // 2. BACK CTA INJECTOR
    // ═══════════════════════════════════════════════════
    function injectBackCTA(parsed) {
        if (!parsed || parsed.isHome || parsed.isIndex || !parsed.subPage) return;
        if (document.querySelector('.cin-breadcrumb')) return; // Sovereign V6: Cinematic pages have their own CTAs

        const cat = CATEGORY_MAP[parsed.category];
        if (!cat) return;

        const backDiv = document.createElement('div');
        backDiv.className = 'sovereign-back-cta';
        backDiv.innerHTML = `
            <a href="${cat.path}">
                <span class="back-arrow">←</span>
                <span>Tüm ${cat.label}</span>
            </a>
        `;

        const breadcrumb = document.querySelector('.sovereign-breadcrumb');
        if (breadcrumb) {
            breadcrumb.insertAdjacentElement('afterend', backDiv);
        }
    }

    // ═══════════════════════════════════════════════════
    // 3. CROSS-SELL RAIL INJECTOR
    // ═══════════════════════════════════════════════════
    function injectCrossSell(parsed) {
        if (!parsed || parsed.isHome) return;

        const cat = CATEGORY_MAP[parsed.category];
        if (!cat || !cat.crossCat) return;

        // Find where to inject (before footer, after main content)
        const footer = document.getElementById('footer-container') || document.querySelector('footer');
        if (!footer) return;

        const crossLabels = {
            'massage': 'Masajları',
            'hamam':   'Hamam Ritüellerini',
            'skincare':'Cilt Bakımını'
        };

        const crossPaths = {
            'massage':  '/tr/masajlar/index.html',
            'hamam':    '/tr/hamam/index.html',
            'skincare': '/tr/cilt-bakimi/index.html'
        };

        const crossCatFilter = {
            'massage':  'massage',
            'hamam':    'hamam',
            'skincare': 'skincare'
        };

        const section = document.createElement('section');
        section.className = 'sovereign-cross-sell';
        section.innerHTML = `
            <div class="nv-container" style="max-width:1200px;padding:0 2rem">
                <div class="cs-header">
                    <div>
                        <span class="cs-kicker">Keşfetmeye Devam Edin</span>
                        <h2 class="cs-title">${crossLabels[cat.crossCat] || 'Diğer Deneyimleri'} Keşfedin</h2>
                    </div>
                    <a class="cs-link" href="${crossPaths[cat.crossCat] || '/tr/index.html'}">Tümünü Gör →</a>
                </div>
                <div class="santis-matrix-container" 
                     data-layout="grid" 
                     data-category="${crossCatFilter[cat.crossCat] || 'massage'}" 
                     data-limit="4"
                     id="cross-sell-matrix"></div>
            </div>
        `;

        footer.insertAdjacentElement('beforebegin', section);
    }

    // ═══════════════════════════════════════════════════
    // 4. FOOTER CATEGORY NAV — REMOVED (V2 Service Bar replaces it)
    // ═══════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════
    // BOOT: Wait for DOM + Navbar loaded, then inject
    // ═══════════════════════════════════════════════════
    function boot() {
        const parsed = parsePath();
        if (!parsed) return;

        // Load CSS
        if (!document.querySelector('link[href*="breadcrumb.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/assets/css/modules/breadcrumb.css';
            document.head.appendChild(link);
        }

        // Inject components
        injectBreadcrumb(parsed);
        injectBackCTA(parsed);
        injectCrossSell(parsed);
    }

    // Start: use DOMContentLoaded or immediate if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 300));
    } else {
        setTimeout(boot, 300);
    }

})();
