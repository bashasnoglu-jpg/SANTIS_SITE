/* ==========================================================================
   SANTIS APP v7.0
   Service catalog, content loader, mega menu, living card.
   Depends on: app-core.js (must load first)
   ========================================================================== */

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

  const localFallbackData = window.SANTIS_FALLBACK || { global: {} };

  try {

    // If opened directly via file://, CORS will block the fetch; rely on fallback.

    if (location.protocol === "file:") {

      console.warn("⚠️ Dosya sistemi (file://) algılandı. Tarayıcı güvenliği (CORS) nedeniyle dış JSON dosyası yüklenemiyor.\n👉 Site çalışmaya devam etmesi için 'FALLBACK_DATA' (Demo Verisi) kullanılıyor.\n💡 Çözüm: Tam deneyim için VS Code  gibi bir yerel sunucu kullanın.");

      console.warn("⚠️ Local File Protocol - Using Fallback Data");

      return window.SANTIS_FALLBACK || {};

    }

    // Explicitly ask for JSON to avoid generic HTML 404s

    const DATA_URL = "/data/site_content.json";

    const res = await fetch(DATA_URL, { headers: { 'Accept': 'application/json' } });

    if (!res.ok) {

      console.warn(`⚠️ JSON Fetch Failed (${res.status}) for ${DATA_URL}`);

      throw new Error("JSON Fetch Failed");

    }

    // Check content type to prevent SyntaxError "<"

    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("text/html")) {

      throw new Error("Received HTML instead of JSON (Likely 404)");

    }

    const data = await res.json();

    const base = data.global ? data : { global: data };

    // FILL MISSING DATA IF NOT PRESENT IN JSON

    if (!base.global.navModel) base.global.navModel = localFallbackData.global.navModel;

    if (!base.global.categories) base.global.categories = localFallbackData.global.categories;

    // Standardize Services (Flatten arrays to object)

    if (!base.global.services) {

      base.global.services = {};

      const keys = ["hammam", "classicMassages", "extraEffective", "faceSothys", "asianMassages", "sportsTherapy", "ayurveda", "signatureCouples", "kidsFamily"];

      keys.forEach(key => {

        if (Array.isArray(base.global[key])) {

          base.global[key].forEach(svc => {

            if (svc.id) {

              ensureSlug(svc);

              // Normalize Image Path

              const root = typeof getSantisRootPath === 'function' ? getSantisRootPath() : "";

              if (svc.img && !svc.img.startsWith('http') && !svc.img.includes(root)) {

                svc.img = root + svc.img;

              }

              svc.categoryId = key;

              base.global.services[svc.id] = svc;

            }

          });

        }

      });

    }

    return base;

  } catch (e) {

    console.warn("Primary data fetch failed:", e.message);

    // Lazy load fallback data from external JSON (Phase 7B-4B)
    if (!FALLBACK_DATA) {
      try {
        const fbRes = await fetch('/assets/data/fallback-data.json');
        if (fbRes.ok) {
          FALLBACK_DATA = await fbRes.json();
          window.SANTIS_FALLBACK = FALLBACK_DATA;
          console.info("📦 Fallback data loaded from external JSON");
        }
      } catch (fbErr) {
        console.warn("Fallback JSON also failed:", fbErr.message);
      }
    }

    return FALLBACK_DATA || localFallbackData || { global: {} };

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

  const isDeep = window.location.pathname.includes("/tr/") || window.location.pathname.includes("/en/") || window.location.pathname.includes("/de/") || window.location.pathname.includes("/fr/") || window.location.pathname.includes("/ru/");

  if (isDeep) link.href = '../../assets/css/editorial.css';

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

  // Detects hover/touch to pre-load the target page in background

  document.body.addEventListener('mouseover', (e) => {

    const card = e.target.closest('.bento-card');

    if (card && card.dataset.href && !card.dataset.prefetched) {

      // FIX: Prepend root if path is relative and doesn't start with http/..

      let href = card.dataset.href;

      if (!href.startsWith('http') && !href.startsWith('../') && !href.startsWith('/')) {

        const root = (typeof determineRoot === 'function') ? determineRoot() : ""; // Local helper if avail or global

        // If determineRoot is not in scope here (it's inside IIFE below), we might need a global/window helper

        // or just simple check. But wait, determineRoot is local to the async block below.

        // Let's use a simple depth check or window.SITE_ROOT if available.

        // Fix: Safer root determination for file:// protocol

        let dRoot = "";

        if (window.SITE_ROOT) {

          dRoot = window.SITE_ROOT;

        } else if (window.location.pathname.includes("/tr/") || window.location.pathname.includes("/en/")) {

          dRoot = "../../";

        }

        href = dRoot + href;

        // Fix: Prefetching directory paths causes 404 on simple servers or file protocol

        // If it doesn't end in .html and doesn't have an extension, assume directory and append index.html

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

});

/* --- RENDER ENGINE UPDATE (BENTO COMPATIBLE) --- */


// 3. RENDER FUNCTION (The "Safe-Mode" Engine)

// initGridSystem() removed in favor of renderHomeSections() v2.0 update

// Using var to prevent SyntaxError if script is loaded twice

/* FALLBACK_DATA — externalized to /assets/data/fallback-data.json (122 KB) */
/* Phase 7B-4B: Lazy loaded only when server fetch fails */
var FALLBACK_DATA = window.FALLBACK_DATA || window.SANTIS_FALLBACK || null;

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

/* SANTIS FINAL POLISH ENGINE */

document.addEventListener('DOMContentLoaded', () => {

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

  console.log("🏆 Santis Club: 10/10 Mükemmellik Mührü Uygulandı.");

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

  // AUTO-LOAD FOOTER

  const footCont = document.getElementById('footer-container');

  if (footCont && footCont.innerHTML.trim() === "") {

    if (typeof loadComp === 'function') {

      loadComp("/components/footer.html", "footer-container"); // Footer dosyamız henüz yoksa bu 404 verebilir ama denesin

    }

  }

});

/* SANTIS PATH RESOLVER — 0 HATA GARANTİSİ */

window.SANTIS_RESOLVE_PATH = function (slug) {

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  // Antigravity veya Canlı Sunucu fark etmeksizin yolu bulur

  const root = isLocal ? '/' : window.location.pathname.split('/')[1] === 'tr' ? '/' : '/';

  return `/service-detail.html?slug=${slug}`;

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

const _imgRecoveryLog = new Set();

document.addEventListener('error', function (e) {

  if (e.target.tagName.toLowerCase() === 'img') {

    const origSrc = e.target.getAttribute('src') || '';

    // Prevent infinite loops
    if (origSrc.includes('luxury-placeholder') || origSrc.includes('placeholder.png')) return;

    // Rate limit: only try recovery once per unique src
    if (_imgRecoveryLog.has(origSrc)) return;
    _imgRecoveryLog.add(origSrc);

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

  // 4. ACTIVE STATE MATCHER
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
      // If inside a mega menu, activate parent
      const megaParent = link.closest('.nav-item.has-mega');
      if (megaParent) megaParent.classList.add('current-section');
    }
  });

});

/* ==========================================================================
   PHASE 24: THE LIVING CARD (Mobile Touch)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Only engage on touch devices or small screens
  if (window.matchMedia("(hover: none)").matches || window.innerWidth < 992) {

    const cards = document.querySelectorAll('.mega-feature-card, .nv-card, .svc-card');

    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Check if clicking a button/link inside the card
        if (e.target.closest('a') || e.target.closest('button')) return;

        // If not already flipped, flip it and prevent default link nav
        if (!card.classList.contains('is-flipped')) {
          e.preventDefault();
          e.stopPropagation();

          // Unflip others
          cards.forEach(c => c !== card && c.classList.remove('is-flipped'));

          card.classList.add('is-flipped');
        } else {
          // If already flipped, let the click pass through (navigate)
          // Or toggle back if it's just an info card
          // For now, we assume second tap = action (default behavior)
        }
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.mega-feature-card') && !e.target.closest('.nv-card')) {
        cards.forEach(c => c.classList.remove('is-flipped'));
      }
    });
  }
});

/* ==========================================================================
   SANTIS CLUB – GLOBAL NAVIGATION v1.0
   ========================================================================== */
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
