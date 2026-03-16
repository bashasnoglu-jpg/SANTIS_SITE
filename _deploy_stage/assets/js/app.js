/* ==========================================================================
   SANTIS APP v7.0 (V23 Sovereign Cache Seal)
   Service catalog, content loader, mega menu, living card.
   Depends on: app-core.js (must load first)
   ========================================================================== */

// ── SANTIS CONSOLE LOG SWITCH ───────────────────────────────────────────────
// Production'da tüm console.log/info/warn susar.
// Dev (localhost) veya ?debug=true URL parametresiyle tam log gorursunuz.
; (function () {
  const _isDebug = location.hostname === 'localhost'
    || new URLSearchParams(location.search).has('debug');

  if (window.SANTIS) window.SANTIS.debug = _isDebug;
  else window.SANTIS = { debug: _isDebug };

  // Global log() helper — log('...') seklinde kullanilabilir
  window.log = (...a) => _isDebug ? console.log(...a) : undefined;
  window.logWarn = (...a) => _isDebug ? console.warn(...a) : undefined;

  if (!_isDebug) {
    const noop = () => { };
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    // console.error AKTIF — gercek hatalar her zaman gorulur
  }
})();
// ────────────────────────────────────────────────────────────────────────────
// 🧠 SANTIS GLOBAL CORE — Tüm sistemlerin ortak veri hub'ı
window.SANTIS = window.SANTIS || {
  version: "V23",
  persona: null,        // santis-chameleon.js tarafından doldurulur
  session: {},          // santis-ghost.js tarafından doldurulur
  score: 0,             // santis-score-engine.js tarafından güncellenir
  debug: (location.hostname === 'localhost')
};

// DEV OVERRIDE (Phase 87): Backend API is currently offline. Suppress 404s.
window.SANTIS_API_ONLINE = false; // global kill-switch; set true only when API is reachable

// 🔇 PRODUCTION LOG GUARD — localhost dışında console çıktılarını sustur
if (!window.SANTIS.debug) {
  console.log = console.warn = console.info = () => { };
}

// 🛡️ THE MEMORY SEAL: V2.2.1 CACHE PURGE
// Mevcut tarayıcılardaki şişmiş .jpg ve array verilerini kalıcı temizleyerek WebP rotalarını zorla getirir.
(function initMemorySeal() {
  const SOVEREIGN_VERSION = "2.3.0"; // Versiyon değiştirildikçe tüm misafirlerin önbelleği sıfırlanır
  if (localStorage.getItem("santis_seal_version") !== SOVEREIGN_VERSION) {
    console.warn("🧹 [The Memory Seal] Stale cache detected. Purging localStorage blockades...");
    localStorage.removeItem("santis_products");
    localStorage.removeItem("santis_hotel");
    localStorage.removeItem("santis_booking_state");

    // Tüm dinamik API cachelerini temizle
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("santis_cache")) {
        localStorage.removeItem(key);
      }
    });

    // nv_neural_history'yi tamamen silmeden en güncel 5 mesaja indirge ki Rate Limit error vermesin
    try {
      const hist = JSON.parse(localStorage.getItem("nv_neural_history") || "[]");
      if (Array.isArray(hist) && hist.length > 5) {
        localStorage.setItem("nv_neural_history", JSON.stringify(hist.slice(-5)));
      }
    } catch (e) { }

    // Versiyonu güncelle
    localStorage.setItem("santis_seal_version", SOVEREIGN_VERSION);
    console.log("✅ [The Memory Seal] Cache shattered. Ready for WebP injection.");
  }
})();

/* Shared data loader — used by init() and service catalog */
function getSantisRootPath() {

  if (window.SITE_ROOT) return window.SITE_ROOT;

  const script = document.querySelector('script[src*="/assets/js/app.js"]');

  if (!script) return "";

  const src = script.getAttribute('src');

  if (src.includes('/assets/js/app.js')) {

    return src.split('/assets/js/app.js')[0];

  }

  return "";

}

