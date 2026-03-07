/* ==========================================================================
   SANTIS APP-CORE v1.0
   Global helpers, language config, site settings, audio toggle.
   Loaded BEFORE app.js on all pages.
   Phase 7B-2 extraction from app.js monolith.
   ========================================================================== */
console.log("🔍 TRACER V3: Disk File Loaded");

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
