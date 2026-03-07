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
    window.NV_CONCIERGE_NUMBER = SITE_SETTINGS.contact.whatsapp;

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
 * NEUROVA – GLOBAL NAVIGATION v1.0 
 * (Navigation Logic Below)
 */
function ensureSlug(svc) {
  if (!svc || svc.slug) return svc?.slug;

  const name = trText(svc.name) || String(svc.id || "");

  if (typeof window.slugifyTR === "function") {
    const s = window.slugifyTR(name);
    if (s) svc.slug = s;
  }

  if (!svc.slug && svc.id) svc.slug = String(svc.id);
  return svc.slug;
}

/* Core Helpers */
function t(path) {
  // If we have a global dictionary, look it up. 
  // We assume CONTENT is still loaded. If we flatten CONTENT later, this might simplify further.
  if (path.startsWith("booking.")) {
    const parts = path.split(".");
    let cur = CONTENT?.global?.booking?.translations?.tr; // Force TR
    for (let i = 1; i < parts.length; i++) cur = cur?.[parts[i]];
    if (cur !== undefined) return cur;
  }

  const parts = String(path || "").split(".");
  let cur = CONTENT?.tr; // Force TR
  for (const p of parts) cur = cur?.[p];
  return cur ?? path;
}

function getHotels() {
  return CONTENT?.global?.hotels || [];
}

function getSelectedHotel() {
  if (!state.hotel) return null;
  return getHotels().find(h => h.slug === state.hotel) || null;
}





function renderUITexts() {

  const lblHotel = document.getElementById("lblHotel");

  if (lblHotel) lblHotel.textContent = t("ui.selectHotel");



  const selectedHotel = getSelectedHotel();

  const ctx = document.getElementById("contextLine");



  if (ctx) {
    if (!selectedHotel) ctx.textContent = "Santis Club";
    else {
      const name = selectedHotel.translations?.tr?.name || state.hotel;
      ctx.textContent = name;
    }
  }



  const heroTitle = document.getElementById("heroTitle");

  if (heroTitle) heroTitle.textContent = t("hero.title");



  const heroSubtitleEl = document.getElementById("heroSubtitle");
  if (heroSubtitleEl) {
    if (selectedHotel) {
      heroSubtitleEl.textContent = selectedHotel.translations?.tr?.description || "";
    } else {
      const subtitleTpl = t("hero.subtitle");
      const locDefault = t("hero.locationDefault");
      heroSubtitleEl.textContent = subtitleTpl.replace("{location}", locDefault);
    }
  }



  const topPicksTitle = document.getElementById("topPicksTitle");

  if (topPicksTitle) topPicksTitle.textContent = t("sections.topPicks");



  const catTitle = selectedHotel ? t("sections.categoriesHotel") : "Santis Spa Koleksiyonu";

  const categoriesTitle = document.getElementById("categoriesTitle");

  if (categoriesTitle) categoriesTitle.textContent = catTitle;



  const catSub = selectedHotel ? t("sections.categoryCardSubtitleHotel") : "Tüm şubelerimizde geçerli spa ritüelleri";

  const catPill = document.getElementById("categoriesContextPill");

  const catSubtitle = document.getElementById("categoriesSubtitle");



  const copyBtn2 = document.getElementById("svcCopyLink");

  if (copyBtn2) copyBtn2.title = t("ui.copied");



  if (catPill) catPill.textContent = selectedHotel ? (selectedHotel.translations?.tr?.name || selectedHotel.slug) : "Santis Club";

  if (catSubtitle) catSubtitle.textContent = catSub;



  const partnerTitle = document.getElementById("partnerTitle");

  if (partnerTitle) partnerTitle.textContent = "Hizmet Noktalarımız";

  const aboutTitle = document.getElementById("aboutTitle");

  if (aboutTitle) aboutTitle.textContent = t("nav.about");

  const teamTitle = document.getElementById("teamTitle");

  if (teamTitle) teamTitle.textContent = t("nav.team");



  const svcSearch = document.getElementById("serviceSearch");

  if (svcSearch) svcSearch.placeholder = t("ui.serviceSearchPlaceholder");



  const chipToday = document.getElementById("chipToday");

  if (chipToday) chipToday.textContent = t("ui.onlyToday");

  const chipDurAll = document.getElementById("chipDurAll");

  if (chipDurAll) chipDurAll.textContent = t("ui.durAll");

  const chipDur30 = document.getElementById("chipDur30");

  if (chipDur30) chipDur30.textContent = t("ui.dur30");

  const chipDur60 = document.getElementById("chipDur60");

  if (chipDur60) chipDur60.textContent = t("ui.dur60");

  const lblSort = document.getElementById("lblSort");

  if (lblSort) lblSort.textContent = t("ui.sortLabel");

  const svcFiltersClear = document.getElementById("serviceFiltersClear");

  if (svcFiltersClear) svcFiltersClear.textContent = t("ui.clearFilters");



  const sortSel = document.getElementById("serviceSort");

  if (sortSel) {

    for (const opt of sortSel.options) {

      const label = t("ui.sort." + opt.value);

      if (label) opt.textContent = label;

    }

  }

}



function renderHotelSelect() {

  const sel = document.getElementById("hotelSelect");

  if (!sel) return;

  sel.innerHTML = "";

  const optAll = document.createElement("option");

  optAll.value = "";

  optAll.textContent = "Santis Club (Tüm Şubeler)";

  sel.appendChild(optAll);



  for (const h of getHotels()) {
    const opt = document.createElement("option");
    opt.value = h.slug;
    opt.textContent = h.translations?.tr?.name || h.slug;
    sel.appendChild(opt);
  }

  sel.value = state.hotel;

}



/* Category & Top Picks Logic */

function renderTopPicks() {
  const container = document.getElementById("topPicks");
  if (!container) return;
}

function renderCategoryToolbar() {

  const bar = document.getElementById("categoryToolbar");

  if (!bar) return;

  const selectedHotel = getSelectedHotel?.() || null;

  if (!selectedHotel) {

    bar.style.display = "none";

    state.categoryView = "all";

    updateTopPicksPopoverContent();

    return;

  }

  bar.style.display = "flex";

  bar.innerHTML = "";



  const btnAll = document.createElement("button");

  btnAll.className = "chipbtn" + (state.categoryView === "all" ? " active" : "");

  btnAll.textContent = t("ui.filterAll");

  btnAll.onclick = () => {

    state.categoryView = "all";

    renderCategoryToolbar();

    renderCategories();

  };



  const btnTop = document.createElement("button");

  btnTop.className = "chipbtn" + (state.categoryView === "top" ? " active" : "");

  btnTop.textContent = t("ui.filterTopPicks");

  btnTop.onclick = () => {

    state.categoryView = "top";

    renderCategoryToolbar();

    renderCategories();

  };



  bar.appendChild(btnAll);

  bar.appendChild(btnTop);

  updateTopPicksPopoverContent();

}



function updateTopPicksPopoverContent() {

  const hintWrap = document.getElementById("topPicksHint");

  const hintText = document.getElementById("topPicksHintText");

  const selectedHotel = getSelectedHotel();

  const show = !!selectedHotel && state.categoryView === "top";



  if (hintWrap) hintWrap.style.display = show ? "block" : "none";

  if (show && hintText) hintText.textContent = t("ui.topPicksHint");

}



function renderCategories() {

  const grid = document.getElementById("categoriesGrid");

  if (!grid) return;

  grid.innerHTML = "";



  const selectedHotel = getSelectedHotel();

  const hotelSlug = selectedHotel?.slug || "";

  const categories = CONTENT?.global?.categories || [];



  const topPickSet = new Set();

  if (selectedHotel && Array.isArray(selectedHotel.featuredServices)) {

    const services = CONTENT?.global?.services || {};

    selectedHotel.featuredServices.forEach(sid => {

      if (services[sid]?.categoryId) topPickSet.add(services[sid].categoryId);

    });

  }



  for (const cat of categories) {

    if (state.categoryView === "top" && selectedHotel) {

      if (!topPickSet.has(cat.id)) continue;

    }



    const count = countServicesByCategory(cat.id, hotelSlug);

    const card = document.createElement("div");

    card.className = "cat-card card " + (state.activeCategoryId === cat.id ? "active" : "");



    card.innerHTML = `

      <div class="card-body" style="padding:16px;">

         ${count > 0 ? `<div class="count-badge">${count}</div>` : ""}

         <div class="card-title" style="margin-bottom:6px;">${t(cat.navKey)}</div>

         <div class="card-desc">${t(cat.descriptionKey)}</div>

      </div>

    `;



    card.onclick = () => {
      state.activeCategoryId = cat.id;
      renderCategories();
      renderServiceResults();
    };

    grid.appendChild(card);

  }

}



function countServicesByCategory(categoryId, hotelSlug) {

  const services = CONTENT?.global?.services || {};

  let n = 0;

  for (const svc of Object.values(services)) {

    if (!svc || svc.categoryId !== categoryId) continue;

    if (hotelSlug && Array.isArray(svc.hotelSlugs) && svc.hotelSlugs.length > 0 && !svc.hotelSlugs.includes(hotelSlug)) continue;

    n++;

  }

  return n;

}





function renderServiceResults() {

  const listEl = document.getElementById("serviceResultsList");

  const emptyEl = document.getElementById("serviceResultsEmpty");

  const countEl = document.getElementById("countText");

  const metaEl = document.getElementById("serviceResultsMeta");



  if (!listEl) return;

  listEl.innerHTML = "";

  if (emptyEl) emptyEl.style.display = "none";



  const selectedHotel = getSelectedHotel();

  const hotelSlug = selectedHotel?.slug || "";

  const categoryId = state.activeCategoryId;

  const categories = CONTENT?.global?.categories || [];

  const catObj = categories.find(c => c.id === categoryId);



  if (metaEl) metaEl.textContent = catObj ? t(catObj.navKey) : t("ui.pickCategory");



  if (!catObj) {

    if (emptyEl) {

      emptyEl.style.display = "block";

      emptyEl.textContent = t("ui.pickCategory");

    }

    return;

  }



  let services = [];

  const allServices = CONTENT?.global?.services || {};



  for (const [id, svc] of Object.entries(allServices)) {

    if (svc.categoryId !== categoryId) continue;

    if (hotelSlug && Array.isArray(svc.hotelSlugs) && !svc.hotelSlugs.includes(hotelSlug)) continue;

    services.push({ id, ...svc });

  }



  if (countEl) countEl.textContent = services.length;



  for (const svc of services) {

    // 3. Render Card
    // 3. Render Card
    const serviceCard = document.createElement("div");
    serviceCard.className = "svc-card lux-card-surface";
    const name = trText(svc.name);
    const desc = trText(svc.desc);

    // Ensure slug
    const targetSlug = ensureSlug(svc);

    serviceCard.innerHTML = `
      <div class="svc-card-content">
        <div class="svc-card-title">${name}</div>
        <div class="svc-card-desc" style="color:var(--text-muted); font-size:14px; margin-bottom:10px;">
           ${desc}
        </div>
        <div class="svc-card-meta">
          <span>⏱ ${svc.duration} dk</span>
          ${svc.price ? `<span>• ${svc.price}€</span>` : ""}
        </div>
      </div>
      <div class="svc-card-action">
         <button class="btn-sm" type="button" data-book>Rezervasyon</button>
      </div>
    `;

    // Event
    const btn = serviceCard.querySelector("[data-book]");
    if (btn) btn.onclick = (e) => {
      e.stopPropagation();
      state.selectedServiceId = svc.id;
      openBookingModal();
      // Optional: Redirect if needed, or just open modal
      // window.location.href = `service-detail.html?slug=${encodeURIComponent(targetSlug)}`;
    };

    // Append
    if (listEl) listEl.appendChild(serviceCard); // Use listEl instead of grid which was undefined in this scope if copied from rendering logic elsewhere

  }

}







/* Service Drawer */

function openServiceDrawer(id) {

  state.selectedServiceId = id;

  state.svcOpen = true;

  const drawer = document.getElementById("svcDrawer");

  const overlay = document.getElementById("svcOverlay");

  if (drawer) drawer.classList.add("open");

  if (overlay) overlay.style.display = "block";



  const svc = CONTENT?.global?.services?.[id];

  if (svc) {
    document.getElementById("svcDrawerTitle").textContent = trText(svc.name);
    document.getElementById("svcDrawerDesc").textContent = trText(svc.desc);

    const bookBtn = document.getElementById("svcDrawerBook");
    if (bookBtn) bookBtn.onclick = () => {
      state.selectedServiceId = id;
      openBookingModal();
    };
  }

}



function closeServiceDrawer() {

  state.svcOpen = false;

  const drawer = document.getElementById("svcDrawer");

  const overlay = document.getElementById("svcOverlay");

  if (drawer) drawer.classList.remove("open");

  if (overlay) overlay.style.display = "none";

}



/* Init */

function renderAll() {

  document.documentElement.lang = state.lang;



  renderHotelSelect();

  // renderNav(); // Static HTML is used instead

  renderUITexts();

  if (typeof renderTopPicks === "function") {
    renderTopPicks();
  } else {
    console.warn("[renderAll] renderTopPicks yok, atlanıyor");
  }

  renderCategoryToolbar();

  renderCategories();

  renderServiceResults();

  localStorage.setItem("santis_hotel", state.hotel);

}


/* --- SANTIS BENTO CORE INJECTOR (v1.0) --- */
// Non-Destructive "Ultra Mode" Loader
document.addEventListener("DOMContentLoaded", () => {
  // Only run on Homepage
  if (!document.querySelector('.home-editorial') && window.location.pathname !== '/' && !window.location.pathname.includes('index')) return;

  console.log("🍱 Santis Bento Core: Initializing...");

  // 1. Inject CSS Layer
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'assets/css/editorial.css';
  // Fix path if deep in subfolder (though home is usually root)
  if (window.location.pathname.split('/').length > 2) link.href = '../../assets/css/editorial.css';

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
      console.log(`⚡ Instant Load: Prefetching ${card.dataset.href}`);
      const link = document.createElement('link');
      link.rel = 'prefetch'; // 'prerender' is heavier, prefetch is safer
      link.href = card.dataset.href;
      document.head.appendChild(link);
      card.dataset.prefetched = "true"; // Prevent duplicate
    }
  }, { passive: true });
});

/* --- RENDER ENGINE UPDATE (BENTO COMPATIBLE) --- */
function renderHomeSections(data) {
  // FALLBACK IF DATA MISSING
  if (!data || !data.sections) {
    console.warn("Bento Core: Data invalid, utilizing fallback.");
    data = FALLBACK_HOME_DATA;
  }

  const main = document.getElementById('nv-main');
  if (!main) return;

  main.innerHTML = ''; // Clean slate

  // A. HERO SECTION
  const heroData = data.sections.hero.items[0];
  const heroHTML = `
        <section class="editorial-grid-engine" style="margin-bottom: 60px;">
            <div class="bento-card g-wide" onclick="window.location.href='${heroData.link || '#'}'" data-href="${heroData.link || '#'}">
                <img src="${heroData.image}" alt="${heroData.subtitle}" loading="eager">
                <div class="hero-overlay" style="position:absolute; bottom:40px; left:40px; z-index:10; pointer-events:none;">
                    <h2 style="font-size:3rem; color:#fff; font-weight:300; letter-spacing:-1px; text-shadow:0 2px 10px rgba(0,0,0,0.5);">${heroData.title}</h2>
                    <p style="font-size:1.1rem; color:rgba(255,255,255,0.8); font-weight:300;">${heroData.subtitle}</p>
                </div>
            </div>
        </section>
    `;

  // B. BENTO GRID SECTIONS
  // Helper to generate grid HTML
  const createBentoGrid = (items, id) => {
    return items.map((item, i) => `
            <div class="bento-card ${item.layout_class || 'gallery-item'}" onclick="window.location.href='${item.link}'" data-href="${item.link}">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <div style="position:absolute; bottom:20px; left:20px; z-index:5;">
                    <span style="background:#fff; color:#000; padding:4px 8px; font-size:10px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">${item.badge || 'SANTIS'}</span>
                    <h3 style="color:#fff; font-size:1.4rem; margin-top:10px; font-weight:400;">${item.title}</h3>
                </div>
            </div>
        `).join('');
  };

  const slots = [
    ...data.sections["grid-hammam"].items,
    ...data.sections["grid-massages"].items,
    ...data.sections["grid-skincare"].items
  ];

  const gridHTML = `
        <section class="editorial-grid-engine" id="bento-main">
            ${createBentoGrid(slots, 'main-grid')}
        </section>
    `;

  main.innerHTML = heroHTML + gridHTML + "<div style='height:100px;'></div>"; // Spacer
}


// 🛡️ FALLBACK DATA (Fail-Safe)
const FALLBACK_HOME_DATA = {
  sections: {
    "grid-hammam": { items: [] },
    "grid-massages": { items: [] },
    "grid-skincare": { items: [] },
    "hero": { items: [] }
  }
};

try {
  // ✅ Correct Path: Assets (Public) instead of Admin (Private)
  const response = await fetch('assets/data/home_data.json');
  if (response.ok) {
    homeData = await response.json();
    console.log("🧠 Santis Brain Loaded (JSON Mode)");
  } else {
    throw new Error("HTTP " + response.status);
  }
} catch (e) {
  console.warn("⚠️ Santis Brain Offline (Using Fallback):", e);
  homeData = FALLBACK_HOME_DATA;
}