async function loadContent() {
  // 🚀 FALLBACK DATA: script tag yerine dinamik fetch (250KB yük ortadan kalktı)
  if (!window.SANTIS_FALLBACK) {
    try {
      // getSantisRootPath '' döndürebilir → window.location.origin ile güvenli URL kur
      const origin = window.location.origin;
      const res = await fetch(origin + '/assets/data/fallback_data.json');
      if (res.ok) {
        window.SANTIS_FALLBACK = await res.json();
      }
    } catch (e) {
      window.SANTIS_FALLBACK = { global: {} };
    }
  }
  const localFallbackData = window.SANTIS_FALLBACK || { global: {} };

  try {
    // DYNAMIC LOAD API CLIENT (Phase 2)
    if (!window.SantisAPI) {
      console.log("🦅 Injecting Santis API Client...");
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = '/assets/js/api-client.js';
        script.onload = () => {
          console.log("🦅 API Client Loaded.");
          resolve();
        };
        script.onerror = () => {
          console.warn("⚠️ API Client Load Failed.");
          resolve();
        };
        document.head.appendChild(script);
      });
    }

    // 1. Fetch Legacy Data (which contains categories, hotels, translations)
    let base = {};
    if (location.protocol === "file:") {
      console.warn("⚠️ File protocol - Using Fallback Data");
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
      if (!res.ok) throw new Error("JSON Fetch Failed");
      const data = await res.json();
      base = data.global ? data : { global: data };
    }

    // Standardize Legacy Data structure
    if (!base.global.services) {
      base.global.services = {};
      const keys = ["hammam", "classicMassages", "extraEffective", "faceSothys", "asianMassages", "sportsTherapy", "ayurveda", "signatureCouples", "kidsFamily"];
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

    // 2. Overwrite with API Data if available (Phase 2 API Mode)
    if (window.SantisAPI && window.SANTIS_API_ONLINE) {
      console.log("🦅 API Mode: Active");
      let apiData = null;
      const currentHotel = state.hotel || localStorage.getItem("santis_hotel");

      if (currentHotel) {
        console.log(`🦅 Fetching Menu for: ${currentHotel}`);
        const menuData = await SantisAPI.getHotelMenu(currentHotel);
        if (menuData && menuData.menu) apiData = menuData.menu;
      }

      if (!apiData) {
        console.log("🦅 Fetching Master Catalog");
        apiData = await SantisAPI.getMasterCatalog();
      }

      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        window.productCatalog = apiData;
        base.global.services = {}; // Clear fallback services

        apiData.forEach(svc => {
          if (svc.id) {
            // MAP CATEGORY FOR UI ENGINE
            if (svc.category && !svc.categoryId) {
              svc.categoryId = svc.category;
            }
            base.global.services[svc.id] = svc;
          }
        });
        console.log("🦅 API Data injected into base content successfully.");
      }
    }

    // NEW (V10): Broadcast global ignition signal for AI/Concierge engines
    if (window.productCatalog && window.productCatalog.length > 0) {
      window.NV_DATA_READY = true;
      document.dispatchEvent(new Event('nv-data-ready'));
      window.dispatchEvent(new Event('nv-data-ready')); // Add window dispatch for legacy listeners
      console.log(`🌌 [Santis V10] Global Product Seed Broadcasted. Catalog Items: ${window.productCatalog.length}`);
    }

    return base;

  } catch (e) {
    console.error("Primary data fetch failed completely (Race/Network). Falling back cautiously.", e.message);

    // SAFE-LOAD ATOMIC RECOVERY
    // 🛡️ V8 OMEGA: Sessiz reload kaldırıldı — "Preserve log" açıkken çift boot algısı yaratıyordu.
    // Veri yoksa fallback ile devam et, sayfayı yenileme.
    if (Object.keys(localFallbackData).length === 0) {
      console.warn("⚠️ [Safe-Load] Veri seti boş — fallback ile devam ediliyor.");
    }

    return window.SANTIS_FALLBACK || localFallbackData;
  }
}

/* --- SANTIS BENTO CORE INJECTOR (v1.0) --- */


