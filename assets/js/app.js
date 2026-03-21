/* ==========================================================================
   SANTIS APP — Global Config Stub v8.0
   (The Final Kill — 16 Mart 2026)

   Bu dosya bir zamanlar 1047 satırdı. Bugün tarihin sayfasına gömülüyor.
   Tüm sorumluluklar Santis OS v3 Kernel'e (santis-core.js) devredildi:

     • UI Efektleri     → assets/js/modules/interaction-engine.js
     • Data & Routing   → assets/js/modules/page-router.js
     • Neural Runtime   → assets/js/workers/santis-ai.worker.js
     • Kernel Boot      → assets/js/core/santis-core.js

   RIP app.js (God Object) — 2024 → 2026
   "Strangler Fig" deseni tamamlandı. 🪦
   ========================================================================== */

// ── 1. CONSOLE LOG SWITCH ────────────────────────────────────────────────────
// Production'da tüm console.log/info/warn susar.
// Dev (localhost) veya ?debug=true parametresiyle tam log görürsünüz.
;(function () {
  const _isDebug = location.hostname === 'localhost'
    || new URLSearchParams(location.search).has('debug');

  if (window.SANTIS) window.SANTIS.debug = _isDebug;
  else window.SANTIS = { debug: _isDebug };

  window.log     = (...a) => _isDebug ? console.log(...a)  : undefined;
  window.logWarn = (...a) => _isDebug ? console.warn(...a) : undefined;

  if (!_isDebug) {
    const noop = () => {};
    console.log  = noop;
    console.info = noop;
    console.warn = noop;
    // console.error AKTIF — gerçek hatalar her zaman görülür
  }
})();

// ── 2. SANTIS GLOBAL NAMESPACE ───────────────────────────────────────────────
window.SANTIS = window.SANTIS || {
  version: 'V8-STUB',
  persona: null,
  session: {},
  score:   0,
  debug:   (location.hostname === 'localhost')
};

// API kill-switch — true yapılana kadar backend istekleri susturulur
window.SANTIS_API_ONLINE = false;

// ── 3. THE MEMORY SEAL — Cache Purge v2.3.0 ─────────────────────────────────
// Versiyon değiştirildikçe tüm tarayıcılardaki eski cache'ler sıfırlanır.
;(function initMemorySeal() {
  const SOVEREIGN_VERSION = '2.3.0';
  if (localStorage.getItem('santis_seal_version') === SOVEREIGN_VERSION) return;
  localStorage.removeItem('santis_products');
  localStorage.removeItem('santis_hotel');
  localStorage.removeItem('santis_booking_state');
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('santis_cache')) localStorage.removeItem(key);
  });
  try {
    const hist = JSON.parse(localStorage.getItem('nv_neural_history') || '[]');
    if (Array.isArray(hist) && hist.length > 5) {
      localStorage.setItem('nv_neural_history', JSON.stringify(hist.slice(-5)));
    }
  } catch (_) {}
  localStorage.setItem('santis_seal_version', SOVEREIGN_VERSION);
  console.warn('🧹 [Memory Seal v2.3.0] Cache purge complete.');
})();

/* ==========================================================================
   SANTIS – GLOBAL NAVIGATION v1.0
   ========================================================================== */
(function setupGlobalNavigation() {
  const header = document.getElementById('santis-header') || document.getElementById('site-header');
  if (!header) return;

  const lang = document.documentElement.lang || 'tr';
  const intlLangs = ['en', 'de', 'fr', 'ru'];
  const isIntl = intlLangs.includes(lang) || intlLangs.some(l => window.location.pathname.includes('/' + l + '/'));
  const navFile = isIntl ? "/components/navbar-en.html" : "/components/navbar.html";

  // Sadece eğer daha önce statik olarak yüklenmemişse fetch yap
  const mainNav = document.getElementById('santis-main-nav');
  if (mainNav && mainNav.innerHTML.trim() === '') {
      fetch(navFile)
        .then(r => r.text())
        .then(html => {
            mainNav.innerHTML = html;
            header.classList.add('visible'); // Add visible class to show navbar
            console.log('[SANTIS] Global Navigation v1.0 Loaded via app.js');
            // Execute init interactions if they exist from legacy santis-nav.js
            if(typeof window.initNavbarInteractions === 'function'){
                window.initNavbarInteractions();
            }
        })
        .catch(err => console.error('[SANTIS] Navigation Fetch Error:', err));
  } else {
      console.log('[SANTIS] Navigation v1.0 already exists in DOM or static.');
  }

  // Footer Injection (Consolidated from santis-nav.js)
  const footerContainer = document.getElementById("footer-container");
  if (footerContainer && footerContainer.innerHTML.trim() === '') {
      fetch('/components/footer.html')
        .then(r => r.text())
        .then(html => {
            footerContainer.innerHTML = html;
            console.log('[SANTIS] Footer Loaded via app.js');
        })
        .catch(err => console.warn('[SANTIS] Footer API timeout or error:', err));
  }
})();

/* ==========================================================================
   SANTIS – RESERVATION MODAL MASTER BLOĞU v1.1 (WhatsApp Entegre)
   ========================================================================== */
(function setupReservationModal() {
  window.openReservationModal = function (serviceName = 'Genel Rezervasyon') {
    console.log(`[SANTIS] Open Reservation Modal triggered for: ${serviceName}`);
    const modal = document.getElementById('santis-reservation-modal') || document.getElementById('bookingModal');
    if (modal) {
      modal.classList.add('active');
      const input = document.getElementById('res-service-input');
      if (input) input.value = serviceName;
    } else {
      // Fallback: WhatsApp direct redirect
      const phone = window.SANTIS_CONCIERGE_NUMBER || "905348350169";
      const msg = encodeURIComponent(`Merhaba, ${serviceName} hakkında bilgi almak istiyorum.`);
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
  };

  // Ekranda "rezervasyon" veya "book" butonu olan click'leri dinle
  document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-booking-trigger], .btn-rezervasyon');
      if (target) {
          e.preventDefault();
          const service = target.dataset.service || 'Genel Rezervasyon';
          window.openReservationModal(service);
      }
  });
  console.log('[SANTIS] Reservation Modal v1.1 Active & Bound.');
})();

/* ==========================================================================
   SANTIS – SHADOW WORKER AUTO-INVALIDATE
   ========================================================================== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/santis-sw.js").then(reg => {
    // yeni versiyon geldiğinde otomatik reload
    reg.onupdatefound = () => {
      const newWorker = reg.installing;
      newWorker.onstatechange = () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.log("⚡ Yeni versiyon bulundu, sayfayı yenileyiniz.");
          // window.location.reload(); // Sonsuz döngüye sebep olmaması için kapatıldı
        }
      };
    };
  });
}