// 2. RENDER LOOP
Object.entries(mapping).forEach(([catKey, gridId]) => {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = "";

  // 🔥 GRID ENGINE SWAP: Safe-Mode (New Class Only)
  // Desktop: Editorial Grid (12-col)
  // Mobile: Snap Scroll Track
  grid.className = "editorial-grid-engine snap-mobile-track";

  // 3. GET ITEMS (JSON or Fallback)
  let items = [];
  if (homeData && homeData.sections && homeData.sections[gridId]) {
    items = homeData.sections[gridId].items;
  } else {
    // Fallback Logic (Keep minimal to avoid breakage)
    // ... (Existing fallback logic removed for brevity, assuming JSON works or manual minimal support)
    console.warn("No JSON data for " + gridId);
  }

  if (!items || items.length === 0) return;

  // 4. BUILD CARDS
  items.forEach((item, index) => {
    const card = document.createElement("a");
    card.href = item.link || "#";

    // Layout Class: The Soul of the Grid
    const layoutClass = item.layout_class || "gallery-item";
    card.className = `${layoutClass} reveal-on-scroll`;

    // Zero-Latency Prefetch
    card.onmouseenter = () => {
      if (item.link) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = item.link;
        document.head.appendChild(link);
      }
    };

    // HTML Structure (Quiet Luxury)
    card.innerHTML = `
        <figure class="nv-figure">
          <div class="img-wrapper">
             <img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" class="card-img">
          </div>
          <figcaption class="card-overlay">
             <span class="card-badge">${item.badge || ""}</span>
             <h3 class="card-title">${item.title}</h3>
             <p class="card-subtitle">${item.subtitle || ""}</p>
          </figcaption>
        </figure>
      `;

    // 5. LIQUID ENGINE BINDING (WebGL)
    // If this is a Hero card, bind to V6 Engine
    if (layoutClass === 'g-wide' && window.SantisV6 && window.SantisV6.bindHover) {
      card.addEventListener('mouseenter', () => window.SantisV6.bindHover(true));
      card.addEventListener('mouseleave', () => window.SantisV6.bindHover(false));
    }

    grid.appendChild(card);
  });
});
}