// Non-Destructive "Ultra Mode" Loader

document.addEventListener("DOMContentLoaded", () => {

  // Only run on Homepage

  // if (!document.querySelector('.home-editorial') && window.location.pathname !== '/' && !window.location.pathname.includes('index')) return; // DISABLED FOR GLOBAL FX

  console.log("🍱 Santis Bento Core: Initializing...");

  // 1. Inject CSS Layer

  const link = document.createElement('link');

  link.rel = 'stylesheet';

  link.href = '/assets/css/editorial.css';

  // Fix path if deep in subfolder (Robust check for file:// vs http)
  // We check for known subdirectories instead of slash count which fails on Windows local paths
  // const isDeep = ... (Disabled for Server Mode)
  // if (isDeep) link.href = '../../assets/css/editorial.css';

  document.head.appendChild(link);

  // 2. Inject Grain Layer

  const grain = document.createElement('div');

  grain.className = 'santis-grain-overlay';

  document.body.appendChild(grain);

  // 3. Feature Detection for Ultra Motion

  if (CSS.supports("animation-timeline: view()")) {

    console.log("🚀 Ultra Motion: Supported. Activating GPU animations.");

    document.documentElement.classList.add("ultra-motion");

  } else {

    console.log("⚠️ Ultra Motion: Not supported (Safari/Old). Falling back to CSS Transitions.");

  }

  // 4. INSTANT LOADER (Perceived Performance)
  // Sadece gerçek mouse destekleyen cihazlarda çalışır — mobil ağları yormaz.
  if (window.matchMedia("(hover: hover)").matches) {
    document.body.addEventListener('mouseover', (e) => {

      const card = e.target.closest('.bento-card');

      if (card && card.dataset.href && !card.dataset.prefetched) {

        let href = card.dataset.href;

        if (!href.startsWith('http') && !href.startsWith('../') && !href.startsWith('/')) {
          let dRoot = window.SITE_ROOT || '/';
          href = dRoot + href;
          if (!href.endsWith('.html') && !href.includes('.')) {
            href = href.endsWith('/') ? href + 'index.html' : href + '/index.html';
          }
        }

        console.log(`⚡ Instant Load: Prefetching ${href}`);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
        card.dataset.prefetched = "true";
      }

    }, { passive: true });
  } else {
    console.log("📱 Instant Loader: Mobil cihaz tespit edildi, prefetch devre dışı.");
  }

});

/* --- RENDER ENGINE UPDATE (BENTO COMPATIBLE) --- */


// 3. RENDER FUNCTION (The "Safe-Mode" Engine)

// initGridSystem() removed in favor of renderHomeSections() v2.0 update

// Using var to prevent SyntaxError if script is loaded twice

/* FALLBACK_DATA — externalized to /assets/data/fallback-data.json (122 KB) */
/* Phase 7B-4B: Lazy loaded only when server fetch fails */
var FALLBACK_DATA = window.FALLBACK_DATA || window.SANTIS_FALLBACK || null;

// V18 Siber Turnike: Eski HTML'de inline tanımlanan CONTENT değişkeni artık yok.
// app.js çökmemesi için boş obje ile güvenli başlatma.
var CONTENT = window.CONTENT || null;

// App State (was missing — caused ReferenceError at L292)
var state = {
  lang: "tr",
  hotel: "",
  activeCategoryId: null
};

