/* ==========================================================================
   SANTIS APP-CORE v1.0
   Global helpers, language config, site settings, audio toggle.
   Loaded BEFORE app.js on all pages.
   Phase 7B-2 extraction from app.js monolith.
   ========================================================================== */
console.log("🔍 TRACER V3: Disk File Loaded");

/**
 * SANTIS OS - GLOBAL FETCH INTERCEPTOR (BLOK F1)
 * "Ultra Mega" Class - L1/L2 Caching, Deduplication, Stale-While-Revalidate, and Edge Routing.
 */
(function initSantisFetchBridge() {
  if (window._santisBridgeActive) return;
  window._santisBridgeActive = true;

  console.log("🌉 [SANTIS BRIDGE] Initializing Ultra-Mega Fetch Interceptor...");

  const originalFetch = window.fetch;
  const inflightRequests = new Map();

  const L2Cache = {
    get: (key) => {
      try { return JSON.parse(localStorage.getItem(`santis_cache_v2_${key}`)); }
      catch { return null; }
    },
    set: (key, data, etag) => {
      try {
        localStorage.setItem(`santis_cache_v2_${key}`, JSON.stringify({ data, etag, ts: Date.now() }));
      } catch (e) {
        console.warn("[SANTIS BRIDGE] L2 Cache Quota Exceeded");
      }
    }
  };

  function resolveEdgeUrl(originalUrl) {
    const match = originalUrl.match(/content\/services\/([a-zA-Z0-9_-]+)\.json$/);
    const legacyMatch = originalUrl.match(/data\/site_content\.json$/);

    // Target single service slugs
    if (match) {
      const slug = match[1];
      const region = window.SITE_LANG || 'tr';
      return `/api/v1/content/resolve/${slug}?region=${region}&locale=${region}`;
    }

    // Intercept the legacy global catalog fetch (for Mega Menu / Booking)
    if (legacyMatch) {
      return `/api/v1/content/resolve/index?region=${window.SITE_LANG || 'tr'}`;
    }

    return originalUrl;
  }

  async function executeSWRFetch(targetUrl, cacheKey, originalConfig) {
    const cached = L2Cache.get(cacheKey);

    let headers = new Headers(originalConfig.headers || {});
    if (cached && cached.etag) {
      headers.set('If-None-Match', cached.etag);
    }

    const fetchConfig = { ...originalConfig, headers };

    try {
      const response = await originalFetch(targetUrl, fetchConfig);

      if (response.status === 304 && cached) {
        console.debug(`⚡ [SANTIS BRIDGE] 304 Edge Match: ${cacheKey}`);
        return { data: JSON.stringify(cached.data), status: 200, headers: { 'Content-Type': 'application/json', 'X-Santis-Cache': 'HIT-304' } };
      }

      if (response.ok) {
        const text = await response.text();
        let data = null;
        try { data = JSON.parse(text); } catch (e) { }

        const etag = response.headers.get('ETag');
        if (etag && data) L2Cache.set(cacheKey, data, etag);
        if (data) window.dispatchEvent(new CustomEvent('santis:content-updated', { detail: { key: cacheKey, data } }));

        const responseHeaders = {};
        response.headers.forEach((val, key) => responseHeaders[key] = val);
        return { data: text, status: response.status, headers: responseHeaders };
      }

      if (cached) {
        console.warn(`⚠️ [SANTIS BRIDGE] Edge Error ${response.status}. Serving purely from L2 Stale Cache.`);
        return { data: JSON.stringify(cached.data), status: 200, headers: { 'Content-Type': 'application/json' } };
      }

      const errText = await response.text();
      return { data: errText, status: response.status, headers: {} };
    } catch (error) {
      if (cached) {
        console.error(`🚨 [SANTIS BRIDGE] Network Failure. Serving L2 Cache Offline.`, error);
        return { data: JSON.stringify(cached.data), status: 200, headers: { 'Content-Type': 'application/json' } };
      }
      throw error;
    }
  }

  window.fetch = async function (resource, config = {}) {
    let urlStr = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : String(resource));
    const targetUrl = resolveEdgeUrl(urlStr);

    if (targetUrl.includes('/api/v1/content/resolve') || targetUrl.includes('.json')) {
      let cacheKey = 'global';
      const slugMatch = targetUrl.match(/\/resolve\/([a-zA-Z0-9_-]+)/);
      if (slugMatch) {
        cacheKey = slugMatch[1];
      } else {
        cacheKey = btoa(targetUrl).substring(0, 16);
      }

      if (inflightRequests.has(cacheKey)) {
        return inflightRequests.get(cacheKey).then(resObj => new Response(resObj.data, { status: resObj.status, headers: resObj.headers }));
      }

      const requestPromise = executeSWRFetch(targetUrl, cacheKey, config).then(resObj => {
        return resObj; // Keep the object in the promise chain
      }).finally(() => {
        setTimeout(() => inflightRequests.delete(cacheKey), 50);
      });

      inflightRequests.set(cacheKey, requestPromise);
      return requestPromise.then(resObj => new Response(resObj.data, { status: resObj.status, headers: resObj.headers }));
    }

    return originalFetch(resource, config);
  };
})();