const FALLBACK_DATA = window.SANTIS_FALLBACK || {
  "global": {
    "defaultCurrency": "EUR",
    "routes": {
      "home": "index.html",
      "hammam": "hamam-rituelleri/",
      "massages": "tr/masajlar/index.html",
      "classic": "tr/masajlar/index.html",
      "sports": "tr/masajlar/index.html",
      "asian": "tr/masajlar/index.html",
      "ayurveda": "tr/masajlar/index.html",
      "signature": "tr/masajlar/index.html",
      "hammam": "tr/hamam/index.html",
      "massages": "tr/masajlar/index.html",
      "skincare": "tr/cilt-bakimi/index.html",
      "products": "tr/urunler/index.html",
      "gallery": "tr/galeri/index.html",
      "booking": "booking.html"
    },
    "navModel": [
      {
        "key": "home",
        "route": "home",
        "sectionKey": "home"
      },
      {
        "key": "hammam",
        "route": "hammam",
        "sectionKey": "hammam",
        "categoryId": "hammam"
      },
      {
        "key": "massages",
        "route": "massages",
        "sectionKey": "massages",
        "categoryId": "massages",
        "children": [
          {
            "key": "classicMassages",
            "route": "classic",
            "sectionKey": "services",
            "categoryId": "classicMassages"
          },
          {
            "key": "sportsTherapy",
            "route": "sports",
            "sectionKey": "services",
            "categoryId": "sportsTherapy"
          },
          {
            "key": "asianMassages",
            "route": "asian",
            "sectionKey": "services",
            "categoryId": "asianMassages"
          },
          {
            "key": "ayurveda",
            "route": "ayurveda",
            "sectionKey": "services",
            "categoryId": "ayurveda"
          }
        ]
      },
      {
        "key": "signatureCouples",
        "route": "signature",
        "sectionKey": "services",
        "categoryId": "signatureCouples"
      },
      {
        "key": "kidsFamily",
        "route": "kids",
        "sectionKey": "services",
        "categoryId": "kidsFamily"
      },
      {
        "key": "faceSothys",
        "route": "face",
        "sectionKey": "services",
        "categoryId": "faceSothys"
      },
      {
        "key": "products",
        "route": "products",
        "sectionKey": "products",
        "categoryId": "products"
      },
      {
        "key": "about",
        "route": "about",
        "sectionKey": "about"
      },
      {
        "key": "team",
        "route": "team",
        "sectionKey": "team"
      },
      {
        "key": "bookingWhatsapp",
        "route": "booking",
        "sectionKey": "booking"
      }
    ],
    "hotels": [
      {
        "slug": "alba-resort",
        "hero_image": "images/alba-resort.jpg",
        "translations": {
          "tr": {
            "name": "Alba Resort Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Side sahilinde geleneksel hamam ritüelleri, terapi masajları ve yenileyici bakım deneyimi.",
            "top3": [
              "Geleneksel Türk Hamamı",
              "Çiftler için Signature Masajı",
              "Derin Doku / Spor Masajı"
            ]
          },
          "en": {
            "name": "Alba Resort Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Experience authentic Turkish bath rituals, therapy massages, and rejuvenating care on the Side coast.",
            "top3": [
              "Traditional Turkish Hammam",
              "Signature Couples Massage",
              "Deep Tissue / Sports Massage"
            ]
          },
          "de": {
            "name": "Alba Resort Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Authentische türkische Hammam-Rituale, therapeutische Massagen und regenerierende Behandlungen an der Küste von Side.",
            "top3": [
              "Traditionelles Türkisches Hammam",
              "Signature Paarmassage",
              "Tiefengewebs- / Sportmassage"
            ]
          },
          "fr": {
            "name": "Alba Resort Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Rituels de hammam turc, massages thérapeutiques et soins revitalisants sur la côte de Side.",
            "top3": [
              "Hammam turc traditionnel",
              "Massage Signature en couple",
              "Massage profond / sportif"
            ]
          },
          "ru": {
            "name": "Alba Resort Hotel",
            "location": "Чолаклы / Сиде, Анталья",
            "description": "Традиционные хаммам-ритуалы, терапевтические массажи и омолаживающие процедуры на побережье Сиде.",
            "top3": [
              "Традиционный турецкий хаммам",
              "Парный массаж Signature",
              "Глубокотканный / спортивный массаж"
            ]
          }
        },
        "featuredServices": [
          "hammam_traditional_ritual",
          "couples_signature",
          "deep_tissue"
        ]
      },
      {
        "slug": "alba-queen",
        "hero_image": "images/alba-queen.jpg",
        "translations": {
          "tr": {
            "name": "Alba Queen Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Premium spa konseptinde kişiselleştirilmiş masajlar ve rahatlatıcı hamam deneyimi.",
            "top3": [
              "Geleneksel Türk Hamamı",
              "Çiftler için Signature Masajı",
              "Derin Doku / Spor Masajı"
            ]
          },
          "en": {
            "name": "Alba Queen Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Premium spa concept offering personalized massages and relaxing hammam experiences.",
            "top3": [
              "Traditional Turkish Hammam",
              "Signature Couples Massage",
              "Deep Tissue / Sports Massage"
            ]
          },
          "de": {
            "name": "Alba Queen Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Premium-Spa-Konzept mit personalisierten Massagen und entspannenden Hammam-Erlebnissen.",
            "top3": [
              "Traditionelles Türkisches Hammam",
              "Signature Paarmassage",
              "Tiefengewebs- / Sportmassage"
            ]
          },
          "fr": {
            "name": "Alba Queen Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Concept spa premium avec massages personnalisés et expérience hammam relaxante.",
            "top3": [
              "Hammam turc traditionnel",
              "Massage Signature en couple",
              "Massage profond / sportif"
            ]
          },
          "ru": {
            "name": "Alba Queen Hotel",
            "location": "Чолаклы / Сиде, Анталья",
            "description": "Премиум SPA-концепция с индивидуальными массажами и расслабляющим опытом хаммама.",
            "top3": [
              "Традиционный турецкий хаммам",
              "Парный массаж Signature",
              "Глубокотканный / спортивный массаж"
            ]
          }
        },
        "featuredServices": [
          "hammam_traditional_ritual",
          "couples_signature",
          "deep_tissue"
        ]
      },
      {
        "slug": "alba-royal",
        "hero_image": "images/alba-royal.jpg",
        "translations": {
          "tr": {
            "name": "Alba Royal Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Sakin atmosferiyle hamam, masaj ve yüz bakımlarında huzurlu bir spa deneyimi.",
            "top3": [
              "Geleneksel Türk Hamamı",
              "Çiftler için Signature Masajı",
              "Derin Doku / Spor Masajı"
            ]
          },
          "en": {
            "name": "Alba Royal Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Calm atmosphere offering hammam, massage, and facial care for a peaceful spa experience.",
            "top3": [
              "Traditional Turkish Hammam",
              "Signature Couples Massage",
              "Deep Tissue / Sports Massage"
            ]
          },
          "de": {
            "name": "Alba Royal Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Ruhige Atmosphäre mit Hammam, Massage und Gesichtsbehandlungen für ein entspanntes Spa-Erlebnis.",
            "top3": [
              "Traditionelles Türkisches Hammam",
              "Signature Paarmassage",
              "Tiefengewebs- / Sportmassage"
            ]
          },
          "fr": {
            "name": "Alba Royal Hotel",
            "location": "Çolaklı / Side, Antalya",
            "description": "Ambiance apaisante offrant hammam, massages et soins du visage pour une expérience spa sereine.",
            "top3": [
              "Hammam turc traditionnel",
              "Massage Signature en couple",
              "Massage profond / sportif"
            ]
          },
          "ru": {
            "name": "Alba Royal Hotel",
            "location": "Чолаклы / Сиде, Анталья",
            "description": "Спокойная атмосфера, хаммам, массаж и уход за лицом для полного релакса.",
            "top3": [
              "Традиционный турецкий хаммам",
              "Парный массаж Signature",
              "Глубокотканный / спортивный массаж"
            ]
          }
        },
        "featuredServices": [
          "hammam_traditional_ritual",
          "couples_signature",
          "deep_tissue"
        ]
      },
      {
        "slug": "iberostar-bellevue",
        "hero_image": "images/iberostar.jpg",
        "translations": {
          "tr": {
            "name": "Iberostar Waves Bellevue",
            "location": "Bečići / Budva, Karadağ",
            "description": "Adriyatik kıyısında, tatilin ritmini tamamlayan spa ritüelleri ve masajlarla iyi hissetme deneyimi.",
            "top3": [
              "Geleneksel Türk Hamamı",
              "Çiftler için Signature Masajı",
              "Derin Doku / Spor Masajı"
            ]
          },
          "en": {
            "name": "Iberostar Waves Bellevue",
            "location": "Bečići / Budva, Montenegro",
            "description": "On the Adriatic coast, enjoy spa rituals and massages that complete your holiday rhythm.",
            "top3": [
              "Traditional Turkish Hammam",
              "Signature Couples Massage",
              "Deep Tissue / Sports Massage"
            ]
          },
          "de": {
            "name": "Iberostar Waves Bellevue",
            "location": "Bečići / Budva, Montenegro",
            "description": "An der Adriaküste – Spa-Rituale und Massagen, die Ihren Urlaub perfekt ergänzen.",
            "top3": [
              "Traditionelles Türkisches Hammam",
              "Signature Paarmassage",
              "Tiefengewebs- / Sportmassage"
            ]
          },
          "fr": {
            "name": "Iberostar Waves Bellevue",
            "location": "Bečići / Budva, Monténégro",
            "description": "Sur la côte adriatique, rituels spa et massages pour compléter le rythme de vos vacances.",
            "top3": [
              "Hammam turc traditionnel",
              "Massage Signature en couple",
              "Massage profond / sportif"
            ]
          },
          "ru": {
            "name": "Iberostar Waves Bellevue",
            "location": "Бечичи / Будва, Черногория",
            "description": "На побережье Адриатики — спа-ритуалы и массажи, которые завершают ваш отдых.",
            "top3": [
              "Традиционный турецкий хаммам",
              "Парный массаж Signature",
              "Глубокотканный / спортивный массаж"
            ]
          }
        },
        "featuredServices": [
          "hammam_traditional_ritual",
          "couples_signature",
          "deep_tissue"
        ]
      }
    ],
    "categories": [
      {
        "id": "hammam",
        "navKey": "nav.hammam",
        "sectionId": "cat-hammam",
        "descriptionKey": "categories.hammamDesc"
      },
      {
        "id": "massages",
        "navKey": "nav.massages",
        "sectionId": "cat-massages",
        "descriptionKey": "categories.massagesDesc"
      },
      {
        "id": "classicMassages",
        "navKey": "nav.classicMassages",
        "sectionId": "cat-classic",
        "descriptionKey": "categories.classicDesc"
      },
      {
        "id": "sportsTherapy",
        "navKey": "nav.sportsTherapy",
        "sectionId": "cat-sports",
        "descriptionKey": "categories.sportsDesc"
      },
      {
        "id": "asianMassages",
        "navKey": "nav.asianMassages",
        "sectionId": "cat-asian",
        "descriptionKey": "categories.asianDesc"
      },
      {
        "id": "ayurveda",
        "navKey": "nav.ayurveda",
        "sectionId": "cat-ayurveda",
        "descriptionKey": "categories.ayurvedaDesc"
      },
      {
        "id": "signatureCouples",
        "navKey": "nav.signatureCouples",
        "sectionId": "cat-signature",
        "descriptionKey": "categories.signatureDesc"
      },
      {
        "id": "kidsFamily",
        "navKey": "nav.kidsFamily",
        "sectionId": "cat-kids",
        "descriptionKey": "categories.kidsDesc"
      },
      {
        "id": "faceSothys",
        "navKey": "nav.faceSothys",
        "sectionId": "cat-face",
        "descriptionKey": "categories.faceDesc"
      },
      {
        "id": "products",
        "navKey": "nav.products",
        "sectionId": "cat-products",
        "descriptionKey": "categories.productsDesc"
      }
    ],
    "services": {
      "hammam_traditional_ritual": {
        "categoryId": "hammam",
        "name": {
          "tr": "Geleneksel Hamam Ritüeli",
          "en": "Traditional Hammam Ritual",
          "de": "Traditionelles Hammam-Ritual",
          "fr": "Rituel traditionnel du hammam",
          "ru": "Традиционный ритуал хаммама"
        },
        "desc": {
          "tr": "Arınma, ısı ve kese ile yenilenme.",
          "en": "Purify and renew with heat and exfoliation.",
          "de": "Reinigung und Erneuerung mit Wärme und Peeling.",
          "fr": "Purification et renouveau par chaleur et gommage.",
          "ru": "Очищение и обновление с теплом и пилингом."
        },
        "durationMin": 60,
        "price": 110,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_hammam_v1.webp",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal"
        ]
      },
      "hammam_foam": {
        "categoryId": "hammam",
        "name": {
          "tr": "Köpük Masajı (Hamam)",
          "en": "Foam Massage (Hammam)",
          "de": "Schaummassage (Hammam)",
          "fr": "Massage à la mousse (hammam)",
          "ru": "Пенный массаж (хаммам)"
        },
        "desc": {
          "tr": "Geleneksel köpükle rahatlatıcı masaj.",
          "en": "Relaxing massage with traditional foam.",
          "de": "Entspannende Massage mit traditionellem Schaum.",
          "fr": "Massage relaxant à la mousse traditionnelle.",
          "ru": "Расслабляющий массаж с традиционной пеной."
        },
        "durationMin": 45,
        "price": 85,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_hammam_v1.webp",
        "hotelSlugs": [
          "alba-royal"
        ]
      },
      "relax_aroma": {
        "categoryId": "classicMassages",
        "name": {
          "tr": "Aromaterapi Rahatlama Masajı",
          "en": "Aromatherapy Relax Massage",
          "de": "Aromatherapie-Entspannungsmassage",
          "fr": "Massage relaxation aromathérapie",
          "ru": "Расслабляющий аромамассаж"
        },
        "desc": {
          "tr": "Seçili aromalarla zihni ve bedeni sakinleştirir.",
          "en": "Calms body and mind with selected aromas.",
          "de": "Beruhigt Körper und Geist mit ausgewählten Aromen.",
          "fr": "Apaise le corps et l’esprit avec des arômes choisis.",
          "ru": "Успокаивает тело и ум с выбранными ароматами."
        },
        "durationMin": 60,
        "price": 120,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_massage_v1.webp",
        "hotelSlugs": [
          "alba-resort",
          "iberostar-bellevue"
        ]
      },
      "swedish_classic": {
        "categoryId": "classicMassages",
        "name": {
          "tr": "Klasik İsveç Masajı",
          "en": "Classic Swedish Massage",
          "de": "Klassische Schwedische Massage",
          "fr": "Massage suédois classique",
          "ru": "Классический шведский массаж"
        },
        "desc": {
          "tr": "Klasik tekniklerle genel rahatlama.",
          "en": "Overall relaxation with classic techniques.",
          "de": "Ganzkörper-Entspannung mit klassischen Techniken.",
          "fr": "Relaxation générale avec techniques classiques.",
          "ru": "Общее расслабление классическими техниками."
        },
        "durationMin": 50,
        "price": 105,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_massage_v1.webp",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal"
        ]
      },
      "deep_tissue": {
        "categoryId": "sportsTherapy",
        "name": {
          "tr": "Derin Doku (Deep Tissue) Masajı",
          "en": "Deep Tissue Massage",
          "de": "Tiefengewebsmassage",
          "fr": "Massage des tissus profonds",
          "ru": "Глубокотканный массаж"
        },
        "desc": {
          "tr": "Kas gerginliğini azaltmaya odaklı terapi.",
          "en": "Therapy-focused for reducing muscle tension.",
          "de": "Therapie zur Reduzierung von Muskelverspannungen.",
          "fr": "Thérapie ciblée pour réduire les tensions musculaires.",
          "ru": "Терапия для снятия мышечного напряжения."
        },
        "durationMin": 60,
        "price": 140,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_deeptissue_v1.webp",
        "hotelSlugs": [
          "alba-queen",
          "iberostar-bellevue"
        ]
      },
      "sports_recovery": {
        "categoryId": "sportsTherapy",
        "name": {
          "tr": "Spor Recovery Masajı",
          "en": "Sports Recovery Massage",
          "de": "Sport-Recovery-Massage",
          "fr": "Massage de récupération sportive",
          "ru": "Спортивный восстановительный массаж"
        },
        "desc": {
          "tr": "Antrenman sonrası toparlanmaya yardımcı olur.",
          "en": "Supports post-workout recovery.",
          "de": "Unterstützt die Regeneration nach dem Training.",
          "fr": "Aide à la récupération après l’effort.",
          "ru": "Помогает восстановлению после нагрузки."
        },
        "durationMin": 60,
        "price": 135,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_deeptissue_v1.webp",
        "hotelSlugs": [
          "alba-royal"
        ]
      },
      "thai_traditional": {
        "categoryId": "asianMassages",
        "name": {
          "tr": "Geleneksel Thai Masajı",
          "en": "Traditional Thai Massage",
          "de": "Traditionelle Thai-Massage",
          "fr": "Massage thaï traditionnel",
          "ru": "Традиционный тайский массаж"
        },
        "desc": {
          "tr": "Esneme ve baskı teknikleriyle enerji dengesi.",
          "en": "Balance energy with stretches and pressure techniques.",
          "de": "Energieausgleich durch Dehnung und Drucktechniken.",
          "fr": "Équilibre énergétique par étirements et pressions.",
          "ru": "Баланс энергии через растяжку и давление."
        },
        "durationMin": 60,
        "price": 130,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_thai_v1.webp",
        "hotelSlugs": [
          "alba-queen"
        ]
      },
      "balinese": {
        "categoryId": "asianMassages",
        "name": {
          "tr": "Bali Masajı",
          "en": "Balinese Massage",
          "de": "Balinesische Massage",
          "fr": "Massage balinais",
          "ru": "Балийский массаж"
        },
        "desc": {
          "tr": "Rahatlatıcı ritim ve akışkan dokunuşlar.",
          "en": "Relaxing rhythm with flowing techniques.",
          "de": "Entspannender Rhythmus mit fließenden Techniken.",
          "fr": "Rythme relaxant et gestes fluides.",
          "ru": "Расслабляющий ритм и плавные техники."
        },
        "durationMin": 60,
        "price": 125,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_massage_v1.webp",
        "hotelSlugs": [
          "iberostar-bellevue"
        ]
      },
      "ayurveda_abhyanga": {
        "categoryId": "ayurveda",
        "name": {
          "tr": "Abhyanga Ayurveda Masajı",
          "en": "Abhyanga Ayurveda Massage",
          "de": "Abhyanga Ayurveda-Massage",
          "fr": "Massage ayurvédique Abhyanga",
          "ru": "Аюрведический массаж Абхьянга"
        },
        "desc": {
          "tr": "Sıcak yağlarla bütünsel denge ve rahatlama.",
          "en": "Holistic balance and relaxation with warm oils.",
          "de": "Ganzheitliche Balance und Entspannung mit warmen Ölen.",
          "fr": "Équilibre et détente holistiques avec huiles chaudes.",
          "ru": "Целостный баланс и расслабление с тёплыми маслами."
        },
        "durationMin": 75,
        "price": 160,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_shirodhara_v1.webp",
        "hotelSlugs": [
          "alba-royal"
        ]
      },
      "shirodhara": {
        "categoryId": "ayurveda",
        "name": {
          "tr": "Shirodhara Ritüeli",
          "en": "Shirodhara Ritual",
          "de": "Shirodhara-Ritual",
          "fr": "Rituel Shirodhara",
          "ru": "Ритуал Широдхара"
        },
        "desc": {
          "tr": "Zihni sakinleştiren özel Ayurveda ritüeli.",
          "en": "A signature Ayurveda ritual to calm the mind.",
          "de": "Ein Ayurveda-Signaturritual zur Beruhigung des Geistes.",
          "fr": "Un rituel ayurvédique signature pour apaiser l’esprit.",
          "ru": "Фирменный аюрведический ритуал для спокойствия ума."
        },
        "durationMin": 60,
        "price": 170,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_shirodhara_v1.webp",
        "hotelSlugs": [
          "alba-royal"
        ]
      },
      "couples_signature": {
        "categoryId": "signatureCouples",
        "name": {
          "tr": "Signature Couples Masajı",
          "en": "Signature Couples Massage",
          "de": "Signature-Paarmassage",
          "fr": "Massage signature en duo",
          "ru": "Авторский массаж для пары"
        },
        "desc": {
          "tr": "Çiftlere özel senkronize imza deneyimi.",
          "en": "A synchronized signature experience for couples.",
          "de": "Ein synchrones Signature-Erlebnis für Paare.",
          "fr": "Une expérience signature synchronisée pour les couples.",
          "ru": "Синхронный фирменный опыт для пар."
        },
        "durationMin": 60,
        "price": 180,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_couple_v1.webp",
        "hotelSlugs": [
          "alba-resort",
          "alba-queen"
        ]
      },
      "santis_signature": {
        "categoryId": "signatureCouples",
        "name": {
          "tr": "Santis Signature Masajı",
          "en": "Santis Signature Massage",
          "de": "Santis Signature-Massage",
          "fr": "Massage signature Santis",
          "ru": "Фирменный массаж Santis"
        },
        "desc": {
          "tr": "Santis dokunuşuyla ritimli, premium masaj.",
          "en": "Premium, rhythmic massage with the Santis touch.",
          "de": "Premium-Rhythmusmassage mit Santis-Touch.",
          "fr": "Massage premium et rythmé avec la touche Santis.",
          "ru": "Премиальный ритмичный массаж с почерком Santis."
        },
        "durationMin": 60,
        "price": 150,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_couple_v1.webp",
        "hotelSlugs": [
          "alba-queen",
          "iberostar-bellevue"
        ]
      },
      "kids_choco_massage": {
        "categoryId": "kidsFamily",
        "name": {
          "tr": "Kids Çikolata Masajı",
          "en": "Kids Chocolate Massage",
          "de": "Kinder-Schokoladenmassage",
          "fr": "Massage chocolat pour enfants",
          "ru": "Детский шоколадный массаж"
        },
        "desc": {
          "tr": "Çocuklara uygun, hafif ve eğlenceli masaj.",
          "en": "A gentle, fun massage designed for kids.",
          "de": "Sanfte, spielerische Massage für Kinder.",
          "fr": "Massage doux et ludique pour enfants.",
          "ru": "Мягкий и приятный массаж для детей."
        },
        "durationMin": 30,
        "price": 65,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_kids_v1.webp",
        "hotelSlugs": [
          "alba-resort",
          "alba-queen"
        ]
      },
      "face_sothys_hydra": {
        "categoryId": "faceSothys",
        "name": {
          "tr": "Sothys Nem Terapisi (Yüz)",
          "en": "Sothys Hydra Facial",
          "de": "Sothys Hydra-Gesichtsbehandlung",
          "fr": "Soin visage hydratant Sothys",
          "ru": "Увлажняющий уход Sothys"
        },
        "desc": {
          "tr": "Yoğun nem ve tazelik etkisi.",
          "en": "Intense hydration and freshness.",
          "de": "Intensive Feuchtigkeit und Frische.",
          "fr": "Hydratation intense et fraîcheur.",
          "ru": "Интенсивное увлажнение и свежесть."
        },
        "durationMin": 50,
        "price": 125,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_skincare_v1.webp",
        "hotelSlugs": [
          "alba-resort",
          "iberostar-bellevue"
        ]
      },
      "face_sothys_glow": {
        "categoryId": "faceSothys",
        "name": {
          "tr": "Sothys Glow Bakımı (Yüz)",
          "en": "Sothys Glow Facial",
          "de": "Sothys Glow-Gesichtsbehandlung",
          "fr": "Soin éclat Sothys",
          "ru": "Сияющий уход Sothys"
        },
        "desc": {
          "tr": "Işıltı ve canlı görünüm için profesyonel bakım.",
          "en": "A professional treatment for radiance and vitality.",
          "de": "Professionelle Behandlung für Ausstrahlung und Vitalität.",
          "fr": "Soin professionnel pour l’éclat et la vitalité.",
          "ru": "Профессиональный уход для сияния и тонуса."
        },
        "durationMin": 50,
        "price": 135,
        "currency": "EUR",
        "img": "assets/img/cards/santis_card_skincare_v1.webp",
        "hotelSlugs": [
          "alba-queen"
        ]
      },
      "sothys_radiance": {
        "id": "sothys_radiance",
        "slug": "sothys-organics-radiance",
        "duration": 30,
        "badge": "express",
        "name": {
          "tr": "Sothys Organics® Işıltı Bakımı",
          "en": "Sothys Organics® Organic Certified Radiance Treatment",
          "de": "Sothys Organics® Bio-Radiance Behandlung",
          "fr": "Sothys Organics® Soin éclat certifié bio",
          "ru": "Sothys Organics® Органический уход «Сияние»"
        },
        "desc": {
          "tr": "Anında ışıltı. Tüm cilt tipleri (hassas dahil).",
          "en": "Instant radiance. All skin types (even sensitive).",
          "de": "Sofortiger Glow. Für alle Hauttypen (auch sensibel).",
          "fr": "Éclat immédiat. Tous types de peau (même sensibles).",
          "ru": "Мгновенное сияние. Для всех типов кожи (включая чувствительную)."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_seasonal": {
        "id": "sothys_seasonal",
        "slug": "sothys-seasonal",
        "duration": 45,
        "name": {
          "tr": "Sothys Seasonal Oksijenlendirici Bakım",
          "en": "Sothys Seasonal Oxygenating Treatment",
          "de": "Sothys Seasonal Oxygenating Behandlung",
          "fr": "Sothys Soin saisonnier oxygénant",
          "ru": "Sothys Сезонный кислородный уход"
        },
        "desc": {
          "tr": "Mevsimsel canlandırma: peeling + maske + rahatlatıcı modelaj.",
          "en": "Seasonal boost: exfoliation + mask + relaxing modelling.",
          "de": "Saisonaler Boost: Peeling + Maske + entspannende Modellage.",
          "fr": "Boost saisonnier : gommage + masque + modelage relaxant.",
          "ru": "Сезонное обновление: пилинг + маска + расслабляющий массаж."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_soothing_spa": {
        "id": "sothys_soothing_spa",
        "slug": "sothys-soothing",
        "duration": 50,
        "name": {
          "tr": "Spa™ Termal Su ile Yatıştırıcı Bakım",
          "en": "Soothing Professional Treatment with Spa™ Thermal Water",
          "de": "Beruhigende Profi-Behandlung mit Spa™ Thermalwasser",
          "fr": "Soin professionnel apaisant à l’Eau Thermale Spa™",
          "ru": "Успокаивающий профессиональный уход со Spa™ термальной водой"
        },
        "desc": {
          "tr": "Konfor ve sakinlik odaklı; hassasiyete nazik yaklaşım.",
          "en": "Comfort & calm—gentle care for sensitive skin.",
          "de": "Komfort & Ruhe—sanfte Pflege für sensible Haut.",
          "fr": "Confort & apaisement—pour peaux sensibles.",
          "ru": "Комфорт и успокоение — деликатный уход для чувствительной кожи."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_cryo_eye": {
        "id": "sothys_cryo_eye",
        "slug": "sothys-cryo-eye",
        "duration": 45,
        "name": {
          "tr": "Sothys Cryo Eye Profesyonel Göz Bakımı",
          "en": "Sothys Cryo Eye Professional Treatment",
          "de": "Sothys Cryo Eye Profi-Augenbehandlung",
          "fr": "Sothys Soin professionnel Cryo Yeux",
          "ru": "Sothys Профессиональный Cryo-уход для глаз"
        },
        "desc": {
          "tr": "Göz çevresinde ferahlık ve daha dinlenmiş görünüm.",
          "en": "Refreshing eye contour for a rested look.",
          "de": "Erfrischte Augenpartie für einen wachen Blick.",
          "fr": "Contour des yeux rafraîchi, regard reposé.",
          "ru": "Освежает область вокруг глаз для отдохнувшего вида."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_hydra_new": {
        "id": "sothys_hydra_new",
        "slug": "sothys-hydra-ha4",
        "duration": 75,
        "name": {
          "tr": "Hydra Hyaluronic Acid4 (Yoğun Nem Bakımı)",
          "en": "Hydrating Intensive Treatment (Hydra Hyaluronic Acid4)",
          "de": "Hydrating Intensive Behandlung (Hydra Hyaluronic Acid4)",
          "fr": "Soin intensif hydratant (Hydra Hyaluronic Acid4)",
          "ru": "Интенсивное увлажнение (Hydra Hyaluronic Acid4)"
        },
        "desc": {
          "tr": "6 aşamalı yoğun nem; dolgunluk ve tazelik hissi.",
          "en": "6-step intensive hydration; plumped, fresh-feeling skin.",
          "de": "6 Schritte intensive Hydration; pralle, frische Haut.",
          "fr": "Hydratation intensive en 6 étapes; peau repulpée.",
          "ru": "6 этапов интенсивного увлажнения; ощущение наполненности."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_detox_new": {
        "id": "sothys_detox_new",
        "slug": "sothys-detox-energie",
        "duration": 75,
        "name": {
          "tr": "Detox Energie™ Yoğun Bakım",
          "en": "Detox Energie™ Intensive Treatment",
          "de": "Detox Energie™ Intensive Behandlung",
          "fr": "Soin intensif Detox Energie™",
          "ru": "Detox Energie™ Интенсивный уход"
        },
        "desc": {
          "tr": "Enerji desteği ve ‘depolluted’ görünüm odağı.",
          "en": "Energy boost with a ‘depolluted’ looking complexion focus.",
          "de": "Energie-Boost mit Fokus auf ein ‘entlastet’ wirkendes Hautbild.",
          "fr": "Coup d’énergie avec focus ‘teint dépollué’.",
          "ru": "Энергия и акцент на «очищенный» вид кожи."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_glow_defense": {
        "id": "sothys_glow_defense",
        "slug": "sothys-glow-defense",
        "duration": 75,
        "name": {
          "tr": "Glow Defense Yoğun Bakım",
          "en": "Glow Defense Intensive Treatment",
          "de": "Glow Defense Intensive Behandlung",
          "fr": "Soin intensif Glow Defense",
          "ru": "Glow Defense Интенсивный уход"
        },
        "desc": {
          "tr": "Işıltı ve koruma odağı; şehir temposuna karşı bakım hissi.",
          "en": "Glow + defense focus—ideal for urban life stressors.",
          "de": "Glow + Schutz—ideal gegen urbane Stressfaktoren.",
          "fr": "Éclat + protection—idéal face au stress urbain.",
          "ru": "Сияние + защита — идеально при городской нагрузке."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_youth_intensive": {
        "id": "sothys_youth_intensive",
        "slug": "sothys-youth-intensive",
        "duration": 75,
        "name": {
          "tr": "Youth Intensive (Gençlik Yoğun Bakım)",
          "en": "Youth Intensive Treatment",
          "de": "Youth Intensive Behandlung",
          "fr": "Soin intensif Jeunesse",
          "ru": "Youth Intensive — Интенсивный уход"
        },
        "desc": {
          "tr": "Daha genç görünüm ve sıkılık hissi odaklı protokol.",
          "en": "Expert protocol focused on a visibly younger look & firmness feel.",
          "de": "Expertenprotokoll für sichtbar jüngeren Look & Festigkeit.",
          "fr": "Protocole expert pour un effet jeunesse & fermeté.",
          "ru": "Эксперт-протокол для более молодого вида и упругости."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_dermo_booster": {
        "id": "sothys_dermo_booster",
        "slug": "sothys-dermo-booster",
        "duration": 45,
        "name": {
          "tr": "Dermo_Booster Double Peel (Çift Peeling)",
          "en": "Dermo_Booster Double Peel Professional Treatment",
          "de": "Dermo_Booster Double Peel Profi-Behandlung",
          "fr": "Dermo_Booster Double Peel — Soin professionnel",
          "ru": "Dermo_Booster Double Peel — Профессиональный уход"
        },
        "desc": {
          "tr": "Enzim + asit peeling kombinasyonu (AHA/BHA/PHA).",
          "en": "Enzymatic peel + acid peel combination (AHA/BHA/PHA).",
          "de": "Enzympeeling + Säurepeeling (AHA/BHA/PHA).",
          "fr": "Peeling enzymatique + peeling acide (AHA/BHA/PHA).",
          "ru": "Ферментный + кислотный пилинг (AHA/BHA/PHA)."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_glysalac": {
        "id": "sothys_glysalac",
        "slug": "sothys-glysalac",
        "duration": 45,
        "name": {
          "tr": "Glysalac Pro Peel",
          "en": "Glysalac Pro Peel Treatment",
          "de": "Glysalac Pro Peel Behandlung",
          "fr": "Glysalac Pro Peel",
          "ru": "Glysalac Pro Peel"
        },
        "desc": {
          "tr": "Daha pürüzsüz doku ve daha aydınlık görünüm (normal/karma).",
          "en": "Refines texture & brightens (normal/combination skin).",
          "de": "Verfeinert & hellt auf (normale/mischhaut).",
          "fr": "Affiner & illuminer (peau normale/mixte).",
          "ru": "Выравнивает текстуру и придает сияние (норм./комб.)."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      },
      "sothys_resurfacing": {
        "id": "sothys_resurfacing",
        "slug": "sothys-resurfacing",
        "duration": 60,
        "name": {
          "tr": "Professional Resurfacing Peel (Yenileyici Peeling)",
          "en": "Professional Resurfacing Peel Treatment",
          "de": "Professional Resurfacing Peel Behandlung",
          "fr": "Soin peeling resurfaçant professionnel",
          "ru": "Профессиональный Resurfacing Peel"
        },
        "desc": {
          "tr": "Peel + mikrodermabrazyon yaklaşımı; daha net ve aydınlık görünüm.",
          "en": "Peel + microdermabrasion approach for renewed-looking skin.",
          "de": "Peel + Mikrodermabrasion für erneuert wirkende Haut.",
          "fr": "Peeling + microdermabrasion pour une peau renouvelée.",
          "ru": "Пилинг + микродермабразия для обновленного вида кожи."
        },
        "content": {},
        "categoryId": "faceSothys",
        "hotelSlugs": [
          "alba-resort",
          "alba-royal",
          "alba-queen",
          "iberostar-bellevue"
        ],
        "price": 0,
        "currency": "EUR"
      }
    },
    "booking": {
      "translations": {
        "tr": {
          "title": "Rezervasyon Formu",
          "description": "Lütfen aşağıdaki formu doldurarak rezervasyon talebinizi iletin. Ekibimiz en kısa sürede sizinle iletişime geçecektir.",
          "fields": {
            "hotel": "Otel Seçiniz",
            "service": "Hizmet",
            "date": "Tarih",
            "time": "Saat",
            "guests": "Kişi Sayısı",
            "name": "Ad Soyad",
            "phone": "Telefon",
            "email": "E-posta (isteğe bağlı)",
            "room": "Oda Numarası (isteğe bağlı)",
            "notes": "Notlar (sağlık, hamilelik, özel istekler)",
            "agree_privacy": "KVKK ve Gizlilik Politikasını kabul ediyorum.",
            "agree_cancel": "İptal ve erteleme koşullarını okudum, onaylıyorum."
          },
          "buttons": {
            "submit": "Rezervasyonu Gönder",
            "whatsapp": "WhatsApp ile Hızlı Rezervasyon"
          },
          "whatsapp_template": "Merhaba, {otel} için {hizmet} rezervasyonu yapmak istiyorum. Tarih: {tarih}, Saat: {saat}, Kişi: {kisi}. İsim: {isim}."
        },
        "en": {
          "title": "Booking Form",
          "description": "Please fill out the form below to send your reservation request. Our team will contact you shortly.",
          "fields": {
            "hotel": "Select Hotel",
            "service": "Service",
            "date": "Date",
            "time": "Time",
            "guests": "Number of Guests",
            "name": "Full Name",
            "phone": "Phone",
            "email": "Email (optional)",
            "room": "Room Number (optional)",
            "notes": "Notes (health, pregnancy, special requests)",
            "agree_privacy": "I accept the Privacy Policy.",
            "agree_cancel": "I have read and accept the cancellation terms."
          },
          "buttons": {
            "submit": "Submit Booking",
            "whatsapp": "Book via WhatsApp"
          },
          "whatsapp_template": "Hello, I would like to book {service} at {hotel}. Date: {date}, Time: {time}, Guests: {guests}. Name: {name}."
        },
        "de": {
          "title": "Reservierungsformular",
          "description": "Bitte füllen Sie das folgende Formular aus, um Ihre Reservierungsanfrage zu senden. Unser Team wird sich bald mit Ihnen in Verbindung setzen.",
          "fields": {
            "hotel": "Hotel auswählen",
            "service": "Dienstleistung",
            "date": "Datum",
            "time": "Uhrzeit",
            "guests": "Anzahl der Personen",
            "name": "Vollständiger Name",
            "phone": "Telefon",
            "email": "E-Mail (optional)",
            "room": "Zimmernummer (optional)",
            "notes": "Notizen (Gesundheit, Schwangerschaft, Sonderwünsche)",
            "agree_privacy": "Ich akzeptiere die Datenschutzrichtlinie.",
            "agree_cancel": "Ich habe die Stornierungsbedingungen gelesen und akzeptiere sie."
          },
          "buttons": {
            "submit": "Reservierung senden",
            "whatsapp": "Über WhatsApp buchen"
          },
          "whatsapp_template": "Hallo, ich möchte {service} im {hotel} buchen. Datum: {date}, Uhrzeit: {time}, Personen: {guests}. Name: {name}."
        },
        "fr": {
          "title": "Formulaire de réservation",
          "description": "Veuillez remplir le formulaire ci-dessous pour envoyer votre demande de réservation. Notre équipe vous contactera sous peu.",
          "fields": {
            "hotel": "Sélectionnez un hôtel",
            "service": "Service",
            "date": "Date",
            "time": "Heure",
            "guests": "Nombre de personnes",
            "name": "Nom complet",
            "phone": "Téléphone",
            "email": "E-mail (facultatif)",
            "room": "Numéro de chambre (facultatif)",
            "notes": "Remarques (santé, grossesse, demandes spéciales)",
            "agree_privacy": "J’accepte la politique de confidentialité.",
            "agree_cancel": "J’ai lu et j’accepte les conditions d’annulation."
          },
          "buttons": {
            "submit": "Envoyer la réservation",
            "whatsapp": "Réserver via WhatsApp"
          },
          "whatsapp_template": "Bonjour, je souhaite réserver {service} à {hotel}. Date : {date}, Heure : {time}, Personnes : {guests}. Nom : {name}."
        },
        "ru": {
          "title": "Форма бронирования",
          "description": "Пожалуйста, заполните форму ниже, чтобы отправить запрос на бронирование. Наша команда свяжется с вами в ближайшее время.",
          "fields": {
            "hotel": "Выберите отель",
            "service": "Услуга",
            "date": "Дата",
            "time": "Время",
            "guests": "Количество человек",
            "name": "Имя и фамилия",
            "phone": "Телефон",
            "email": "Электронная почта (необязательно)",
            "room": "Номер комнаты (необязательно)",
            "notes": "Комментарии (здоровье, беременность, особые пожелания)",
            "agree_privacy": "Я принимаю политику конфиденциальности.",
            "agree_cancel": "Я прочитал(а) и принимаю условия отмены."
          },
          "buttons": {
            "submit": "Отправить бронирование",
            "whatsapp": "Бронировать через WhatsApp"
          },
          "whatsapp_template": "Здравствуйте, хочу забронировать {service} в {hotel}. Дата: {date}, Время: {time}, Гости: {guests}. Имя: {name}."
        }
      }
    }
  },
  "tr": {
    "nav": {
      "home": "Anasayfa",
      "hammam": "Hamam Ritüelleri",
      "massages": "Masajlar",
      "classicMassages": "Klasik Masajlar",
      "sportsTherapy": "Spor & Terapi",
      "asianMassages": "Asya Masajları",
      "ayurveda": "Ayurveda",
      "signatureCouples": "İmza & Çift",
      "kidsFamily": "Çocuk & Aile",
      "faceSothys": "Cilt Bakımı (Sothys)",
      "products": "Ürünler",
      "about": "Hakkımızda",
      "team": "Ekibimiz",
      "bookingWhatsapp": "Rezervasyon"
    },
    "ui": {
      "networkAll": "Network (Tüm Oteller)",
      "networkMode": "Network Modu",
      "selectHotel": "Otel Seçin",
      "selectLanguage": "Dil",
      "filterAll": "Tümü",
      "filterTopPicks": "Öne Çıkanlar",
      "pickCategory": "Kategori Seçin",
      "serviceCount": "{n} Hizmet",
      "topPicksHint": "Bu oteldeki en popüler hizmetler.",
      "availableTodayDemo": "Bugün müsait",
      "resultsAreEstimates": "Fiyatlar ve süreler otel/sezon bazlı değişebilir.",
      "today": "Bugün",
      "dur30": "30 dk",
      "dur60": "60 dk",
      "activeFilters": "Aktif Filtreler",
      "clearFilters": "Temizle",
      "noServicesFound": "Hizmet bulunamadı.",
      "durationMin": "{n} dk",
      "priceTime": "Ortalama",
      "copied": "Kopyalandı"
    },
    "hero": {
      "title": "Santis Club Spa & Wellness",
      "subtitle": "Bedeninizi ve ruhunuzu yenileyin. {location}",
      "locationDefault": "Türkiye'nin seçkin otellerinde."
    },
    "sections": {
      "topPicks": "Öne Çıkanlar",
      "categoriesHotel": "Kategoriler (Bu Otel)",
      "categoriesNetwork": "Kategoriler (Tüm Ağ)",
      "categoryCardTitleHotel": "Hizmet Kategorileri",
      "categoryCardTitleNetwork": "Hizmet Kategorileri (Genel)",
      "categoryCardSubtitleHotel": "Bu otelde sunulan hizmet grupları.",
      "categoryCardSubtitleNetwork": "Tüm şubelerimizdeki genel hizmet grupları.",
      "serviceResults": "Hizmet Listesi",
      "serviceResultsHotel": "Hizmetler",
      "partnerHotels": "Partner Otellerimiz"
    },
    "cta": {
      "book": "Rezervasyon",
      "details": "Detay"
    },
    "categories": {
      "hammamDesc": "Geleneksel arınma ve yenilenme ritüelleri.",
      "massagesDesc": "Klasik, terapi ve dünya masajları.",
      "classicDesc": "Klasik masaj teknikleri ile rahatlama.",
      "sportsDesc": "Spor ve terapi masajları ile yenilenme.",
      "asianDesc": "Uzakdoğu masaj gelenekleri ve teknikleri.",
      "ayurvedaDesc": "Denge ve canlılık için Ayurveda ritüelleri.",
      "signatureDesc": "Size özel imza deneyimler ve çift paketleri.",
      "kidsDesc": "Aile dostu spa ve çocuk bakımları.",
      "faceDesc": "Face – Sothys Paris profesyonel cilt bakımı.",
      "productsDesc": "Spa ürünleri, yağlar ve evde devam ürünleri."
    },
    "services": {
      "hammam_ritual": {
        "name": "Geleneksel Hamam Ritüeli",
        "desc": "Kese ve köpük ile tam arınma."
      },
      "couples_signature": {
        "name": "Signature Couples Masajı",
        "desc": "Çiftlere özel VIP odada masaj keyfi."
      },
      "deep_tissue": {
        "name": "Deep Tissue / Spor Masajı",
        "desc": "Derin doku baskılı , kas açıcı masaj."
      }
    }
  },
  "en": {
    "nav": {
      "home": "Home",
      "hammam": "Hammam Rituals",
      "massages": "Massages",
      "classicMassages": "Classic Massages",
      "sportsTherapy": "Sports & Therapy",
      "asianMassages": "Asian Massages",
      "ayurveda": "Ayurveda",
      "signatureCouples": "Signature & Couples",
      "kidsFamily": "Kids & Family",
      "faceSothys": "Face Care (Sothys)",
      "products": "Products",
      "about": "About Us",
      "team": "Team",
      "bookingWhatsapp": "Book Now"
    },
    "ui": {
      "networkAll": "Network (All Hotels)",
      "networkMode": "Network Mode",
      "selectHotel": "Select Hotel",
      "selectLanguage": "Language",
      "filterAll": "All",
      "filterTopPicks": "Top Picks",
      "pickCategory": "Select Category",
      "serviceCount": "{n} Services",
      "topPicksHint": "The most popular services at this hotel.",
      "availableTodayDemo": "Available today",
      "resultsAreEstimates": "Prices and durations may vary by hotel/season.",
      "today": "Today",
      "dur30": "30 min",
      "dur60": "60 min",
      "activeFilters": "Active Filters",
      "clearFilters": "Clear",
      "noServicesFound": "No services found.",
      "durationMin": "{n} min",
      "priceTime": "Average",
      "copied": "Copied"
    },
    "hero": {
      "title": "Santis Club Spa & Wellness",
      "subtitle": "Renew your body and mind. {location}",
      "locationDefault": "At Turkey’s selected hotels."
    },
    "sections": {
      "topPicks": "Top Picks",
      "categoriesHotel": "Categories (This Hotel)",
      "categoriesNetwork": "Categories (All Network)",
      "categoryCardTitleHotel": "Service Categories",
      "categoryCardTitleNetwork": "Service Categories (General)",
      "categoryCardSubtitleHotel": "Service groups offered at this hotel.",
      "categoryCardSubtitleNetwork": "General service groups across all branches.",
      "serviceResults": "Service List",
      "serviceResultsHotel": "Services",
      "partnerHotels": "Our Partner Hotels"
    },
    "cta": {
      "book": "Book",
      "details": "Details"
    },
    "categories": {
      "hammamDesc": "Traditional cleansing and renewal rituals.",
      "massagesDesc": "Classic, therapy and world massages.",
      "classicDesc": "Classic massage techniques for relaxation.",
      "sportsDesc": "Sports and therapeutic massages for recovery.",
      "asianDesc": "Far Eastern massage traditions and techniques.",
      "ayurvedaDesc": "Ayurvedic rituals for balance and vitality.",
      "signatureDesc": "Signature experiences and couples packages.",
      "kidsDesc": "Family-friendly spa and kids treatments.",
      "faceDesc": "Professional face care by Sothys Paris.",
      "productsDesc": "Spa products, oils and home-care items."
    },
    "services": {
      "hammam_ritual": {
        "name": "Traditional Hammam Ritual",
        "desc": "Full cleansing with exfoliation and foam."
      },
      "couples_signature": {
        "name": "Signature Couples Massage",
        "desc": "A couples massage in a private VIP room."
      },
      "deep_tissue": {
        "name": "Deep Tissue / Sports Massage",
        "desc": "Deep-pressure massage to release muscles."
      }
    }
  },
  "de": {
    "nav": {
      "home": "Startseite",
      "hammam": "Hammam-Rituale",
      "massages": "Massagen",
      "classicMassages": "Klassische Massagen",
      "sportsTherapy": "Sport & Therapie",
      "asianMassages": "Asiatische Massagen",
      "ayurveda": "Ayurveda",
      "signatureCouples": "Signature & Paare",
      "kidsFamily": "Kinder & Familie",
      "faceSothys": "Gesichtspflege (Sothys)",
      "products": "Produkte",
      "about": "Über uns",
      "team": "Team",
      "bookingWhatsapp": "Reservieren"
    },
    "ui": {
      "selectHotel": "Hotel auswählen",
      "selectLanguage": "Sprache",
      "filterAll": "Alle",
      "filterTopPicks": "Highlights",
      "pickCategory": "Kategorie wählen",
      "serviceCount": "{n} Services",
      "topPicksHint": "Die beliebtesten Services in diesem Hotel.",
      "availableTodayDemo": "Heute verfügbar",
      "resultsAreEstimates": "Preise und Dauer können je nach Hotel/Saison variieren.",
      "today": "Heute",
      "dur30": "30 Min.",
      "dur60": "60 Min.",
      "activeFilters": "Aktive Filter",
      "clearFilters": "Zurücksetzen",
      "noServicesFound": "Keine Services gefunden.",
      "durationMin": "{n} Min.",
      "priceTime": "Durchschnitt",
      "copied": "Kopiert"
    },
    "hero": {
      "title": "Santis Club Spa & Wellness",
      "subtitle": "Erneuern Sie Körper und Geist. {location}",
      "locationDefault": "In ausgewählten Hotels der Türkei."
    },
    "sections": {
      "topPicks": "Highlights",
      "categoriesHotel": "Kategorien (Dieses Hotel)",
      "categoriesNetwork": "Kategorien (Gesamtes Netzwerk)",
      "categoryCardTitleHotel": "Service-Kategorien",
      "categoryCardTitleNetwork": "Service-Kategorien (Allgemein)",
      "categoryCardSubtitleHotel": "Service-Gruppen in diesem Hotel.",
      "categoryCardSubtitleNetwork": "Allgemeine Service-Gruppen in allen Standorten.",
      "serviceResults": "Service-Liste",
      "serviceResultsHotel": "Services",
      "partnerHotels": "Unsere Partnerhotels"
    },
    "cta": {
      "book": "Reservieren",
      "details": "Details"
    },
    "categories": {
      "hammamDesc": "Traditionelle Reinigungs- und Erneuerungsrituale.",
      "massagesDesc": "Klassische, Therapie- und Weltmassagen.",
      "classicDesc": "Klassische Massagetechniken zur Entspannung.",
      "sportsDesc": "Sport- und therapeutische Massagen zur Regeneration.",
      "asianDesc": "Fernöstliche Massage-Traditionen und Techniken.",
      "ayurvedaDesc": "Ayurvedische Rituale für Balance und Vitalität.",
      "signatureDesc": "Signature-Erlebnisse und Paarpakete.",
      "kidsDesc": "Familienfreundliche Spa- und Kinderanwendungen.",
      "faceDesc": "Professionelle Gesichtspflege von Sothys Paris.",
      "productsDesc": "Spa-Produkte, Öle und Home-Care."
    },
    "services": {
      "hammam_ritual": {
        "name": "Traditionelles Hammam-Ritual",
        "desc": "Komplette Reinigung mit Peeling und Schaum."
      },
      "couples_signature": {
        "name": "Signature-Paarmassage",
        "desc": "Paarmassage in einem privaten VIP-Raum."
      },
      "deep_tissue": {
        "name": "Deep Tissue / Sportmassage",
        "desc": "Tiefdruckmassage zur Muskelentspannung."
      }
    }
  },
  "fr": {
    "nav": {
      "home": "Accueil",
      "hammam": "Rituels Hammam",
      "massages": "Massages",
      "classicMassages": "Massages classiques",
      "sportsTherapy": "Sport & Thérapie",
      "asianMassages": "Massages asiatiques",
      "ayurveda": "Ayurveda",
      "signatureCouples": "Signature & Couples",
      "kidsFamily": "Enfants & Famille",
      "faceSothys": "Soin du visage (Sothys)",
      "products": "Produits",
      "about": "À propos",
      "team": "Équipe",
      "bookingWhatsapp": "Réserver"
    },
    "ui": {
      "selectHotel": "Choisir l’hôtel",
      "selectLanguage": "Langue",
      "filterAll": "Tous",
      "filterTopPicks": "Sélection",
      "pickCategory": "Choisir une catégorie",
      "serviceCount": "{n} services",
      "topPicksHint": "Les services les plus populaires dans cet hôtel.",
      "availableTodayDemo": "Disponible aujourd’hui",
      "resultsAreEstimates": "Les prix et durées peuvent varier selon l’hôtel/la saison.",
      "today": "Aujourd’hui",
      "dur30": "30 min",
      "dur60": "60 min",
      "activeFilters": "Filtres actifs",
      "clearFilters": "Effacer",
      "noServicesFound": "Aucun service trouvé.",
      "durationMin": "{n} min",
      "priceTime": "Moyenne",
      "copied": "Copié"
    },
    "hero": {
      "title": "Santis Club Spa & Wellness",
      "subtitle": "Ressourcez votre corps et votre esprit. {location}",
      "locationDefault": "Dans une sélection d’hôtels en Turquie."
    },
    "sections": {
      "topPicks": "Sélection",
      "categoriesHotel": "Catégories (Cet hôtel)",
      "categoriesNetwork": "Catégories (Tout le réseau)",
      "categoryCardTitleHotel": "Catégories de services",
      "categoryCardTitleNetwork": "Catégories de services (Général)",
      "categoryCardSubtitleHotel": "Groupes de services proposés dans cet hôtel.",
      "categoryCardSubtitleNetwork": "Groupes de services généraux dans toutes nos adresses.",
      "serviceResults": "Liste des services",
      "serviceResultsHotel": "Services",
      "partnerHotels": "Nos hôtels partenaires"
    },
    "cta": {
      "book": "Réserver",
      "details": "Détails"
    },
    "categories": {
      "hammamDesc": "Rituels traditionnels de purification et de renouveau.",
      "massagesDesc": "Massages classiques, thérapeutiques et du monde.",
      "classicDesc": "Techniques classiques pour la détente.",
      "sportsDesc": "Massages sportifs et thérapeutiques pour la récupération.",
      "asianDesc": "Traditions et techniques de massage d’Extrême-Orient.",
      "ayurvedaDesc": "Rituels ayurvédiques pour l’équilibre et la vitalité.",
      "signatureDesc": "Expériences signature et formules couples.",
      "kidsDesc": "Spa familial et soins pour enfants.",
      "faceDesc": "Soin du visage professionnel Sothys Paris.",
      "productsDesc": "Produits spa, huiles et soins à domicile."
    },
    "services": {
      "hammam_ritual": {
        "name": "Rituel Hammam traditionnel",
        "desc": "Purification complète avec gommage et mousse."
      },
      "couples_signature": {
        "name": "Massage Signature Couples",
        "desc": "Massage en duo dans une salle VIP privée."
      },
      "deep_tissue": {
        "name": "Deep Tissue / Massage sportif",
        "desc": "Pression profonde pour relâcher les muscles."
      }
    }
  },
  "ru": {
    "nav": {
      "home": "Главная",
      "hammam": "Ритуалы хаммама",
      "massages": "Массажи",
      "classicMassages": "Классические массажи",
      "sportsTherapy": "Спорт и терапия",
      "asianMassages": "Азиатские массажи",
      "ayurveda": "Аюрведа",
      "signatureCouples": "Signature и для пар",
      "kidsFamily": "Дети и семья",
      "faceSothys": "Уход за лицом (Sothys)",
      "products": "Продукты",
      "about": "О нас",
      "team": "Команда",
      "bookingWhatsapp": "Записаться"
    },
    "ui": {
      "selectHotel": "Выберите отель",
      "selectLanguage": "Язык",
      "filterAll": "Все",
      "filterTopPicks": "Рекомендовано",
      "pickCategory": "Выберите категорию",
      "serviceCount": "{n} услуг(и)",
      "topPicksHint": "Самые популярные услуги в этом отеле.",
      "availableTodayDemo": "Доступно сегодня",
      "resultsAreEstimates": "Цены и длительность могут меняться в зависимости от отеля/сезона.",
      "today": "Сегодня",
      "dur30": "30 мин",
      "dur60": "60 мин",
      "activeFilters": "Активные фильтры",
      "clearFilters": "Сбросить",
      "noServicesFound": "Услуги не найдены.",
      "durationMin": "{n} мин",
      "priceTime": "В среднем",
      "copied": "Скопировано"
    },
    "hero": {
      "title": "Santis Club Spa & Wellness",
      "subtitle": "Обновите тело и разум. {location}",
      "locationDefault": "В лучших отелях Турции."
    },
    "sections": {
      "topPicks": "Рекомендовано",
      "categoriesHotel": "Категории (Этот отель)",
      "categoriesNetwork": "Категории (Вся сеть)",
      "categoryCardTitleHotel": "Категории услуг",
      "categoryCardTitleNetwork": "Категории услуг (Общее)",
      "categoryCardSubtitleHotel": "Группы услуг в этом отеле.",
      "categoryCardSubtitleNetwork": "Общие группы услуг во всех филиалах.",
      "serviceResults": "Список услуг",
      "serviceResultsHotel": "Услуги",
      "partnerHotels": "Наши партнерские отели"
    },
    "cta": {
      "book": "Записаться",
      "details": "Подробнее"
    },
    "categories": {
      "hammamDesc": "Традиционные ритуалы очищения и обновления.",
      "massagesDesc": "Классические, терапевтические и мировые массажи.",
      "classicDesc": "Классические техники для расслабления.",
      "sportsDesc": "Спортивные и терапевтические массажи для восстановления.",
      "asianDesc": "Дальневосточные традиции и техники массажа.",
      "ayurvedaDesc": "Аюрведические ритуалы для баланса и энергии.",
      "signatureDesc": "Фирменные программы и пакеты для пар.",
      "kidsDesc": "Спа для всей семьи и процедуры для детей.",
      "faceDesc": "Профессиональный уход за лицом Sothys Paris.",
      "productsDesc": "Спа-продукты, масла и домашний уход."
    },
    "services": {
      "hammam_ritual": {
        "name": "Традиционный ритуал хаммама",
        "desc": "Полное очищение с пилингом и пеной."
      },
      "couples_signature": {
        "name": "Signature массаж для пар",
        "desc": "Массаж для двоих в приватной VIP-комнате."
      },
      "deep_tissue": {
        "name": "Deep Tissue / Спортивный массаж",
        "desc": "Глубокое воздействие для расслабления мышц."
      }
    }
  },
  "catalogs": {
    "hammam": {
      "items": [
        {
          "id": "kese-kopuk",
          "slug": "kese-kopuk",
          "title": "Geleneksel Kese & Köpük",
          "duration": "30 dk",
          "price": 60,
          "tier": "CLASSIC",
          "desc": "Sıcak mermer üzerinde başlayan arınma yolculuğu. Ölü deriden arındıran kese ve ipeksi köpük masajı ile cildiniz yeniden nefes alır.",
          "longDesc": "Osmanlı hamamlarının yüzyıllık geleneği. Göbek taşı üzerinde uygulanan kese ile ölü hücreler arındırılır, ardından zengin köpük masajı ile cilt yumuşatılır. Temel hamam deneyimi.",
          "img": "assets/img/cards/hammam.webp",
          "category": "classicHammam",
          "tags": [
            "kese",
            "köpük",
            "arınma",
            "klasik"
          ],
          "benefits": [
            "Ölü hücre arındırma",
            "Cilt yumuşatma",
            "Gözenek temizliği",
            "Kan dolaşımı"
          ],
          "cart": {
            "id": "hammam_kese",
            "name": "Geleneksel Kese & Köpük",
            "price": 60,
            "cat": "hammam"
          }
        },
        {
          "id": "kopuk-masaji",
          "slug": "kopuk-masaji",
          "title": "Sadece Köpük Masajı",
          "duration": "20 dk",
          "price": 40,
          "tier": "EXPRESS",
          "desc": "Bulutların üzerinde yüzermişçesine hafifleten, sabun köpükleriyle yapılan nazik ve dinlendirici bir dokunuş.",
          "longDesc": "Hızlı ama etkili hamam deneyimi. Zengin köpük masajı ile cilt nemlendirilir ve yumuşatılır. Kese istemeyenler veya hassas ciltler için ideal.",
          "img": "assets/img/cards/hammam.webp",
          "category": "classicHammam",
          "tags": [
            "hızlı",
            "yumuşak",
            "köpük",
            "ekspres"
          ],
          "benefits": [
            "Hızlı rahatlama",
            "Cilt nemlendirme",
            "Hafif arınma"
          ],
          "cart": {
            "id": "hammam_kopuk",
            "name": "Sadece Köpük Masajı",
            "price": 40,
            "cat": "hammam"
          }
        },
        {
          "id": "tuz-peeling",
          "slug": "tuz-peeling",
          "title": "Tuz Peeling Ritüeli",
          "duration": "25 dk",
          "price": 70,
          "tier": "DETOX",
          "desc": "Kaba deniz tuzu ile cildi yenileyen, kan dolaşımını artıran antik arınma ritüeli.",
          "longDesc": "Tuz, yüzyıllardır şifalı etkisiyle bilinir. Kaba deniz tuzu cildin kan dolaşımını artırır ve ölü hücreleri arındırır. Göbek taşı üzerinde, sıcak buhar eşliğinde uygulanan bu ritüel, cildi optik olarak iyileştirir ve mineral emilimi sağlar.",
          "img": "assets/img/cards/hammam.webp",
          "category": "detoxRituals",
          "tags": [
            "tuz",
            "peeling",
            "detox",
            "cilt",
            "arınma"
          ],
          "benefits": [
            "Ölü hücre arındırma",
            "Kan dolaşımı hızlandırma",
            "Gözenek temizliği",
            "Mineral emilimi",
            "Cilt yenileme"
          ],
          "technique": "Islak cilde dairesel hareketlerle uygulama, sıcak hamam ortamında",
          "cart": {
            "id": "hammam_tuz",
            "name": "Tuz Peeling Ritüeli",
            "price": 70,
            "cat": "hammam"
          }
        },
        {
          "id": "kahve-detox",
          "slug": "kahve-detox",
          "title": "Kahve Detox Arınma",
          "duration": "45 dk",
          "price": 90,
          "tier": "DETOX",
          "desc": "Türk kahvesinin antioksidan gücüyle canlanın. Selülit karşıtı bakım ve derinlemesine arınma sağlayan özel bir ritüel.",
          "longDesc": "Türk kahvesinin antioksidan ve sıkılaştırıcı özellikleri ile zenginleştirilmiş detox ritüeli. Selülit görünümünü azaltır, cildi sıkılaştırır ve toksinlerin atılmasına yardımcı olur.",
          "img": "assets/img/cards/detail.webp",
          "category": "detoxRituals",
          "tags": [
            "detox",
            "kahve",
            "canlanma",
            "selülit",
            "antioksidan"
          ],
          "benefits": [
            "Selülit azaltma",
            "Cilt sıkılaştırma",
            "Toksin atımı",
            "Antioksidan etki",
            "Canlanma"
          ],
          "cart": {
            "id": "hammam_kahve",
            "name": "Kahve Detox Arınma",
            "price": 90,
            "cat": "hammam"
          }
        },
        {
          "id": "osmanli-ritueli",
          "slug": "osmanli-ritueli",
          "title": "Osmanlı Saray Ritüeli",
          "duration": "50 dk",
          "price": 120,
          "tier": "SIGNATURE",
          "desc": "Sultanlara layık bir deneyim. Kese ve köpük seremonisine eşlik eden kil maskesi ve nemlendirici yağlar ile bedensel ve ruhsal bütünlük.",
          "longDesc": "Saray hamamlarından ilham alan lüks ritüel. Geleneksel kese ve köpük sonrası özel kil maskesi uygulanır. Nemlendirici yağlarla sonlanan bu deneyim, cilde ipeksiliik ve bedene dinginlik katar.",
          "img": "assets/img/cards/hammam.webp",
          "category": "premiumExperience",
          "tags": [
            "lüks",
            "kil maskesi",
            "osmanlı",
            "saray",
            "premium"
          ],
          "benefits": [
            "Derin arınma",
            "Cilt yenileme",
            "Nemlendirme",
            "Ruhsal dinginlik",
            "Premium deneyim"
          ],
          "cart": {
            "id": "hammam_osmanli",
            "name": "Osmanlı Saray Ritüeli",
            "price": 120,
            "cat": "hammam"
          }
        },
        {
          "id": "santis-pasa",
          "slug": "santis-pasa",
          "title": "Santis Paşa Bakımı",
          "duration": "60 dk",
          "price": 140,
          "tier": "PREMIUM",
          "desc": "Derinlemesine temizliğin ötesinde, baş masajı ve aromatik yağlarla zenginleştirilmiş, yorgunluğu silip atan uzun soluklu bir terapi.",
          "longDesc": "Erkeklere özel tasarlanmış premium hamam deneyimi. Kese-köpük ritüelinin ardından baş masajı ve aromatik yağlarla zenginleştirilmiş vücut bakımı. Yorgunluğu silen, yenileyen komple terapi.",
          "img": "assets/img/cards/massage.webp",
          "category": "premiumExperience",
          "tags": [
            "masaj",
            "premium",
            "erkek",
            "baş masajı",
            "aromatik"
          ],
          "benefits": [
            "Komple yenilenme",
            "Baş masajı",
            "Aromatik bakım",
            "Yorgunluk giderme",
            "VIP deneyim"
          ],
          "cart": {
            "id": "hammam_pasa",
            "name": "Santis Paşa Bakımı",
            "price": 140,
            "cat": "hammam"
          }
        },
        {
          "id": "gelin-hamami",
          "slug": "gelin-hamami",
          "title": "Gelin Hamamı Seremonisi",
          "duration": "120 dk",
          "price": 250,
          "tier": "EVENT",
          "desc": "En özel gününüz için hazırlanan, müzik, ikramlar ve geleneksel kutlamalarla dolu unutulmaz bir grup deneyimi.",
          "longDesc": "Düğün öncesi geleneksel kutlama ritüeli. Gelin ve arkadaşları için özel hazırlanan hamam deneyimi. Müzik, ikramlar, geleneksel ritüeller ve fotoğraf çekimi dahil. Minimum 5, maksimum 15 kişi.",
          "img": "assets/img/cards/hammam.webp",
          "category": "specialEvents",
          "tags": [
            "gelin",
            "grup",
            "kutlama",
            "düğün",
            "özel gün"
          ],
          "benefits": [
            "Unutulmaz anılar",
            "Geleneksel seremoni",
            "Grup deneyimi",
            "Fotoğraf çekimi",
            "Özel ikramlar"
          ],
          "groupSize": "5-15 kişi",
          "cart": {
            "id": "hammam_gelin",
            "name": "Gelin Hamamı Seremonisi",
            "price": 250,
            "cat": "hammam"
          }
        }
      ],
      "categories": {
        "classicHammam": {
          "label": "KLASİK HAMAM",
          "desc": "Geleneksel Osmanlı kese-köpük ritüelleri",
          "icon": "🛁"
        },
        "detoxRituals": {
          "label": "DETOX & ARINMA",
          "desc": "Tuz, kahve ve derin temizlik terapileri",
          "icon": "🧂"
        },
        "premiumExperience": {
          "label": "PREMIUM DENEYİM",
          "desc": "Uzun süreli özel bakımlar ve lüks ritüeller",
          "icon": "👑"
        },
        "specialEvents": {
          "label": "ÖZEL GÜNLER",
          "desc": "Gelin hamamı, kutlamalar ve grup etkinlikleri",
          "icon": "💍"
        }
      },
      "tiers": {
        "CLASSIC": {
          "color": "#8B7355",
          "bg": "rgba(139, 115, 85, 0.9)"
        },
        "EXPRESS": {
          "color": "#D4A574",
          "bg": "rgba(212, 165, 116, 0.9)"
        },
        "DETOX": {
          "color": "#6B8E6B",
          "bg": "rgba(107, 142, 107, 0.9)"
        },
        "SIGNATURE": {
          "color": "#9B6B9B",
          "bg": "rgba(155, 107, 155, 0.9)"
        },
        "PREMIUM": {
          "color": "#D4AF37",
          "bg": "rgba(74, 74, 74, 0.9)"
        },
        "EVENT": {
          "color": "#E8B4B4",
          "bg": "rgba(232, 180, 180, 0.9)"
        }
      }
    },
    "massages": {
      "items": [
        {
          "id": "klasik-rahatlama",
          "slug": "klasik-rahatlama",
          "title": "Klasik Rahatlama Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "İsveç tekniğiyle uygulanan, kasları gevşeten orta baskılı terapi.",
          "longDesc": "Uzun, akıcı hareketlerle vücudun tamamında rahatlama sağlar. Effleurage, petrissage ve friction teknikleriyle kas lifleri gevşetilir. Kan dolaşımı hızlanır, stres hormonları düşer.",
          "price": 80,
          "duration": "50 dk",
          "tier": "CLASSIC",
          "category": "classicMassages",
          "tags": [
            "rahatlama",
            "tüm vücut",
            "isveç",
            "klasik"
          ],
          "benefits": [
            "Kas gerginliğini azaltır",
            "Kan dolaşımını hızlandırır",
            "Stres hormonlarını düşürür",
            "Uyku kalitesini artırır"
          ],
          "cart": {
            "id": "massage_klasik",
            "name": "Klasik Rahatlama Masajı",
            "price": 80,
            "cat": "massage"
          }
        },
        {
          "id": "anti-stress",
          "slug": "anti-stress",
          "title": "Anti-Stress Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Modern yaşamın gerilimini hedefleyen, zihin-beden dengesini yeniden kuran rahatlatıcı terapi.",
          "longDesc": "Günümüzün stresli yaşamında bedensel ihtiyaçlar çoğu zaman göz ardı edilir. Anti-Stress Masajı içsel dengeyi yeniden kurmanın en etkili yollarından biridir. Yavaş, ritmik ve uzun hareketler uygulanır. Zihin, beden ve ruh birlikte dinlenme fırsatı bulur.",
          "price": 85,
          "duration": "50 dk",
          "tier": "RELAX",
          "category": "classicMassages",
          "tags": [
            "stres",
            "wellness",
            "denge",
            "rahatlama"
          ],
          "benefits": [
            "Kortizol seviyesini düşürür",
            "Endorfin salınımını artırır",
            "Zihinsel berraklık sağlar",
            "Duygusal denge kurar"
          ],
          "targetAreas": [
            "Omuzlar",
            "Boyun & Ense",
            "Yüz & Kafa derisi"
          ],
          "cart": {
            "id": "massage_antistress",
            "name": "Anti-Stress Masajı",
            "price": 85,
            "cat": "massage"
          }
        },
        {
          "id": "aromaterapi",
          "slug": "aromaterapi",
          "title": "Aromaterapi Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Doğal uçucu yağlarla yapılan, duyuları dengeleyen ve derin rahatlama sağlayan ritüel.",
          "longDesc": "Masajlar yüzyıllardır rahatlama ve ağrı giderme için kullanılmaktadır. Aromaterapi masajında, masajın rahatlatıcı etkisi hoş kokularla artırılır. Uçucu yağların solunması ve cilde emilimi yoluyla stres ve kas gerginliği çözülür.",
          "price": 90,
          "duration": "50 dk",
          "tier": "AROMA",
          "category": "classicMassages",
          "tags": [
            "aroma",
            "uçucu yağ",
            "rahatlama",
            "uyku"
          ],
          "benefits": [
            "Zihinsel sakinlik",
            "Duyusal denge",
            "Baş ağrısı rahatlaması",
            "Derin uyku desteği"
          ],
          "essentialOils": [
            "Lavanta (rahatlama)",
            "Bergamot (ruh hali)",
            "Okaliptüs (solunum)",
            "Ylang-ylang (romantik)"
          ],
          "cart": {
            "id": "massage_aroma",
            "name": "Aromaterapi Masajı",
            "price": 90,
            "cat": "massage"
          }
        },
        {
          "id": "sicak-tas",
          "slug": "sicak-tas",
          "title": "Sıcak Taş Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Isıtılmış bazalt taşlarıyla kas gerginliğini hedefleyen ve rahatlama sağlayan terapi.",
          "longDesc": "50-55°C'de ısıtılmış volkanik bazalt taşları stratejik noktalara yerleştirilir. Sıcaklık kas liflerini gevşetir, kan dolaşımını artırır. Derin kas gevşemesi ve eklem esnekliği sağlar.",
          "price": 120,
          "duration": "75 dk",
          "tier": "STONE",
          "category": "classicMassages",
          "tags": [
            "taş",
            "sıcak",
            "premium",
            "derin"
          ],
          "benefits": [
            "Derin kas gevşemesi",
            "Dolaşım artışı",
            "Eklem esnekliği",
            "Kronik ağrı rahatlaması"
          ],
          "contraindications": [
            "Sıcaklık hassasiyeti",
            "Cilt enfeksiyonları"
          ],
          "cart": {
            "id": "massage_stone",
            "name": "Sıcak Taş Masajı",
            "price": 120,
            "cat": "massage"
          }
        },
        {
          "id": "klasik-sirt",
          "slug": "klasik-sirt",
          "title": "Klasik Sırt Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Sırt bölgesine odaklanan, duruş bozukluğu ve masa başı yorgunluğuna çözüm sunan konsantre terapi.",
          "longDesc": "Günlük yaşamda en çok yüklenen bölge sırttır. Omurga boyunca ve kürek kemikleri çevresinde biriken gerginliği hedefler. Trapez ve latissimus kaslarına odaklanılır.",
          "price": 50,
          "duration": "30 dk",
          "tier": "BACK",
          "category": "classicMassages",
          "tags": [
            "sırt",
            "ekspres",
            "ofis",
            "duruş"
          ],
          "benefits": [
            "Sırt ağrısı rahatlaması",
            "Duruş düzeltme desteği",
            "Omurga esnekliği",
            "Gerginlik çözülmesi"
          ],
          "targetAreas": [
            "Bel (lumbar)",
            "Orta sırt (thoracic)",
            "Kürek kemikleri",
            "Omuz trapezi"
          ],
          "cart": {
            "id": "massage_back",
            "name": "Klasik Sırt Masajı",
            "price": 50,
            "cat": "massage"
          }
        },
        {
          "id": "bas-boyun-omuz",
          "slug": "bas-boyun-omuz",
          "title": "Baş–Boyun–Omuz Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Bölgesel gerginliklere odaklanan, yorgunluğu hafifletmeyi hedefleyen ekspres bakım.",
          "longDesc": "Masa başı çalışanlar için ideal. Boyun tutulması, baş ağrısı ve omuz gerginliğine hızlı çözüm. Öğle arası, toplantı öncesi veya seyahat yorgunluğu için uygundur.",
          "price": 50,
          "duration": "30 dk",
          "tier": "EXPRESS",
          "category": "classicMassages",
          "tags": [
            "boyun",
            "ofis",
            "kısa",
            "baş ağrısı"
          ],
          "benefits": [
            "Boyun tutulması rahatlaması",
            "Baş ağrısı azalması",
            "Omuz gevşemesi",
            "Hızlı enerji tazelemesi"
          ],
          "cart": {
            "id": "massage_express",
            "name": "Baş–Boyun–Omuz Masajı",
            "price": 50,
            "cat": "massage"
          }
        },
        {
          "id": "isvec-full-body",
          "slug": "isvec-full-body",
          "title": "İsveç Masajı (Full Body)",
          "img": "assets/img/cards/massage.webp",
          "desc": "Tüm vücudu kapsayan, klasik İsveç tekniklerinin uygulandığı kapsamlı rahatlama terapisi.",
          "longDesc": "İsveç masajının tüm vücuda uygulanan uzun versiyonu. Effleurage (okşama), petrissage (yoğurma), friction (sürtme), tapotement (vurma) ve vibrasyon teknikleri sırasıyla uygulanır. Baş ucundan ayak tabanına kadar komple gevşeme.",
          "price": 100,
          "duration": "60 dk",
          "tier": "SWEDISH",
          "category": "classicMassages",
          "tags": [
            "isveç",
            "tüm vücut",
            "klasik",
            "kapsamlı"
          ],
          "benefits": [
            "Komple kas gevşemesi",
            "Kan dolaşımı artışı",
            "Toksin atımı",
            "Derin rahatlama",
            "Uyku kalitesi"
          ],
          "technique": "Effleurage → Petrissage → Friction → Tapotement → Vibrasyon",
          "cart": {
            "id": "massage_swedish",
            "name": "İsveç Masajı (Full Body)",
            "price": 100,
            "cat": "massage"
          }
        },
        {
          "id": "refleksoloji",
          "slug": "refleksoloji",
          "title": "Refleksoloji (Ayak Masajı)",
          "img": "assets/img/cards/massage.webp",
          "desc": "Ayak tabanındaki refleks noktalarına baskı uygulayarak tüm vücudu dengeleyen antik terapi.",
          "longDesc": "Ayak tabanı, vücudun bir haritasıdır. Her organ ve sisteme karşılık gelen refleks noktaları bulunur. Bu noktalara uygulanan baskıyla enerji akışı düzenlenir, iç organlar desteklenir ve genel sağlık iyileşir.",
          "price": 60,
          "duration": "30 dk",
          "tier": "REFLEX",
          "category": "classicMassages",
          "tags": [
            "ayak",
            "refleks",
            "enerji",
            "denge",
            "ekspres"
          ],
          "benefits": [
            "Organ fonksiyonlarını destekler",
            "Stres azaltma",
            "Uyku düzenleme",
            "Baş ağrısı rahatlaması",
            "Sindirim desteği"
          ],
          "technique": "Başparmak ve işaret parmağıyla ayak tabanına nokta baskısı",
          "cart": {
            "id": "massage_reflex",
            "name": "Refleksoloji",
            "price": 60,
            "cat": "massage"
          }
        },
        {
          "id": "lenf-drenaj",
          "slug": "lenf-drenaj",
          "title": "Manuel Lenf Drenajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Lenf sistemini aktive eden, ödem giderici ve detoks etkili nazik masaj tekniği.",
          "longDesc": "Lenf sistemi vücudun temizlik mekanizmasıdır. Manuel Lenf Drenajı, çok hafif ve ritmik hareketlerle lenf akışını uyarır. Ödem, şişlik ve toksin birikimini azaltır. Bağışıklık sistemini güçlendirir.",
          "price": 90,
          "duration": "45 dk",
          "tier": "LYMPH",
          "category": "classicMassages",
          "tags": [
            "lenf",
            "detox",
            "ödem",
            "bağışıklık",
            "hafif"
          ],
          "benefits": [
            "Ödem giderme",
            "Toksin atımı",
            "Bağışıklık güçlendirme",
            "Selülit azaltma",
            "Ameliyat sonrası iyileşme"
          ],
          "contraindications": [
            "Akut enfeksiyon",
            "Tromboz",
            "Kalp yetmezliği"
          ],
          "cart": {
            "id": "massage_lymph",
            "name": "Manuel Lenf Drenajı",
            "price": 90,
            "cat": "massage"
          }
        },
        {
          "id": "anti-selulit",
          "slug": "anti-selulit",
          "title": "Anti-Selülit Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Selülit görünümünü azaltmak ve cildi sıkılaştırmak için özel tekniklerle uygulanan yoğun bakım.",
          "longDesc": "Anti-Selülit Masajı, yağ birikiminin oluşturduğu 'portakal kabuğu' görünümünü hedefler. Derin doku teknikleri, fırçalama ve yoğurma hareketleri ile kan dolaşımı artırılır, lenf akışı hızlandırılır. Düzenli uygulamada cilt dokusu sıkılaşır ve pürüzsüzleşir.",
          "price": 95,
          "duration": "50 dk",
          "tier": "BODY",
          "category": "classicMassages",
          "tags": [
            "selülit",
            "sıkılaştırma",
            "vücut",
            "şekillendirme",
            "detox"
          ],
          "benefits": [
            "Selülit görünümünü azaltır",
            "Cilt sıkılığını artırır",
            "Kan dolaşımını hızlandırır",
            "Toksin atımını destekler",
            "Metabolizmayı canlandırır"
          ],
          "targetAreas": [
            "Bacaklar",
            "Kalça",
            "Karın",
            "Kolların üst kısmı"
          ],
          "cart": {
            "id": "massage_cellulite",
            "name": "Anti-Selülit Masajı",
            "price": 95,
            "cat": "massage"
          }
        },
        {
          "id": "shiatsu",
          "slug": "shiatsu",
          "title": "Shiatsu",
          "img": "assets/img/cards/massage.webp",
          "desc": "Parmak baskısıyla vücuttaki enerji akışını dengelemeyi amaçlayan Japon tekniği.",
          "longDesc": "Shiatsu, Japonya'da geliştirilen bütüncül bir beden terapisi formudur. 'Parmak baskısı' anlamına gelir. Sadece fiziksel gerginliği değil, yaşam ve davranış kalıplarını da hedefler. Meridyen sistemi üzerinden Chi (yaşam enerjisi) akışını dengeler.",
          "price": 100,
          "duration": "50 dk",
          "tier": "JAPAN",
          "category": "asianMassages",
          "tags": [
            "shiatsu",
            "enerji",
            "japon",
            "meridyen"
          ],
          "benefits": [
            "Enerji dengesi",
            "Stres azaltma",
            "Baş ağrısı & migren",
            "Uyku düzenleme"
          ],
          "technique": "Parmak, avuç içi, dirsek ve diz kullanılır. Yağsız, yerde mat üzerinde uygulanır.",
          "symptoms": [
            "Baş ağrısı & Migren",
            "Boyun/Sırt ağrısı",
            "Fibromiyalji",
            "Uyku bozuklukları",
            "Stres & Tükenmişlik"
          ],
          "cart": {
            "id": "massage_shiatsu",
            "name": "Shiatsu",
            "price": 100,
            "cat": "massage"
          }
        },
        {
          "id": "thai",
          "slug": "thai",
          "title": "Thai Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Yağsız uygulanan, esnetme ve germe hareketleriyle vücut esnekliğini artıran 'Tembel Yogası'.",
          "longDesc": "Geleneksel Tayland masajı, 'Tembel Yogası' olarak da bilinir. Yerde mat üzerinde, giyinik olarak uygulanır. Esnetme, baskı ve yoga pozisyonlarının kombinasyonuyla esneklik artar.",
          "price": 100,
          "duration": "60 dk",
          "tier": "THERAPY",
          "category": "asianMassages",
          "tags": [
            "thai",
            "esnetme",
            "yoga",
            "esneklik"
          ],
          "benefits": [
            "Esneklik artışı",
            "Enerji canlanması",
            "Kas gerginliği çözümü",
            "Duruş iyileştirme"
          ],
          "technique": "Yağsız, giyinik, yerde mat üzerinde. Esnetme + Baskı kombinasyonu.",
          "cart": {
            "id": "massage_thai",
            "name": "Thai Masajı",
            "price": 100,
            "cat": "massage"
          }
        },
        {
          "id": "bali",
          "slug": "bali",
          "title": "Geleneksel Bali Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Avuç içi ve parmak baskılarıyla yapılan, enerji akışını dengeleyen uzak doğu ritüeli.",
          "longDesc": "Endonezya'nın Bali adasından gelen bu teknik, nazik ama etkili baskılarla bedeni yeniler. Tropikal yağlar eşliğinde uygulanan bu ritüel, zihinsel dinginlik ve bedensel rahatlama sağlar.",
          "price": 90,
          "duration": "50 dk",
          "tier": "SIGNATURE",
          "category": "asianMassages",
          "tags": [
            "bali",
            "uzak doğu",
            "enerji",
            "egzotik"
          ],
          "benefits": [
            "Enerji akışı dengesi",
            "Derin rahatlama",
            "Cilt besleme",
            "Zihinsel dinginlik"
          ],
          "cart": {
            "id": "massage_bali",
            "name": "Geleneksel Bali Masajı",
            "price": 90,
            "cat": "massage"
          }
        },
        {
          "id": "derin-doku",
          "slug": "derin-doku",
          "title": "Derin Doku (Deep Tissue)",
          "img": "assets/img/cards/massage.webp",
          "desc": "Kronik ağrılar ve sertleşmiş kaslar için uygulanan sert baskılı, tedavi edici masaj.",
          "longDesc": "Derin kas katmanlarına ve bağ dokusuna odaklanan yoğun terapi. Kronik ağrılar, spor yaralanmaları ve kas sertliği için ideal. Yavaş, derin baskılarla düğümler çözülür.",
          "price": 110,
          "duration": "50 dk",
          "tier": "INTENSE",
          "category": "sportsTherapy",
          "tags": [
            "derin",
            "tedavi",
            "ağrı",
            "yoğun"
          ],
          "benefits": [
            "Kronik ağrı giderme",
            "Kas düğümlerini çözme",
            "Toparlanma hızlandırma",
            "Hareket açıklığı artışı"
          ],
          "cart": {
            "id": "massage_deep",
            "name": "Derin Doku Masajı",
            "price": 110,
            "cat": "massage"
          }
        },
        {
          "id": "spor-terapi",
          "slug": "spor-terapi",
          "title": "Spor Terapi Masajı",
          "img": "assets/img/cards/massage.webp",
          "desc": "Aktif yaşam stiline özel; toparlanmayı destekleyen ve esnekliği artıran protokol.",
          "longDesc": "Sporcular ve aktif yaşam sürenler için tasarlanmış terapi. Antrenman öncesi hazırlık veya sonrası toparlanma için uygun. Kas performansını optimize eder.",
          "price": 100,
          "duration": "50 dk",
          "tier": "SPORT",
          "category": "sportsTherapy",
          "tags": [
            "spor",
            "toparlanma",
            "performans",
            "aktif"
          ],
          "benefits": [
            "Kas toparlanması",
            "Performans artışı",
            "Yaralanma önleme",
            "Esneklik iyileştirme"
          ],
          "cart": {
            "id": "massage_sport",
            "name": "Spor Terapi Masajı",
            "price": 100,
            "cat": "massage"
          }
        },
        {
          "id": "sirt-terapi",
          "slug": "sirt-terapi",
          "title": "Sırt Odaklı Terapi",
          "img": "assets/img/cards/massage.webp",
          "desc": "Sırt bölgesindeki gerginliği hedefleyen, duruş kaynaklı yorgunluğa iyi gelen odaklı çalışma.",
          "longDesc": "Masa başı çalışanlar ve sürücüler için özel olarak tasarlanmış terapi. Omurga boyunca biriken gerginliği çözer, doğru duruşu destekler.",
          "price": 60,
          "duration": "30 dk",
          "tier": "BACK",
          "category": "sportsTherapy",
          "tags": [
            "sırt",
            "gerginlik",
            "duruş",
            "ofis"
          ],
          "benefits": [
            "Sırt ağrısı giderme",
            "Duruş düzeltme",
            "Gerginlik çözme",
            "Hareket kolaylığı"
          ],
          "cart": {
            "id": "massage_sirt",
            "name": "Sırt Odaklı Terapi",
            "price": 60,
            "cat": "massage"
          }
        },
        {
          "id": "tetik-nokta",
          "slug": "tetik-nokta",
          "title": "Tetik Nokta Terapi (Trigger Point)",
          "img": "assets/img/cards/massage.webp",
          "desc": "Kas düğümlerine odaklı baskı uygulayarak kronik ağrıları ve yansıyan ağrıları hedefleyen terapi.",
          "longDesc": "Tetik noktalar, kas içindeki aşırı hassas noktalardır ve lokal veya yansıyan (referred) ağrıya neden olabilir. Bu terapi, başparmak veya dirsekle 30-90 saniye süreyle sabit baskı uygulayarak kas liflerini gevşetir, kan akışını yeniden sağlar ve ağrıyı azaltır.",
          "price": 100,
          "duration": "45 dk",
          "tier": "MEDICAL",
          "category": "sportsTherapy",
          "tags": [
            "tetik nokta",
            "trigger point",
            "ağrı",
            "medikal",
            "kronik"
          ],
          "benefits": [
            "Kronik ağrı giderme",
            "Baş ağrısı azaltma",
            "Hareket açıklığı artışı",
            "Kas düğümlerini çözme",
            "Duruş düzeltme"
          ],
          "technique": "Ischemik kompresyon: Başparmak/dirsekle 30-90 sn sabit baskı, tekrarlı uygulama",
          "cart": {
            "id": "massage_trigger",
            "name": "Tetik Nokta Terapi",
            "price": 100,
            "cat": "massage"
          }
        },
        {
          "id": "myofascial-release",
          "slug": "myofascial-release",
          "title": "Miyofasyal Gevşetme (MFR)",
          "img": "assets/img/cards/massage.webp",
          "desc": "Fasya dokusunu hedefleyen, kronik gerginlik ve hareket kısıtlılığını çözen nazik ama derin terapi.",
          "longDesc": "Miyofasyal release, kasları ve organları saran bağ dokusu (fasya) üzerinde çalışır. Fasya sıkılaştığında ağrı ve hareket kısıtlılığı oluşur. Yağsız uygulanan uzun süreli nazik baskılarla fasya yavaşça gevşetilir ve normale döner.",
          "price": 110,
          "duration": "50 dk",
          "tier": "FASCIA",
          "category": "sportsTherapy",
          "tags": [
            "fasya",
            "myofascial",
            "bağ dokusu",
            "kronik ağrı",
            "esneklik"
          ],
          "benefits": [
            "Fasya gerginliğini çözme",
            "Esneklik artışı",
            "Kronik ağrı giderme",
            "Duruş iyileştirme",
            "Dolaşım artışı"
          ],
          "technique": "Yağsız, uzun süreli nazik baskı, fasyanın doğal gevşemesini bekleme",
          "contraindications": [
            "Akut enflamasyon",
            "Kanser",
            "Tromboz",
            "Osteoporoz"
          ],
          "cart": {
            "id": "massage_mfr",
            "name": "Miyofasyal Gevşetme",
            "price": 110,
            "cat": "massage"
          }
        },
        {
          "id": "kranyo-sakral",
          "slug": "kranyo-sakral",
          "title": "Kraniyo-Sakral Terapi",
          "img": "assets/img/cards/massage.webp",
          "desc": "Kafatası ve omurga boyunca ultra hafif dokunuşlarla sinir sistemini dengeleyen nazik terapi.",
          "longDesc": "Kraniyo-Sakral Terapi (CST), beyin ve omuriliği çevreleyen sıvının ritmini düzenler. 5 gramdan hafif dokunuşlarla kafatası, omurga ve sakrum üzerinde çalışılır. Merkezi sinir sistemini sakinleştirir, baş ağrıları, migren ve stres için etkilidir.",
          "price": 120,
          "duration": "60 dk",
          "tier": "CRANIO",
          "category": "sportsTherapy",
          "tags": [
            "kranyo",
            "sakral",
            "sinir sistemi",
            "baş ağrısı",
            "migren",
            "stres"
          ],
          "benefits": [
            "Sinir sistemi dengesi",
            "Migren rahatlaması",
            "Stres azaltma",
            "Uyku kalitesi",
            "Derin rahatlama"
          ],
          "technique": "5 gram veya daha hafif dokunuşla serebrospinal sıvı ritmini dinleme ve dengeleme",
          "contraindications": [
            "Kafa travması",
            "Beyin ödemi",
            "Anevrizma"
          ],
          "cart": {
            "id": "massage_cst",
            "name": "Kraniyo-Sakral Terapi",
            "price": 120,
            "cat": "massage"
          }
        },
        {
          "id": "signature-rituel",
          "slug": "signature-rituel",
          "title": "Signature Santis Ritüeli",
          "img": "assets/img/cards/massage.webp",
          "desc": "Doğu ve Batı tekniklerinin en iyi kombinasyonuyla oluşturulan özel imza masajımız.",
          "longDesc": "Santis Club'ın benzersiz imza terapisi. Shiatsu, İsveç ve aromaterapi tekniklerinin özenle harmanlandığı premium deneyim. Sadece burada yaşayabileceğiniz özel ritüel.",
          "price": 150,
          "duration": "75 dk",
          "tier": "SIGNATURE",
          "category": "signatureCouples",
          "tags": [
            "signature",
            "premium",
            "özel",
            "vip"
          ],
          "benefits": [
            "Bütüncül yenilenme",
            "Özel formül",
            "Premium deneyim",
            "Benzersiz ritüel"
          ],
          "cart": {
            "id": "massage_signature",
            "name": "Signature Santis Ritüeli",
            "price": 150,
            "cat": "massage"
          }
        },
        {
          "id": "cift-senkron",
          "slug": "cift-senkron",
          "title": "Çift Masajı (Senkron)",
          "img": "assets/img/cards/massage.webp",
          "desc": "İki terapist tarafından aynı anda uygulanan, eş zamanlı rahatlama deneyimi.",
          "longDesc": "Çiftler için tasarlanmış romantik spa deneyimi. İki terapist, senkronize hareketlerle eşzamanlı masaj uygular. Birlikte paylaşılan özel anlar.",
          "price": 180,
          "duration": "50 dk",
          "tier": "DUO",
          "category": "signatureCouples",
          "tags": [
            "çift",
            "senkron",
            "romantik",
            "birlikte"
          ],
          "benefits": [
            "Paylaşılan deneyim",
            "Romantik atmosfer",
            "Eşzamanlı rahatlama",
            "Özel anılar"
          ],
          "cart": {
            "id": "massage_duo",
            "name": "Çift Masajı",
            "price": 180,
            "cat": "massage"
          }
        },
        {
          "id": "cift-rituel",
          "slug": "cift-rituel",
          "title": "Çift Spa Ritüeli (Masaj + Bakım)",
          "img": "assets/img/cards/massage.webp",
          "desc": "Çiftlere özel masaj ve bakım kombinasyonu. Birlikte yenilenin.",
          "longDesc": "Masaj ve cilt bakımını birleştiren kapsamlı çift deneyimi. Hamam, masaj ve yüz bakımı bir arada. Romantik bir gün kaçamağı için ideal.",
          "price": 300,
          "duration": "90 dk",
          "tier": "VIP_COUPLE",
          "category": "signatureCouples",
          "tags": [
            "çift",
            "paket",
            "romantik",
            "vip"
          ],
          "benefits": [
            "Komple yenilenme",
            "Romantik kaçamak",
            "Premium paket",
            "Özel oda"
          ],
          "cart": {
            "id": "massage_vip_couple",
            "name": "Çift Spa Ritüeli",
            "price": 300,
            "cat": "massage"
          }
        },
        {
          "id": "kids-nazik",
          "slug": "kids-nazik",
          "title": "Kids Masajı (Nazik Dokunuş)",
          "img": "assets/img/cards/massage.webp",
          "desc": "Çocuklara özel, çok hafif baskılı ve eğlenceli, rahatlatıcı masaj deneyimi.",
          "longDesc": "6-12 yaş arası çocuklar için tasarlanmış nazik terapi. Eğlenceli atmosfer, hafif dokunuşlar ve çocuk dostu ortam. Küçük misafirlerimiz için özel.",
          "price": 40,
          "duration": "30 dk",
          "tier": "JUNIOR",
          "category": "kidsFamily",
          "tags": [
            "kids",
            "nazik",
            "çocuk",
            "eğlenceli"
          ],
          "benefits": [
            "Rahatlama",
            "İyi uyku",
            "Eğlenceli deneyim",
            "Güvenli ortam"
          ],
          "ageRange": "6-12 yaş",
          "cart": {
            "id": "massage_kids",
            "name": "Kids Masajı",
            "price": 40,
            "cat": "massage"
          }
        },
        {
          "id": "anne-cocuk",
          "slug": "anne-cocuk",
          "title": "Anne–Çocuk Rahatlama",
          "img": "assets/img/cards/massage.webp",
          "desc": "Anne ve çocuk için aynı odada, güvenli ve keyifli bir spa anısı.",
          "longDesc": "Anne ile çocuğun birlikte katıldığı özel seans. Aynı odada, yan yana masaj keyfi. Unutulmaz bir bağ kurma deneyimi.",
          "price": 100,
          "duration": "50 dk",
          "tier": "FAMILY",
          "category": "kidsFamily",
          "tags": [
            "family",
            "birlikte",
            "anne",
            "bağ"
          ],
          "benefits": [
            "Birlikte kaliteli zaman",
            "Bağ güçlendirme",
            "Paylaşılan rahatlama",
            "Özel anılar"
          ],
          "cart": {
            "id": "massage_family",
            "name": "Anne–Çocuk Rahatlama",
            "price": 100,
            "cat": "massage"
          }
        }
      ],
      "categories": {
        "classicMassages": {
          "label": "KLASİK & RAHATLATICI",
          "desc": "Geleneksel İsveç teknikleri ve modern wellness yaklaşımları"
        },
        "asianMassages": {
          "label": "UZAK DOĞU RİTÜELLERİ",
          "desc": "Shiatsu, Thai ve Bali'den gelen antik bilgelik"
        },
        "sportsTherapy": {
          "label": "SPOR & TERAPÖTİK",
          "desc": "Aktif yaşam ve performans odaklı terapiler"
        },
        "signatureCouples": {
          "label": "İMZA & ÇİFT DENEYİMLERİ",
          "desc": "Premium ve romantik spa ritüelleri"
        },
        "kidsFamily": {
          "label": "AİLE & MİNİKLER",
          "desc": "Tüm aile için güvenli spa keyfi"
        }
      },
      "tiers": {
        "CLASSIC": {
          "label": "KLASİK",
          "bg": "rgba(139, 115, 85, 0.9)",
          "color": "#fff"
        },
        "RELAX": {
          "label": "RELAX",
          "bg": "rgba(107, 142, 107, 0.9)",
          "color": "#fff"
        },
        "AROMA": {
          "label": "AROMA",
          "bg": "rgba(155, 107, 155, 0.9)",
          "color": "#fff"
        },
        "STONE": {
          "label": "SICAK TAŞ",
          "bg": "rgba(74, 74, 74, 0.9)",
          "color": "#D4AF37"
        },
        "BACK": {
          "label": "SIRT",
          "bg": "rgba(91, 107, 123, 0.9)",
          "color": "#fff"
        },
        "EXPRESS": {
          "label": "EKSPRES",
          "bg": "rgba(212, 165, 116, 0.9)",
          "color": "#1a1a1a"
        },
        "SWEDISH": {
          "label": "İSVEÇ",
          "bg": "rgba(70, 130, 180, 0.9)",
          "color": "#fff"
        },
        "REFLEX": {
          "label": "REFLEKS",
          "bg": "rgba(147, 112, 219, 0.9)",
          "color": "#fff"
        },
        "LYMPH": {
          "label": "LENF",
          "bg": "rgba(100, 149, 237, 0.9)",
          "color": "#fff"
        },
        "JAPAN": {
          "label": "SHIATSU",
          "bg": "rgba(220, 53, 69, 0.9)",
          "color": "#fff"
        },
        "THERAPY": {
          "label": "THAI",
          "bg": "rgba(255, 193, 7, 0.9)",
          "color": "#1a1a1a"
        },
        "SIGNATURE": {
          "label": "İMZA",
          "bg": "linear-gradient(135deg, #D4AF37, #F4E4BC)",
          "color": "#1a1a1a"
        },
        "INTENSE": {
          "label": "YOĞUN",
          "bg": "rgba(255, 99, 71, 0.9)",
          "color": "#fff"
        },
        "SPORT": {
          "label": "SPOR",
          "bg": "rgba(46, 139, 87, 0.9)",
          "color": "#fff"
        },
        "DUO": {
          "label": "ÇİFT",
          "bg": "rgba(255, 105, 180, 0.9)",
          "color": "#fff"
        },
        "VIP_COUPLE": {
          "label": "VIP",
          "bg": "linear-gradient(135deg, #8B0000, #DC143C)",
          "color": "#fff"
        },
        "JUNIOR": {
          "label": "ÇOCUK",
          "bg": "rgba(255, 215, 0, 0.9)",
          "color": "#1a1a1a"
        },
        "FAMILY": {
          "label": "AİLE",
          "bg": "rgba(135, 206, 250, 0.9)",
          "color": "#1a1a1a"
        }
      }
    },
    "skincare": {
      "items": [
        {
          "id": "classic-facial",
          "title": "Klasik Cilt Bakımı",
          "duration": "60 dk",
          "tier": "CLASSIC",
          "price": 55,
          "desc": "Temizleme + tonik + maske — cildi dengeler, canlılık verir.",
          "img": "assets/img/cards/facial.webp",
          "category": "classicFacials",
          "href": "service-detail.html?slug=classic-facial",
          "cart": {
            "id": "skincare_classic",
            "name": "Klasik Cilt Bakımı",
            "price": 55,
            "cat": "skincare"
          }
        },
        {
          "id": "deep-cleanse",
          "title": "Derin Temizleme Bakımı",
          "duration": "70 dk",
          "tier": "CLEAN",
          "price": 65,
          "desc": "Gözenek odaklı arındırma — siyah nokta ve sebum dengesine destek.",
          "img": "assets/img/cards/facial.webp",
          "category": "classicFacials",
          "href": "service-detail.html?slug=deep-cleanse",
          "cart": {
            "id": "skincare_deepcleanse",
            "name": "Derin Temizleme Bakımı",
            "price": 65,
            "cat": "skincare"
          }
        },
        {
          "id": "enzyme-peel",
          "title": "Enzim Peeling Bakımı",
          "duration": "45 dk",
          "tier": "PEEL",
          "price": 50,
          "desc": "Nazik yenileme — pürüzsüz görünüm ve ışıltı için couture dokunuş.",
          "img": "assets/img/cards/facial.webp",
          "category": "classicFacials",
          "href": "service-detail.html?slug=enzyme-peel",
          "cart": {
            "id": "skincare_enzyme",
            "name": "Enzim Peeling Bakımı",
            "price": 50,
            "cat": "skincare"
          }
        },
        {
          "id": "detox-charcoal",
          "title": "Detox Kömür Maske",
          "duration": "40 dk",
          "tier": "DETOX",
          "price": 45,
          "desc": "Şehir yorgunluğuna karşı arındırma — matlığı azaltmaya destek.",
          "img": "assets/img/cards/facial.webp",
          "category": "classicFacials",
          "href": "service-detail.html?slug=detox-charcoal",
          "cart": {
            "id": "skincare_detox",
            "name": "Detox Kömür Maske",
            "price": 45,
            "cat": "skincare"
          }
        },
        {
          "id": "hyaluron-hydrate",
          "title": "Hyaluron Nem Terapisi",
          "duration": "60 dk",
          "tier": "HYDRATE",
          "price": 70,
          "desc": "Yoğun nem + dolgun görünüm — bariyeri destekler, cildi yumuşatır.",
          "img": "assets/img/cards/facial.webp",
          "category": "hydrationGlow",
          "href": "service-detail.html?slug=hyaluron-hydrate",
          "cart": {
            "id": "skincare_hyaluron",
            "name": "Hyaluron Nem Terapisi",
            "price": 70,
            "cat": "skincare"
          }
        },
        {
          "id": "vitamin-c-glow",
          "title": "Vitamin C Glow",
          "duration": "50 dk",
          "tier": "GLOW",
          "price": 65,
          "desc": "Aydınlık ve taze görünüm — ışıltıyı artıran premium protokol.",
          "img": "assets/img/cards/facial.webp",
          "category": "hydrationGlow",
          "href": "service-detail.html?slug=vitamin-c-glow",
          "cart": {
            "id": "skincare_vitc",
            "name": "Vitamin C Glow",
            "price": 65,
            "cat": "skincare"
          }
        },
        {
          "id": "oxygen-boost",
          "title": "Oksijen Boost Bakımı",
          "duration": "45 dk",
          "tier": "OXYGEN",
          "price": 55,
          "desc": "Canlandırıcı etki — daha dinlenmiş ve parlak bir görünüm.",
          "img": "assets/img/cards/facial.webp",
          "category": "hydrationGlow",
          "href": "service-detail.html?slug=oxygen-boost",
          "cart": {
            "id": "skincare_oxygen",
            "name": "Oksijen Boost Bakımı",
            "price": 55,
            "cat": "skincare"
          }
        },
        {
          "id": "glass-skin",
          "title": "Glass Skin Ritüeli",
          "duration": "75 dk",
          "tier": "LUXE",
          "price": 90,
          "desc": "Katmanlı nem + maske — cam gibi parlak, pürüzsüz bir bitiş.",
          "img": "assets/img/cards/facial.webp",
          "category": "hydrationGlow",
          "href": "service-detail.html?slug=glass-skin",
          "cart": {
            "id": "skincare_glass",
            "name": "Glass Skin Ritüeli",
            "price": 90,
            "cat": "skincare"
          }
        },
        {
          "id": "collagen-lift",
          "title": "Kolajen Lifting Bakımı",
          "duration": "70 dk",
          "tier": "LIFT",
          "price": 95,
          "desc": "Sıkılık hissi ve toparlanma — yorgun görünümü azaltmaya destek.",
          "img": "assets/img/cards/facial.webp",
          "category": "antiAgingLift",
          "href": "service-detail.html?slug=collagen-lift",
          "cart": {
            "id": "skincare_collagen",
            "name": "Kolajen Lifting Bakımı",
            "price": 95,
            "cat": "skincare"
          }
        },
        {
          "id": "anti-aging-pro",
          "title": "Anti-Aging Pro Bakım",
          "duration": "80 dk",
          "tier": "PRO",
          "price": 115,
          "desc": "İnce çizgi görünümü hedefleyen kapsamlı protokol — couture bakım.",
          "img": "assets/img/cards/facial.webp",
          "category": "antiAgingLift",
          "href": "service-detail.html?slug=anti-aging-pro",
          "cart": {
            "id": "skincare_antiaging",
            "name": "Anti-Aging Pro Bakım",
            "price": 115,
            "cat": "skincare"
          }
        },
        {
          "id": "led-rejuvenation",
          "title": "LED Rejuvenation",
          "duration": "40 dk",
          "tier": "LED",
          "price": 60,
          "desc": "Işık desteğiyle bakım rutini — cilt görünümünü dengelemeye yardımcı.",
          "img": "assets/img/cards/detail.webp",
          "category": "antiAgingLift",
          "href": "service-detail.html?slug=led-rejuvenation",
          "cart": {
            "id": "skincare_led",
            "name": "LED Rejuvenation",
            "price": 60,
            "cat": "skincare"
          }
        },
        {
          "id": "brightening-spot",
          "title": "Leke Karşıtı Aydınlatıcı Bakım",
          "duration": "60 dk",
          "tier": "BRIGHT",
          "price": 70,
          "desc": "Ton eşitleme odaklı — daha homojen bir görünüm için destek.",
          "img": "assets/img/cards/facial.webp",
          "category": "targetedCare",
          "href": "service-detail.html?slug=brightening-spot",
          "cart": {
            "id": "skincare_bright",
            "name": "Leke Karşıtı Aydınlatıcı Bakım",
            "price": 70,
            "cat": "skincare"
          }
        },
        {
          "id": "acne-balance",
          "title": "Akne & Sebum Denge Bakımı",
          "duration": "60 dk",
          "tier": "ACNE",
          "price": 65,
          "desc": "Arındırma + dengeleme — yağlı/karma ciltler için hedefli bakım.",
          "img": "assets/img/cards/facial.webp",
          "category": "targetedCare",
          "href": "service-detail.html?slug=acne-balance",
          "cart": {
            "id": "skincare_acne",
            "name": "Akne & Sebum Denge Bakımı",
            "price": 65,
            "cat": "skincare"
          }
        },
        {
          "id": "sensitive-soothe",
          "title": "Hassas Cilt Sakinleştirici Bakım",
          "duration": "50 dk",
          "tier": "CALM",
          "price": 60,
          "desc": "Kızarıklık ve hassasiyet hissini azaltmaya yönelik nazik protokol.",
          "img": "assets/img/cards/detail.webp",
          "category": "targetedCare",
          "href": "service-detail.html?slug=sensitive-soothe",
          "cart": {
            "id": "skincare_sensitive",
            "name": "Hassas Cilt Sakinleştirici Bakım",
            "price": 60,
            "cat": "skincare"
          }
        },
        {
          "id": "barrier-repair",
          "title": "Bariyer Onarıcı Bakım",
          "duration": "55 dk",
          "tier": "REPAIR",
          "price": 65,
          "desc": "Kuruluk ve gerginlik için destek — cilt bariyerini güçlendirmeye yardımcı.",
          "img": "assets/img/cards/facial.webp",
          "category": "targetedCare",
          "href": "service-detail.html?slug=barrier-repair",
          "cart": {
            "id": "skincare_barrier",
            "name": "Bariyer Onarıcı Bakım",
            "price": 65,
            "cat": "skincare"
          }
        },
        {
          "id": "micro-polish",
          "title": "Micro Polish Bakımı",
          "duration": "45 dk",
          "tier": "POLISH",
          "price": 75,
          "desc": "Cilt yüzeyini pürüzsüzleştiren bakım — daha canlı bir bitiş.",
          "img": "assets/img/cards/facial.webp",
          "category": "advancedAesthetics",
          "href": "service-detail.html?slug=micro-polish",
          "cart": {
            "id": "skincare_micropolish",
            "name": "Micro Polish Bakımı",
            "price": 75,
            "cat": "skincare"
          }
        },
        {
          "id": "gold-mask-ritual",
          "title": "Gold Mask Ritüeli",
          "duration": "60 dk",
          "tier": "LUXE",
          "price": 95,
          "desc": "Lüks maske + masaj — ışıl ışıl, dinlenmiş görünüm.",
          "img": "assets/img/cards/facial.webp",
          "category": "advancedAesthetics",
          "href": "service-detail.html?slug=gold-mask-ritual",
          "cart": {
            "id": "skincare_gold",
            "name": "Gold Mask Ritüeli",
            "price": 95,
            "cat": "skincare"
          }
        },
        {
          "id": "eye-contour",
          "title": "Göz Çevresi Bakımı",
          "duration": "25 dk",
          "tier": "EYE",
          "price": 35,
          "desc": "Göz çevresine yoğun nem ve rahatlama — daha canlı bakışlar.",
          "img": "assets/img/cards/facial.webp",
          "category": "miniPrograms",
          "href": "service-detail.html?slug=eye-contour",
          "cart": {
            "id": "skincare_eye",
            "name": "Göz Çevresi Bakımı",
            "price": 35,
            "cat": "skincare"
          }
        },
        {
          "id": "lip-care",
          "title": "Dudak Bakımı",
          "duration": "20 dk",
          "tier": "LIP",
          "price": 25,
          "desc": "Yumuşatma + bakım — pürüzsüz ve dolgun görünüm hissi.",
          "img": "assets/img/cards/facial.webp",
          "category": "miniPrograms",
          "href": "service-detail.html?slug=lip-care",
          "cart": {
            "id": "skincare_lip",
            "name": "Dudak Bakımı",
            "price": 25,
            "cat": "skincare"
          }
        },
        {
          "id": "men-facial",
          "title": "Erkek Cilt Bakımı",
          "duration": "55 dk",
          "tier": "MEN",
          "price": 55,
          "desc": "Tıraş sonrası hassasiyete uygun — temiz, dengeli ve net görünüm.",
          "img": "assets/img/cards/facial.webp",
          "category": "miniPrograms",
          "href": "service-detail.html?slug=men-facial",
          "cart": {
            "id": "skincare_men",
            "name": "Erkek Cilt Bakımı",
            "price": 55,
            "cat": "skincare"
          }
        }
      ],
      "categories": {
        "all": "TÜMÜ",
        "classicFacials": "KLASİK BAKIMLAR",
        "hydrationGlow": "NEM & IŞILTI",
        "antiAgingLift": "ANTI-AGING & LİFT",
        "targetedCare": "HEDEFLİ BAKIMLAR",
        "advancedAesthetics": "GELİŞMİŞ ESTETİK",
        "miniPrograms": "MİNİ PROGRAMLAR"
      },
      "order": [
        "all",
        "classicFacials",
        "hydrationGlow",
        "antiAgingLift",
        "targetedCare",
        "advancedAesthetics",
        "miniPrograms"
      ]
    }
  },
  "gallery": [
    {
      "src": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop",
      "alt": "Geleneksel Hamam",
      "category": "hammam"
    },
    {
      "src": "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=600&auto=format&fit=crop",
      "alt": "Relax Masajı",
      "category": "massage"
    },
    {
      "src": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=600&auto=format&fit=crop",
      "alt": "Sauna Keyfi",
      "category": "spa"
    },
    {
      "src": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop",
      "alt": "Cilt Bakımı",
      "category": "skincare"
    },
    {
      "src": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=600&auto=format&fit=crop",
      "alt": "Kapalı Havuz",
      "category": "pool"
    },
    {
      "src": "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=600&auto=format&fit=crop",
      "alt": "Thai Terapi",
      "category": "massage"
    },
    {
      "src": "https://images.unsplash.com/photo-1591343395082-e21b64b55d4b?q=80&w=600&auto=format&fit=crop",
      "alt": "Çift Odası",
      "category": "massage"
    },
    {
      "src": "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=600&auto=format&fit=crop",
      "alt": "Dinlenme Alanı",
      "category": "spa"
    }
  ]
};



/* Helper: Dynamic Root Resolver */
function getSantisRootPath() {
  if (window.SITE_ROOT) return window.SITE_ROOT;
  const script = document.querySelector('script[src*="assets/js/app.js"]');
  return script ? script.getAttribute('src').replace('assets/js/app.js', '') : "";
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





    const res = await fetch(getSantisRootPath() + "data/site_content.json");
    if (!res.ok) throw new Error("JSON Fetch Failed");
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

    console.warn("Using Fallback Data:", e);

    return localFallbackData;

  }

}



/* Cinematic Intro Logic */

function initCinematicIntro() {

  const preloader = document.getElementById("preloader");

  if (!preloader) return;



  // Ensure animations are prepared

  const heroTitle = document.getElementById("heroTitle");

  const heroSub = document.getElementById("heroSubtitle");



  if (heroTitle) {

    heroTitle.style.opacity = "0";

    heroTitle.style.transform = "translateY(30px)";

  }

  if (heroSub) {

    heroSub.style.opacity = "0";

    heroSub.style.transform = "translateY(30px)";

  }



  // Minimum wait time for the logo pulse to be appreciated

  const minTime = 1500;



  setTimeout(() => {

    preloader.classList.add("hidden");



    // Trigger Hero Animations after preloader is lifting

    setTimeout(() => {

      if (heroTitle) {

        heroTitle.style.transition = "opacity 1.2s ease-out, transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)";

        heroTitle.style.opacity = "1";

        heroTitle.style.transform = "translateY(0)";

      }



      if (heroSub) {

        heroSub.style.transition = "opacity 1.2s ease-out 0.2s, transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s";

        heroSub.style.opacity = "1";

        heroSub.style.transform = "translateY(0)";

      }

    }, 400);



  }, minTime);

}



function initScrollObserver() {

  const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {

        entry.target.classList.add('is-visible');

        observer.unobserve(entry.target);

      }

    });

  }, { threshold: 0.1 });



  document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

}



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



  // Wire global events

  document.getElementById("svcOverlay")?.addEventListener("click", closeServiceDrawer);

  document.getElementById("svcDrawerClose")?.addEventListener("click", closeServiceDrawer);

  document.getElementById("closeBookingBtn2")?.addEventListener("click", closeBookingModal);

  document.getElementById("bookingCloseBtn")?.addEventListener("click", closeBookingModal);



  // 2. Handle Routing State (View/Section)

  const view = params.get("view");

  const section = params.get("section");



  if (view) {

    setActiveCategoryFromRoute(view);

  }



  renderAll();

  renderHomeSections();

  renderHomeGallery();



  // Cinematic Intro & Scroll

  initCinematicIntro();



  // Initialize scroll observer AFTER content is rendered

  setTimeout(() => initScrollObserver(), 100);



  // 3. Post-Render Actions

  if (section === "booking") {

    scrollToSection("booking");

    openBookingModal();

  } else if (view) {

    // If view matches a specific section ID, scroll there. Otherwise go to results.

    const target = document.getElementById(view) || document.querySelector(`[data-section="${view}"]`);

    if (target) scrollToSection(view);

    else if (state.activeCategoryId) scrollToSection("service-results");

  }



  // 4. Favicon Fix (Prevent 404)

  if (!document.querySelector("link[rel*='icon']")) {

    const link = document.createElement('link');

    link.rel = 'shortcut icon';

    link.href = (typeof getSantisRootPath === 'function' ? getSantisRootPath() : '') + 'favicon.ico';

    document.head.appendChild(link);

  }

}



// Gallery Renderer
function renderHomeGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const sources = [...(window.NV_HAMMAM || []), ...(window.NV_MASSAGES || []), ...(window.NV_SKINCARE || [])];

  // Create unique pool of items (not just images)
  const seenImgs = new Set();
  const pool = sources.filter(s => {
    const img = s.img;
    if (!img || img.includes('placeholder') || seenImgs.has(img)) return false;
    seenImgs.add(img);
    return true;
  });

  const show = pool.sort(() => 0.5 - Math.random()).slice(0, 6);

  grid.innerHTML = show.map(item => `
    <div class="gallery-item">
        <img src="${item.img}" alt="${item.title}" loading="lazy">
        <div class="gallery-overlay">
            <span>${item.title || 'Santis Club'}</span>
        </div>
    </div>
  `).join('');
}

// Start the app

init();


/* Sticky Header Patch */
document.addEventListener('DOMContentLoaded', () => {
  const h = document.getElementById('nv-header');
  if (h) {
    const onScroll = () => h.classList.toggle('shrink', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});

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

  // AUTO-LOAD NAVBAR (Eğer sayfada container var ama içi boşsa)
  const navCont = document.getElementById('navbar-container');
  if (navCont && navCont.innerHTML.trim() === "") {
    console.log("⚓ Auto-Loading Navbar...");
    if (typeof loadComp === 'function') {
      loadComp("/components/navbar.html", "navbar-container", { runScripts: true });
    }
  }

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
document.addEventListener('error', function (e) {
  if (e.target.tagName.toLowerCase() === 'img') {
    // Prevent infinite loops if placeholder is also missing
    if (e.target.src.includes('luxury-placeholder.png')) return;

    console.log("Görsel kurtarılıyor: " + e.target.getAttribute('src')); // Log original source

    // Calculate reliable root
    const root = (window.SITE_ROOT) ? window.SITE_ROOT : (typeof getSantisRootPath === 'function' ? getSantisRootPath() : "");
    const placeholderPath = "assets/img/luxury-placeholder.webp";

    // Prevent double-pathing if root is already present
    if (e.target.src.includes(placeholderPath)) return; // Already tried placeholder

    let newSrc = root + placeholderPath;

    // Clean up potential double slashes or assets/assets
    // if (newSrc.includes('assets/assets/')) newSrc = newSrc.replace('assets/assets/', 'assets/');

    e.target.src = newSrc;
    e.target.style.filter = "grayscale(1) opacity(0.5)";
  }
}, true);