async function init() {


  const params = new URLSearchParams(window.location.search);

  // 1. Language & Hotel from URL

  state.lang = "tr";

  if (params.has("hotel")) {

    state.hotel = params.get("hotel");

    localStorage.setItem("santis_hotel", state.hotel);

  } else {

    state.hotel = localStorage.getItem("santis_hotel") || "";

  }

  CONTENT = await loadContent();

  if (!CONTENT) return;

  // --- SERVICE CATALOG GUARD ---
  // Service logic only runs on pages with the service catalog UI
  const isServicePage = !!(document.getElementById('service-results') || document.getElementById('svcDrawer') || document.querySelector('.category-toolbar'));

  if (isServicePage) {
    // Wire service events
    document.getElementById("svcOverlay")?.addEventListener("click", closeServiceDrawer);
    document.getElementById("svcDrawerClose")?.addEventListener("click", closeServiceDrawer);
    document.getElementById("closeBookingBtn2")?.addEventListener("click", closeBookingModal);
    document.getElementById("bookingCloseBtn")?.addEventListener("click", closeBookingModal);

    // Handle Routing State (View/Section)
    const view = params.get("view");
    const section = params.get("section");
    if (view) setActiveCategoryFromRoute(view);

    renderAll();

    // Post-Render Actions
    if (section === "booking") {
      scrollToSection("booking");
      openBookingModal();
    } else if (view) {
      const target = document.getElementById(view) || document.querySelector(`[data-section="${view}"]`);
      if (target) scrollToSection(view);
      else if (state.activeCategoryId) scrollToSection("service-results");
    }
  }

  // --- HOMEPAGE GUARD ---
  if (typeof renderHomeGallery === 'function') renderHomeGallery();
  if (typeof initCinematicIntro === 'function') initCinematicIntro();
  if (typeof initScrollObserver === 'function') setTimeout(() => initScrollObserver(), 100);

  // 4. Favicon Fix (Prevent 404)

  if (!document.querySelector("link[rel*='icon']")) {

    const link = document.createElement('link');

    link.rel = 'shortcut icon';

    const rootPath = (typeof getSantisRootPath === 'function' ? getSantisRootPath() : '');
    const normalizedRoot = rootPath ? (rootPath.endsWith('/') ? rootPath : rootPath + '/') : '/';
    link.href = normalizedRoot + 'favicon.ico';

    document.head.appendChild(link);

  }

}


// Start the app

init();

/* Sticky Header Patch — DISABLED: Now handled by santis-nav.js scroll effect */
/*
document.addEventListener('DOMContentLoaded', () => {

  const h = document.getElementById('nv-header');

  if (h) {

    const onScroll = () => h.classList.toggle('shrink', window.scrollY > 50);

    window.addEventListener('scroll', onScroll, { passive: true });

    onScroll();

  }

});
*/

/* Safe Preloader Remover */

document.addEventListener('DOMContentLoaded', () => {

  setTimeout(() => {

    const p = document.getElementById('preloader');

    if (p) p.classList.add('hidden');

  }, 500);

});

/* SANTIS FINAL POLISH ENGINE (NON-BLOCKING INP PARÇALANMASI - V18.2) */