/**
 * SANTIS OS - VANILLA JS STATE MANAGER (BLOK F2)
 * Central immutable store for the Headless Reactivity engine.
 */
(function initSantisStore() {
  if (window.SantisStore) return;

  console.log("🏪 [SANTIS STORE] Initializing Central State Manager...");

  const state = new Map();
  const listeners = new Map();

  window.SantisStore = {
    get: function (key) {
      const val = state.get(key);
      return val ? JSON.parse(JSON.stringify(val)) : null;
    },
    getStateTree: function () {
      return Object.fromEntries(state);
    },
    set: function (key, data) {
      state.set(key, data);
      const subs = listeners.get(key);
      if (subs && subs.length > 0) {
        console.debug(`🏪 [SANTIS STORE] Emitting update for '${key}' to ${subs.length} components.`);
        const safeData = JSON.parse(JSON.stringify(data));
        subs.forEach(cb => {
          try { cb(safeData); } catch (e) { console.error("Subscriber Error:", e); }
        });
      }
      window.dispatchEvent(new CustomEvent('santis:store-updated', { detail: { key, data } }));
    },
    subscribe: function (key, callback) {
      if (!listeners.has(key)) listeners.set(key, []);
      listeners.get(key).push(callback);

      if (state.has(key)) callback(this.get(key));

      return () => {
        const arr = listeners.get(key);
        if (arr) {
          const idx = arr.indexOf(callback);
          if (idx > -1) arr.splice(idx, 1);
        }
      };
    }
  };

  window.addEventListener('santis:content-updated', (e) => {
    const { key, data } = e.detail;
    console.debug(`🏪 [SANTIS STORE] Intercepted network update from Bridge -> Key: ${key}`);
    window.SantisStore.set(key, data);
  });
})();

/**
 * SANTIS OS - DOM HYDRATION ENGINE (BLOK F3)
 * Scans the DOM for `data-santis-bind` attributes and links them to the Reactive Store.
 */
