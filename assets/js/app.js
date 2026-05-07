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
   SANTIS – RESERVATION MODAL MASTER BLOĞU v1.3 (Runtime Controller Fix)
   ========================================================================== */
(function initSantisReservationModalController() {
  function bind() {
    const modal = document.querySelector('[data-testid="reservation-modal"]') || document.getElementById('santis-reservation-modal') || document.getElementById('bookingModal');
    const ctas = document.querySelectorAll('[data-testid="reservation-cta"], [data-booking-trigger], .btn-rezervasyon');
    const closeBtn = document.querySelector('[data-testid="reservation-close"]') || document.querySelector('.modal-close-btn');

    if (!modal || ctas.length === 0) return;

    window.openReservationModal = (eventOrServiceName) => {
      let serviceName = 'Genel Rezervasyon';
      if (eventOrServiceName && eventOrServiceName.preventDefault) {
        eventOrServiceName.preventDefault();
        eventOrServiceName.stopPropagation();
        const target = eventOrServiceName.currentTarget || eventOrServiceName.target.closest('[data-booking-trigger], .btn-rezervasyon, [data-testid="reservation-cta"]');
        if (target && target.dataset && target.dataset.service) {
           serviceName = target.dataset.service;
        }
      } else if (typeof eventOrServiceName === 'string') {
        serviceName = eventOrServiceName;
      }

      modal.hidden = false;
      modal.removeAttribute('hidden');
      modal.dataset.state = 'open';
      modal.classList.add('is-open', 'active');
      document.body.classList.add('reservation-modal-open');
      document.body.style.overflow = 'hidden';

      const today = new Date().toISOString().split('T')[0];
      const dateEl = document.getElementById('res-date') || modal.querySelector('[data-testid="reservation-date"]');
      if (dateEl) dateEl.min = today;
      const input = document.getElementById('res-service-input') || modal.querySelector('[data-testid="reservation-service"]');
      if (input) input.value = serviceName;

      const firstInput = modal.querySelector(
        '[data-testid="reservation-name"], input[name="name"], input, textarea, select'
      );

      if (firstInput && typeof firstInput.focus === 'function') {
        setTimeout(() => firstInput.focus(), 100);
      }
    };

    window.__nvCloseModal = window.closeReservationModal = () => {
      modal.dataset.state = 'idle';
      modal.classList.remove('is-open', 'active');
      modal.hidden = true;
      modal.setAttribute('hidden', '');
      document.body.classList.remove('reservation-modal-open');
      document.body.style.overflow = '';
      const form = document.getElementById('santis-reservation-form') || modal.querySelector('form');
      if (form) form.reset();
    };

    ctas.forEach((cta) => {
      if (cta.dataset.reservationBound === '1') return;
      cta.addEventListener('click', window.openReservationModal);
      cta.dataset.reservationBound = '1';
    });

    if (closeBtn && closeBtn.dataset.reservationBound !== '1') {
      closeBtn.addEventListener('click', window.__nvCloseModal);
      closeBtn.dataset.reservationBound = '1';
    }

    if (modal.dataset.escapeBound !== '1') {
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.dataset.state === 'open') {
          window.__nvCloseModal();
        }
      });
      modal.dataset.escapeBound = '1';
    }

    if (modal.dataset.backdropBound !== '1') {
      modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.classList.contains('modal-backdrop')) {
          window.__nvCloseModal();
        }
      });
      modal.dataset.backdropBound = '1';
    }

    if (window.SANTIS && window.SANTIS.debug) {
      console.info('[reservation] modal controller bound');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
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