document.addEventListener('DOMContentLoaded', () => {

  const runPolishEngine = () => {
      // 1. Erişilebilirlik: İkon butonlarını isimlendir
      document.querySelectorAll('.icon-btn').forEach(btn => {
          if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Santis Action');
      });

      // 2. SEO & Güvenlik: Harici linkleri zırhla
      document.querySelectorAll('a[href^="http"]').forEach(link => {
          link.setAttribute('rel', 'noopener noreferrer');
      });

      // 3. Performans: Görsellere Layout Shift koruması ekle
      document.querySelectorAll('img').forEach(img => {
          if (!img.getAttribute('width')) img.setAttribute('width', '600');
          if (!img.getAttribute('height')) img.setAttribute('height', '400');
      });

      // 3.5. THE GLOBAL LINK PURGE (Regex Tornado)
      document.querySelectorAll('a[href]').forEach(link => {
          const href = link.getAttribute('href');
          if (href && href.startsWith('/') && !href.startsWith('//')) {
              const newHref = href.replace(/^\/(en|ru|de|fr|sr)\//, '/tr/');
              if (href !== newHref) {
                  link.setAttribute('href', newHref);
                  console.debug('⚡ [Regex Tornado] Canonical Link forced:', href, '->', newHref);
              }
          }
      });
  };

  if ('requestIdleCallback' in window) {
      requestIdleCallback(runPolishEngine, { timeout: 2000 });
  } else {
      setTimeout(runPolishEngine, 200);
  }

  console.log("🏆 Santis Club: 10/10 Mükemmellik Mührü Uygulandı.");

  // V8 OMEGA: Digital Concierge ve chatbot kaldırıldı (phantom limb cauterization)
  // Omni-Lingo language-switcher.js üzerinden çalışıyor, chatbot V9+ Neural Concierge ile gelecek

  // V8 OMEGA: Root Path Calculation
  const cleanRoot = (typeof getSantisRootPath === 'function' ? getSantisRootPath() : '').replace(/\/$/, '');

  // 5. Medya Üssü (Reklam Pixel İzleme) — BOOTLOADER TARAFINDAN YÜKLENİYOR
  // santis-pixel-engine.js artık santis-bootloader.js Shadow Clusters tarafından yönetiliyor.
  // Çift yükleme (Double Boot) engellemek için buradan kaldırıldı.

  // 6. V8 OMEGA: INTELLIGENCE & TELEMETRY CLUSTER

  // Load Scripts in strict dependency order (V8 OMEGA — Phantom Limbs Cauterized)
  // 🛡️ NOT: santis-pixel-engine.js ve santis-score-engine.js bootloader'a taşındı.
  const scriptsToLoad = [
    // ── SOVEREIGN BUS (Unified WebSocket — must load first) ──────────────────
    '/assets/js/sovereign-bus.js',                     // 🛡️ Singleton WS Otobanı
    // ── INTELLIGENCE (Ghost, Sentinel) ───────────────────────────────────────
    '/assets/js/santis-ghost.js',                       // Sovereign CRM Tracker
    '/assets/js/ghost-concierge.js?v=V21_GHOST_1',      // The Ghost Concierge (V21)
    '/assets/js/santis-sentinel.js',                    // Security Sentinel
    // ── UX & DATA ────────────────────────────────────────────────────────────
    '/assets/js/language-switcher.js',                  // TR/EN/FR Lang Switcher
  ];

  scriptsToLoad.forEach(src => {
    // 🛡️ DUPLICATE GUARD: Eğer bu script zaten sayfada varsa tekrar ekleme
    const baseSrc = src.split('?')[0]; // ?v= parametresini ignore et
    const alreadyLoaded = document.querySelector(`script[src*="${baseSrc}"]`);
    if (alreadyLoaded) {
      // console.log(`⚡ [App] Skipping already-loaded script: ${baseSrc}`);
      return;
    }
    const script = document.createElement('script');
    script.src = cleanRoot + src;
    script.defer = true;
    document.body.appendChild(script);
  });

  // AUTO-LOAD NAVBAR (DISABLED - Handled by santis-nav.js)

  /*

  const navCont = document.getElementById('navbar-container');

  if (navCont && navCont.innerHTML.trim() === "") {

    console.log("⚓ Auto-Loading Navbar...");

    if (typeof loadComp === 'function') {

      loadComp("/components/navbar.html", "navbar-container", { runScripts: true });

    }

  }

  */

  // AUTO-LOAD FOOTER (DISABLED - Handled by santis-nav.js)
  /*
  const footCont = document.getElementById('footer-container');

  if (footCont && footCont.innerHTML.trim() === "") {

    if (typeof loadComp === 'function') {

      loadComp("/components/footer.html", "footer-container"); // Footer dosyamız henüz yoksa bu 404 verebilir ama denesin

    }

  }
  */

});

/* SANTIS PATH RESOLVER — 0 HATA GARANTİSİ */

window.SANTIS_RESOLVE_PATH = function (slug) {

  // STATIC URL FIX (V5.5)
  // Logic: Try to find item in global catalog to determine section
  // Default to 'masajlar' if unknown

  let section = 'masajlar';

  // Try to find in global catalog
  const catalog = window.productCatalog || [];
  const item = catalog.find(p => p.slug === slug || p.id === slug);

  if (item) {
    const cat = (item.categoryId || item.category || '').toLowerCase();
    if (cat.includes('hammam') || cat.includes('hamam')) section = 'hamam';
    else if (cat.includes('skin') || cat.includes('cilt') || cat.includes('face') || cat.includes('sothys')) section = 'cilt-bakimi';
  }

  const lang = (window.SITE_LANG || 'tr').toLowerCase();

  return `/${lang}/${section}/${slug}.html`;

};

/* DATA GUARD — EKSİK VERİDE SİTEYİ AYAKTA TUTAR */

window.getSantisData = function () {

  try {

    const hammam = window.NV_HAMMAM || [];

    const massage = window.NV_MASSAGES || [];

    const skin = window.NV_SKINCARE || [];

    const all = [...hammam, ...massage, ...skin];

    if (all.length === 0) console.warn("Santis Warning: Data sets are empty.");

    return all;

  } catch (e) {

    console.error("Santis Critical Error: Data Bridge Failed.", e);

    return [];

  }

};

/* 0 HATA GÖRSEL YÖNETİMİ */

window._imgRecoveryLog = window._imgRecoveryLog || new Set();

document.addEventListener('error', function (e) {

  if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'img') {

    const origSrc = e.target.getAttribute('src') || '';

    // Prevent infinite loops
    if (origSrc.includes('luxury-placeholder') || origSrc.includes('placeholder.webp')) return;

    // Rate limit: only try recovery once per unique src
    if (window._imgRecoveryLog.has(origSrc)) return;
    window._imgRecoveryLog.add(origSrc);

    console.debug("Görsel kurtarılıyor:", origSrc);

    e.target.src = "/assets/img/luxury-placeholder.webp";

    e.target.style.filter = "grayscale(1) opacity(0.5)";

  }

}, true);