(function initSantisHydrator() {
  if (window.SantisHydrator) return;

  console.log("💧 [SANTIS HYDRATOR] Initializing Headless DOM Reactivity...");

  function getNestedProperty(obj, path) {
    return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined) ? prev[curr] : null, obj);
  }

  function hydrateNode(node, value) {
    if (value === null || value === undefined) return;

    const tag = node.tagName.toLowerCase();

    if (tag === 'img') {
      node.src = value;
      node.onload = () => node.classList.remove('santis-skeleton');
      return;
    }

    const attrTarget = node.getAttribute('data-santis-attr');
    if (attrTarget) {
      node.setAttribute(attrTarget, value);
      return;
    }

    if (typeof value === 'string' && (value.includes('<') || value.includes('&'))) {
      node.innerHTML = value;
    } else {
      node.textContent = value;
    }

    node.classList.remove('santis-skeleton');
    node.classList.add('santis-hydrated');
  }

  window.SantisHydrator = {
    scan: function (root = document) {
      const bindNodes = root.querySelectorAll('[data-santis-bind]');

      if (bindNodes.length === 0) return;
      console.debug(`💧 [SANTIS HYDRATOR] Found ${bindNodes.length} reactive nodes. Securing bindings...`);

      const bindingsMap = {};

      bindNodes.forEach(node => {
        const bindingDef = node.getAttribute('data-santis-bind');
        if (!bindingDef.includes(':')) return;

        const [storeKey, propertyPath] = bindingDef.split(':');
        if (!bindingsMap[storeKey]) bindingsMap[storeKey] = [];
        bindingsMap[storeKey].push({ node, propertyPath });
      });

      Object.keys(bindingsMap).forEach(storeKey => {
        window.SantisStore.subscribe(storeKey, (data) => {
          const targets = bindingsMap[storeKey];
          targets.forEach(target => {
            const val = getNestedProperty(data, target.propertyPath);
            hydrateNode(target.node, val);
          });
        });

        if (!window.SantisStore.get(storeKey)) {
          // Preload via Bridge
          const tempUrl = `/assets/data/content/services/${storeKey}.json`;
          fetch(tempUrl).catch(() => { });
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SantisHydrator.scan());
  } else {
    window.SantisHydrator.scan();
  }

  window.addEventListener('santis:dom-mutated', () => window.SantisHydrator.scan());
})();

// ===== Santis: TR-only mode (Strict) =====

if (typeof SITE_LANG === 'undefined') {

  var SITE_LANG = "tr";

  window.SITE_LANG = SITE_LANG;

}

// URL'deki ?lang=... parametresini temizle

(function normalizeLangParam() {

  try {

    const url = new URL(window.location.href);

    if (url.searchParams.has("lang")) {

      url.searchParams.delete("lang");

      history.replaceState({}, "", url.toString());

    }

  } catch (_) { }

})();

// Helper to safely get Turkish text (Force TR)

function trText(v) {

  if (!v) return "";

  if (typeof v === "string") return v;

  return v.tr || v.en || ""; // Fallback logic

}

window.trText = trText;

// dışarı tıkla kapat

document.addEventListener("mousedown", (e) => {

  const modal = document.getElementById("bookingModal");

  if (modal && !modal.hidden && e.target === modal) closeBookingModal();

});

// --- ADMIN PANEL ENTEGRASYONU (SETTINGS) ---

function applySiteSettings() {

  if (typeof SITE_SETTINGS === 'undefined') return;

  // 1. WhatsApp Numarası Güncelle

  if (SITE_SETTINGS.contact && SITE_SETTINGS.contact.whatsapp) {

    window.SANTIS_CONCIERGE_NUMBER = SITE_SETTINGS.contact.whatsapp;

    // Sitedeki tüm WhatsApp linklerini bul ve güncelle

    document.querySelectorAll('a[href*="wa.me"]').forEach(el => {

      // Eski numarayı temizle ve yenisini koy

      let href = el.href;

      href = href.replace(/wa\.me\/[0-9]+/, `wa.me/${SITE_SETTINGS.contact.whatsapp}`);

      el.href = href;

    });

  }

  // 2. Sosyal Medya Linkleri

  if (SITE_SETTINGS.social) {

    // İlerde footer/navbar ID'leri eklendiğinde burası aktifleşecek

    // console.log("Sosyal medya ayarları yüklendi:", SITE_SETTINGS.social);

  }

}

document.addEventListener('DOMContentLoaded', applySiteSettings);

// -------------------------------------------

var state = window.state || {

  lang: "tr",

  hotel: "",

  selectedServiceId: "",

  hotelFilter: "all",

  hotelSearch: "",

  activeCategoryId: "",

  serviceSearch: "",

  serviceSort: "relevance",

  onlyToday: false,

  durationQuick: "all",

  svcOpen: false,

  categoryView: "all"

};

window.state = state;

// Prevent double execution check - MOVED TO WINDOW

if (window.__APP_JS_LOADED) {

  console.warn("App.js already loaded - skipping re-initialization");

} else {

  window.__APP_JS_LOADED = true;

}

var CONTENT = window.CONTENT || null;

// Helper to safely get Turkish text...

// (trText is already defined above, removing duplicate)

// PHASE 1 INTEGRATION: Load Settings from Admin Panel

// (applySiteSettings is already defined above, removing duplicate)

/* 

 * SANTIS CLUB CORE v5.1

 * (Includes Phase 17 Audio Logic)

 */

document.addEventListener('DOMContentLoaded', () => {

  // AUDIO TOGGLE LOGIC

  const muteBtn = document.getElementById('site-mute-toggle');

  if (muteBtn) {

    let isMuted = localStorage.getItem('santis_muted') === 'true';

    updateMuteIcon(isMuted);

    muteBtn.addEventListener('click', () => {

      isMuted = !isMuted;

      localStorage.setItem('santis_muted', isMuted);

      updateMuteIcon(isMuted);

      // Mute all audio elements

      document.querySelectorAll('audio, video').forEach(el => el.muted = isMuted);

    });

  }

  function updateMuteIcon(muted) {

    if (!muteBtn) return;

    muteBtn.innerHTML = muted ? '🔇' : '🔊';

    muteBtn.style.opacity = muted ? '0.5' : '1';

  }

});
