/**

 * SANTIS CORE LOADER v2.1

 * - Component Loading (Navbar/Footer)

 * - Cache Busting

 * - Retry Logic

 * - Preloader Management

 */



// Guard: Prevent duplicate loading crash
if (window.__NV_LOADER_LOADED) { /* already loaded, skip */ } else {
    window.__NV_LOADER_LOADED = true;

    // Global state for retries
    const __NV_LOADCOMP_RETRY = new Map();

    // Generate localized fallback navbar
    function _buildFallbackNavbar() {
        const R = window.SantisRouter;
        const l = (path) => R ? R.localize(path) : path;
        return `
<nav id="nv-main-nav" class="navbar" style="z-index: 999999;">
    <div class="navbar-container">
        <a href="/index.html" class="logo">
            <div class="logo-symbol">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </div>
            <div class="logo-text"><span class="brand-name">SANTIS</span><span class="brand-sub">CLUB</span></div>
        </a>
        <div id="navRoot" class="nav-links nav-center">
             <div class="nav-item"><a class="nav-link" href="/index.html">ANA SAYFA</a></div>
             <div class="nav-item"><a class="nav-link" href="${l('/tr/hamam/index.html')}">HAMAM</a></div>
             <div class="nav-item"><a class="nav-link" href="${l('/tr/masajlar/index.html')}">MASAJLAR</a></div>
             <div class="nav-item"><a class="nav-link" href="${l('/tr/cilt-bakimi/index.html')}">CİLT BAKIMI</a></div>
             <div class="nav-item"><a class="nav-link" href="${l('/tr/urunler/index.html')}">ÜRÜNLER</a></div>
             <div class="nav-item"><a class="nav-link" href="${l('/tr/galeri/index.html')}">GALERİ</a></div>
        </div>
        <div class="nav-actions">
            <a href="https://wa.me/905348350169" target="_blank" rel="noopener noreferrer" class="nv-btn nv-btn-sm nv-btn-primary mobile-hide">REZERVASYON</a>
            <div class="hamburger-btn" id="hamburger"><span class="bar"></span><span class="bar"></span></div>
        </div>
    </div>
</nav>
<div class="mobile-menu-overlay" id="mobileMenu">
    <div class="mobile-menu-content">
        <a href="/index.html" class="mobile-link">ANA SAYFA</a>
        <a href="${l('/tr/hamam/index.html')}" class="mobile-link">HAMAM</a>
        <a href="${l('/tr/masajlar/index.html')}" class="mobile-link">MASAJLAR</a>
        <a href="${l('/tr/urunler/index.html')}" class="mobile-link">ÜRÜNLER</a>
        <a href="https://wa.me/905348350169" target="_blank" rel="noopener noreferrer" class="nv-btn nv-btn-primary mt-4">REZERVASYON</a>
    </div>
</div>
`;
    }
    let FALLBACK_NAVBAR_HTML = '';
    try { FALLBACK_NAVBAR_HTML = _buildFallbackNavbar(); } catch (e) { console.warn('[Loader] Navbar fallback build error', e); }



    const FALLBACK_FOOTER_HTML = `

<footer class="footer" style="padding:40px 20px; background:#0b0d11; text-align:center; color:#666;">

    <p>&copy; 2026 Santis Club. Quiet Luxury.</p>

</footer>

`;



    // Helper for cache busting (String based to avoid stripping local subfolders like 192.168.x.x/SANTIS_SITE)
    function withCacheBust(url, enabled = true) {
        if (!enabled) return url;
        try {
            const separator = url.includes('?') ? '&' : '?';
            return url + separator + "v=" + Date.now().toString();
        } catch (e) { return url; }
    }



    /**
    
     * Safer component loader with Retry Map & setTimeout (Stack Safe)
    
     * @param {string} url - component html url (navbar.html, footer.html, vb.)
    
     * @param {string|HTMLElement} target - selector veya element
    
     * @param {object} opts
    
     */

    async function loadComp(url, target, opts = {}) {

        // 1. Resolve Target

        let targetEl = null;

        let targetId = "";



        if (typeof target === "string") {

            targetId = target;

            targetEl = document.getElementById(target) || document.querySelector(target);

        } else if (target instanceof HTMLElement) {

            targetEl = target;

            targetId = target.id || "unknown-target";

        }



        // 2. Options & Legacy Callback Support

        let options = opts;

        let callback = null;



        if (typeof opts === 'function') {

            callback = opts;

            options = {};

        } else if (opts && typeof opts.onSuccess === 'function') {

            callback = opts.onSuccess;

        }



        const maxRetry = Number.isFinite(options.retry) ? options.retry : 3;

        const retryDelay = 250;

        const { cacheBust = true, runScripts = true } = options;



        if (!url || !targetEl) {

            console.warn("[loadComp] invalid args or target not found:", { url, target: targetId });

            return;

        }



        // 2.1 Protocol Check (CORS Guard with FALLBACKS) - DISABLED FOR DEBUGGING
        /*
        if (window.location.protocol === 'file:') {
            console.warn(`[loadComp] CORS Warning: '${url}' requested via file:// protocol. Attempting fallback...`);
    
            // A. Check for Hardcoded Fallback (The "Safety Net")
            if (url.includes("navbar.html")) {
                targetEl.innerHTML = FALLBACK_NAVBAR_HTML;
                // Auto-init interactions
                if (typeof initNavbarInteractions === 'function') initNavbarInteractions();
                else if (typeof window.NV_INIT_NAVBAR === 'function') window.NV_INIT_NAVBAR();
                return;
            }
    
            if (url.includes("footer.html")) {
                targetEl.innerHTML = FALLBACK_FOOTER_HTML;
                return;
            }
    
            // B. If no fallback, show error
            if (targetEl && targetEl.innerHTML.trim().length > 10) {
                return; // Keep existing
            }
    
            targetEl.innerHTML = `
                <div style="padding:10px; border-bottom:1px solid #333; color:#d4af37; font-size:11px; text-align:center;">
                    ⚠️ <strong>Server Required</strong>: For full features, run 'BASLAT.bat'. (Viewing in Basic Mode)
                </div>`;
            return;
        }
        */





        // 3. Retry Key

        const key = `${url}__${targetId}`;

        const attempt = (__NV_LOADCOMP_RETRY.get(key) ?? 0);



        try {

            const fetchUrl = withCacheBust(url, cacheBust);

            const res = await fetch(fetchUrl, { cache: "no-store" });

            if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);



            const htmlText = await res.text();



            // Success

            targetEl.innerHTML = htmlText;

            __NV_LOADCOMP_RETRY.delete(key); // Reset retry count on success



            // Run Scripts if needed

            if (runScripts) {

                const scripts = Array.from(targetEl.querySelectorAll("script"));

                for (const s of scripts) {

                    const newScript = document.createElement("script");

                    Array.from(s.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));

                    newScript.appendChild(document.createTextNode(s.innerHTML)); // Inline

                    if (s.src) newScript.src = s.src; // External

                    s.parentNode.replaceChild(newScript, s);

                }

                // Auto-init Navbar

                if (url.includes("navbar.html") && typeof window.NV_INIT_NAVBAR === "function") {

                    window.NV_INIT_NAVBAR();

                }

            }

            // --- EXECUTE CALLBACK (Patch for V2 Compatibility) ---

            if (callback && typeof callback === 'function') {

                callback();

            }



        } catch (err) {

            if (attempt >= maxRetry) {

                console.error(`[loadComp] FAILED after ${attempt} retries:`, url, err);

                return; // STOP

            }



            __NV_LOADCOMP_RETRY.set(key, attempt + 1);

            console.warn(`[loadComp] retry ${attempt + 1}/${maxRetry} -> ${url}`);



            // Recursive call via setTimeout (Stack Safe)

            setTimeout(() => loadComp(url, target, opts), retryDelay);

        }

    }



    // Expose globally

    window.loadComp = loadComp;



    // END IIFE


    // --- INJECT SLOT SKELETON CSS (CLS Armor — MUST run before Phantom Injector) ---
    // Inline <style> olarak enjekte ediliyor: stylesheet yüklenmesini beklemez,
    // Phantom Injector'ın 5 slotu override etmesinden önce alan rezerve edilir.
    (function () {
        if (document.getElementById('nv-skeleton-armor')) return; // Idempotent

        const style = document.createElement('style');
        style.id = 'nv-skeleton-armor';
        style.textContent = `
            /* SANTIS CLS ARMOR — Slot Skeleton Pre-Reserve */

            /* Navbar rezervasyonu: santis-nav.js async fetch ederken alan sabit kalır */
            #navbar-container {
                min-height: 90px;       /* Desktop navbar yüksekliği */
                width: 100%;
                display: block;
                background-color: transparent;
            }
            @media (max-width: 991px) {
                #navbar-container { min-height: 70px; }
            }
            
            /* Navbar CLS Protection for dynamic Lang Switcher */
            .nav-actions {
                min-width: 180px; /* Reserves space for reserve button + lang switcher */
                display: flex;
                justify-content: flex-end;
            }

            #footer-container {
                min-height: 120px;      /* Footer rezervasyonu */
                display: block;
            }
            
            /* Grid CLS Armor - Prevents footer/sections below from shifting down when 64 cards mount */
            .nv-product-grid {
                min-height: 100vh;
            }

            [data-santis-slot] {
                display: block;
                overflow: hidden;
                position: relative;
                background-color: #0f0e0c;
                opacity: 0.85;
            }
            /* Hero slot: 16:9 */
            [data-santis-slot="hero-main"]:not(.nv-hero-campaign):not(.cinematic-hero),
            [data-santis-slot^="hero"]:not(.nv-hero-campaign):not(.cinematic-hero) {
                aspect-ratio: 16 / 9;
                min-height: 260px;
            }
            /* Kart slotları: 4:3 */
            [data-santis-slot^="card-"] {
                aspect-ratio: 4 / 3;
                min-height: 180px;
            }
            /* Shimmer animasyonu */
            [data-santis-slot]::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    90deg,
                    transparent 20%,
                    rgba(212,175,55,0.06) 50%,
                    transparent 80%
                );
                background-size: 200% 100%;
                animation: nv-shimmer 1.8s infinite linear;
            }
            @keyframes nv-shimmer {
                from { background-position: 200% 0; }
                to   { background-position: -200% 0; }
            }
            /* Yükleme bitti — TÜM skeleton kısıtlamaları serbest kalır */
            [data-santis-slot].nv-asset-loaded {
                opacity: 1;
                background-color: transparent;
                aspect-ratio: unset;   /* ← Chrome için kritik: 4/3 kilidini kaldırır */
                min-height: unset;
            }
            [data-santis-slot].nv-asset-loaded::before {
                display: none;
            }
        `;
        document.head.appendChild(style);
    })();

    // --- CINEMATIC CSS ---
    // ✅ CLS FIX: Bu CSS artık loader.js'den inject edilmez.
    // Runtime <link> inject = tüm sayfa yeniden layout = CLS 0.3+
    // preloader-cinema.css her sayfanın <head>'inde statik <link> olarak bulunmalı.
    console.log("🎬 [Loader] Cinematic CSS: loaded statically from <head>.");

    // Fail-safe Preloader Removal (Cinematic V1)
    (function () {
        const hidePreloader = () => {
            const p = document.getElementById('preloader');
            if (!p) {
                document.body.style.cursor = 'auto';
                return;
            }

            // STEP 1: Logo Reveal (Ensure it's visible)
            p.classList.add('logo-reveal');

            // STEP 2: Curtain Up (after short delay)
            setTimeout(() => {
                p.classList.add('cinema-exit');

                // Unlock body scroll if locked?
                document.body.style.cursor = 'auto';

                // Clean up DOM after animation
                setTimeout(() => {
                    p.style.display = 'none';
                    console.log("🌊 [Loader] Cinematic entrance complete.");

                    // Trigger Hero Animation if available
                    const heroTitle = document.querySelector('.nv-hero-title-dynamic');
                    if (heroTitle) heroTitle.classList.add('animate-in');

                }, 1200); // Matches CSS transition duration

            }, 800); // Wait for logo to be seen
        };

        // Attempt standard DomContentLoaded
        window.addEventListener('DOMContentLoaded', () => {
            const p = document.getElementById('preloader');
            if (p) {
                p.classList.add('logo-reveal'); // Start logo immediately

                // MONK TONE: Random Loading Hints
                const hints = [
                    "Nefes al...",
                    "Zaman yavaşlıyor...",
                    "Sessizlik yükleniyor...",
                    "Dış dünyayı geride bırakın...",
                    "An'a odaklanın..."
                ];
                const randomHint = hints[Math.floor(Math.random() * hints.length)];

                // Create or update hint element
                let hintEl = p.querySelector('.nv-loader-hint');
                if (!hintEl) {
                    hintEl = document.createElement('div');
                    hintEl.className = 'nv-loader-hint fade-in';
                    hintEl.style.cssText = "margin-top:20px; font-size:12px; letter-spacing:3px; opacity:0; transition:opacity 1s ease; color:#888; text-transform:uppercase;";
                    const logo = p.querySelector('.preloader-logo') || p.firstElementChild;
                    if (logo) logo.parentNode.insertBefore(hintEl, logo.nextSibling);
                }
                hintEl.innerText = randomHint;
                setTimeout(() => hintEl.style.opacity = '0.7', 200);
            }

            // Wait a bit for assets, then hide
            setTimeout(hidePreloader, 1800); // Extended slightly for reading time
        });

        // Backup: window.load
        window.addEventListener('load', () => setTimeout(hidePreloader, 2000));
    })();

    // Expose globally
    window.loadComp = loadComp;

    // --- SERVICE WORKER CLEANUP (Force Unregister to fix 404s) ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    console.log('🛑 [Loader] Unregistering Service Worker:', registration.scope);
                    registration.unregister();
                }
                if (registrations.length > 0) {
                    console.log('✅ [Loader] Zombie Service Workers Nuked. Reloading page...');
                    // Optional: Force reload if we killed something
                    // location.reload(); 
                }
            });
        });
    }

} // End of idempotent guard