/* ==========================================================================
   MEGA MENU LOGIC (Phase 23)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

  // 1. DESKTOP HOVER INTENT
  const megaItems = document.querySelectorAll('.nav-item.has-mega');
  let hoverTimeout;

  megaItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      // Close others
      megaItems.forEach(i => i !== item && i.classList.remove('is-open'));
      item.classList.add('is-open');
    });

    item.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        item.classList.remove('is-open');
      }, 100); // 100ms tolerance
    });
  });

  // 2. MOBILE HAMBURGER TOGGLE
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu'); // Standard ID, ensure it exists in DOM
  const navRoot = document.getElementById('navRoot'); // Re-using desktop list for mobile logic if needed, but we have a separate overlay

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.classList.toggle('no-scroll'); // Prevent background scrolling
    });

    // Close when clicking outside or on a link
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('active') && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
    });
  }

  // 3. MOBILE ACCORDION FOR MEGA MENU (Inside Mobile Overlay or Re-purposed Desktop Nav)
  // *Strategy:* The generic 'nav-link' inside .has-mega needs to toggle the menu on mobile
  if (window.innerWidth < 992) {
    const megaLinks = document.querySelectorAll('.nav-item.has-mega > .nav-link');

    megaLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // If it's a mobile view, prevent navigation and toggle dropdown
        if (window.innerWidth < 992) {
          e.preventDefault();
          const parent = link.closest('.nav-item');

          // Close other open menus
          document.querySelectorAll('.nav-item.has-mega.active').forEach(openItem => {
            if (openItem !== parent) openItem.classList.remove('active');
          });

          parent.classList.toggle('active');
        }
      });
    });
  }

  // 4. ACTIVE STATE MATCHER (NON-BLOCKING INP OPTIMIZATION)
  if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
          const currentPath = window.location.pathname;
          document.querySelectorAll('.nav-link').forEach(link => {
              if (link.getAttribute('href') === currentPath) {
                  link.classList.add('active');
                  const megaParent = link.closest('.nav-item.has-mega');
                  if (megaParent) megaParent.classList.add('current-section');
              }
          });
      });
  } else {
      setTimeout(() => {
          const currentPath = window.location.pathname;
          document.querySelectorAll('.nav-link').forEach(link => {
              if (link.getAttribute('href') === currentPath) {
                  link.classList.add('active');
                  const megaParent = link.closest('.nav-item.has-mega');
                  if (megaParent) megaParent.classList.add('current-section');
              }
          });
      }, 100);
  }

});

/* ==========================================================================
   PHASE 24: THE LIVING CARD (Mobile Touch UX V2)
   - İlk tap → flip (arka yüzü göster)
   - Arka yüz a / button / .nv-btn → direkt navigate (flip etme)
   - Boş alana tap → tüm kartları kapat
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia("(hover: none)").matches || window.innerWidth < 992) {

    const cards = document.querySelectorAll('.mega-feature-card, .nv-card, .svc-card');

    cards.forEach(card => {
      card.addEventListener('click', (e) => {

        // Arka yüzdeki link / buton → doğrudan aksiyon, flip etme
        const isActionable = e.target.closest('a, button, .nv-btn');
        if (isActionable) return;

        // Flip mekanizması
        e.preventDefault();
        e.stopPropagation();

        const wasFlipped = card.classList.contains('is-flipped');

        // Tüm kartları kapat (sadece bir kart açık kalsın)
        cards.forEach(c => c.classList.remove('is-flipped'));

        // Toggle: zaten açıksa kapat, kapalıysa aç
        if (!wasFlipped) {
          card.classList.add('is-flipped');
        }
      });
    });

    // Boş alana dokunulunca tüm kartları sıfırla
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.mega-feature-card, .nv-card, .svc-card')) {
        cards.forEach(c => c.classList.remove('is-flipped'));
      }
    });
  }
});

/* ==========================================================================
   SANTIS CLUB – GLOBAL NAVIGATION v1.0 (DISABLED - Handled by santis-nav.js)
   ========================================================================== */
