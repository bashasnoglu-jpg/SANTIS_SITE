/* ==========================================================================
   SANTIS SERVICE-ENGINE v1.0
   Service catalog UI: ensureSlug, translator, hotel select, category toolbar,
   top picks, service cards, results renderer, drawer, booking modal, renderAll.
   Loaded on service pages only.
   Phase 7B-4A extraction from app.js monolith.
   ========================================================================== */
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
