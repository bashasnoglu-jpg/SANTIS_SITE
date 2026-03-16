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