/*
(function setupGlobalNavigation() {
  // Skip if static navbar already exists (Ultra Mega Fix)
  if (document.getElementById('nv-main-nav')) {
    console.log('⚓ [Global Nav] Static navbar detected. Skipping injection.');
    return;
  }

  const navContainer = document.getElementById('navbar-container');
  if (!navContainer) return;

  // Use root-relative path to canonical component
  const navPath = '/components/navbar.html';

  fetch(navPath)
    .then(response => {
      if (!response.ok) throw new Error(`Navbar load failed: ${response.status}`);
      return response.text();
    })
    .then(html => {
      navContainer.innerHTML = html;
      window.dispatchEvent(new Event('navbar:injected'));
      console.log('⚓ Santis Club Global Nav Loaded.');
    })
    .catch(err => {
      console.error('🚨 Navbar Injection Failed:', err);
    });
})();
*/

/* ==========================================================================
   SANTIS CLUB – RESERVATION MODAL v1.1 (WhatsApp Entegre)
   ========================================================================== */
(function setupReservationModal() {
  // This master block ensures the reservation modal logic is active globally.
  // It co-exists with specific page logic like booking-wizard.js.

  window.openReservationModal = function (serviceName = 'Genel Rezervasyon') {
    // Implementation typically relies on existing modal HTML or injects it.
    // For now, we ensure the function exists to satisfy the Master Rule.
    console.log(`Open Reservation Modal for: ${serviceName}`);

    // If a real modal exists, toggle it:
    const modal = document.getElementById('reservation-modal');
    if (modal) {
      modal.classList.add('active');
      const input = document.getElementById('res-service-input');
      if (input) input.value = serviceName;
    } else {
      // Fallback to WhatsApp direct for now if modal implementation is missing
      const phone = window.NV_CONCIERGE_NUMBER || "905000000000"; // Replace with actual
      const msg = encodeURIComponent(`Merhaba, ${serviceName} hakkında bilgi almak istiyorum.`);
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
  };
})();


// ==========================================
// V24 MAGNETIC UI ENGINE (Phase 8 Injection)
// ==========================================
(function injectMagneticUI() {
    const script = document.createElement('script');
    script.src = '/assets/js/magnetic-ui.js';
    script.defer = true;
    document.body.appendChild(script);
    console.log("🦅 [V24 APEX] Magnetic UI Engine Injected.");
})();
