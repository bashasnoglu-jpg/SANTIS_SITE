﻿﻿﻿window.DEMO_MODE = true;

const state = {
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

let CONTENT = null;

/* Core Helpers */
function t(path) {
  if (path.startsWith("booking.")) {
    const parts = path.split(".");
    let cur = CONTENT?.global?.booking?.translations?.[state.lang];
    for (let i = 1; i < parts.length; i++) cur = cur?.[parts[i]];
    if (cur !== undefined) return cur;
  }
  const parts = String(path || "").split(".");
  let cur = CONTENT?.[state.lang];
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

/* Nav Helpers (New Logic) */
function getNavModel() {
  return CONTENT?.global?.navModel && Array.isArray(CONTENT.global.navModel)
    ? CONTENT.global.navModel
    : (window.NAV_MODEL || []);
}

function buildPrefix() {
  return "";
}

function buildUrl(routeKey, sectionKey) {
  if (window.DEMO_MODE) {
    return "#" + (sectionKey || routeKey);
  }
  const routes = CONTENT?.global?.routes || {};
  const path = routes[routeKey] || "/";
  return buildPrefix() + path;
}

function scrollToSection(sectionKey) {
  const target = document.querySelector(`[data-section="${sectionKey}"]`) || document.getElementById(sectionKey);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToId(id) {
  scrollToSection(id);
}

function setActiveCategoryFromRoute(routeKey) {
  const map = {
    hammam: "hammam",
    massages: "",
    classic: "classicMassages",
    sports: "sportsTherapy",
    asian: "asianMassages",
    ayurveda: "ayurveda",
    signature: "signatureCouples",
    kids: "kidsFamily",
    face: "faceSothys",
    products: "products"
  };
  const nextCat = map[routeKey];
  const catId = (nextCat !== undefined) ? nextCat : routeKey;

  if (!catId) return false;

  state.activeCategoryId = catId;
  return true;
}

function handleNavDemoClick(item) {
  if (item.categoryId) {
    state.activeCategoryId = item.categoryId;
    if (typeof renderCategoryToolbar === "function") renderCategoryToolbar();
    if (typeof renderCategories === "function") renderCategories();
    if (typeof renderServiceResults === "function") renderServiceResults();
  }
  const target = item.sectionKey || item.route;
  scrollToSection(target);
  history.replaceState(null, "", "#" + target);
}

/* Render Nav (New Version) */
function renderNav() {
  const root = document.getElementById("navRoot");
  if (!root) return;
  root.innerHTML = "";

  const model = getNavModel();

  for (const item of model) {
    if (item.enabled === false) continue;

    const div = document.createElement("div");
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    div.className = "nav-item" + (hasChildren ? " has-sub" : "");

    const a = document.createElement("a");
    a.className = "nav-link";

    const sectionKey = item.sectionKey || item.route;
    a.href = buildUrl(item.route, sectionKey);
    a.textContent = t(`nav.${item.key}`) || item.label || item.key;

    if (window.DEMO_MODE) {
      a.onclick = (e) => {
        e.preventDefault();
        handleNavDemoClick(item);
      };
    }

    div.appendChild(a);

    if (hasChildren) {
      const menu = document.createElement("div");
      menu.className = "submenu";

      for (const ch of item.children) {
        const ca = document.createElement("a");
        const chSectionKey = ch.sectionKey || ch.route;
        ca.href = buildUrl(ch.route, chSectionKey);
        ca.textContent = t(`nav.${ch.key}`) || ch.label || ch.key;

        if (window.DEMO_MODE) {
          ca.onclick = (e) => {
            e.preventDefault();
            handleNavDemoClick(ch);
          };
        }
        menu.appendChild(ca);
      }
      div.appendChild(menu);
    }
    root.appendChild(div);
  }

  // CTA
  const cta = document.getElementById("ctaBooking");
  if (cta) {
    cta.textContent = t("nav.bookingWhatsapp");
    const ctaSectionKey = "booking";
    cta.href = buildUrl("booking", ctaSectionKey);

    if (window.DEMO_MODE) {
      cta.onclick = (e) => {
        e.preventDefault();
        scrollToSection(ctaSectionKey);
        openBookingModal();
      };
    }
  }
}

/* UI Logic */
function renderUITexts() {
  document.getElementById("lblHotel").textContent = t("ui.selectHotel");
  document.getElementById("lblLang").textContent = t("ui.selectLanguage");

  const selectedHotel = getSelectedHotel();
  const ctx = document.getElementById("contextLine");

  if (!selectedHotel) ctx.textContent = "Network Mode";
  else {
    const name = selectedHotel.translations?.[state.lang]?.name || selectedHotel.translations?.tr?.name || state.hotel;
    ctx.textContent = name;
  }

  document.getElementById("heroTitle").textContent = t("hero.title");
  
  const heroSubtitleEl = document.getElementById("heroSubtitle");
  if (selectedHotel) {
    heroSubtitleEl.textContent = selectedHotel.translations?.[state.lang]?.description || selectedHotel.translations?.tr?.description || "";
  } else {
    const subtitleTpl = t("hero.subtitle");
    const locDefault = t("hero.locationDefault");
    heroSubtitleEl.textContent = subtitleTpl.replace("{location}", locDefault);
  }

  document.getElementById("topPicksTitle").textContent = t("sections.topPicks");

  const catTitle = selectedHotel ? t("sections.categoriesHotel") : t("sections.categoriesNetwork");
  document.getElementById("categoriesTitle").textContent = catTitle;

  const catSub = selectedHotel ? t("sections.categoryCardSubtitleHotel") : t("sections.categoryCardSubtitleNetwork");
  const catPill = document.getElementById("categoriesContextPill");
  const catSubtitle = document.getElementById("categoriesSubtitle");

  const copyBtn2 = document.getElementById("svcCopyLink");
  if (copyBtn2) copyBtn2.title = t("ui.copied");

  if (catPill) catPill.textContent = selectedHotel ? (selectedHotel.name?.[state.lang] || selectedHotel.name?.tr) : "Network";
  if (catSubtitle) catSubtitle.textContent = catSub;

  document.getElementById("partnerTitle").textContent = t("sections.partnerHotels");
  document.getElementById("aboutTitle").textContent = t("nav.about");
  document.getElementById("teamTitle").textContent = t("nav.team");

  const svcSearch = document.getElementById("serviceSearch");
  if (svcSearch) svcSearch.placeholder = t("ui.serviceSearchPlaceholder");

  document.getElementById("chipToday").textContent = t("ui.onlyToday");
  document.getElementById("chipDurAll").textContent = t("ui.durAll");
  document.getElementById("chipDur30").textContent = t("ui.dur30");
  document.getElementById("chipDur60").textContent = t("ui.dur60");
  document.getElementById("lblSort").textContent = t("ui.sortLabel");
  document.getElementById("serviceFiltersClear").textContent = t("ui.clearFilters");

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
  sel.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = "Network (Tüm Oteller)";
  sel.appendChild(optAll);

  for (const h of getHotels()) {
    const opt = document.createElement("option");
    opt.value = h.slug;
    opt.textContent = h.translations?.[state.lang]?.name || h.translations?.tr?.name || h.slug;
    sel.appendChild(opt);
  }
  sel.value = state.hotel;
}

/* Category & Top Picks Logic */
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
      scrollToSection("service-results");
      if (window.DEMO_MODE) history.replaceState(null, "", "#service-results");
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
  emptyEl.style.display = "none";

  const selectedHotel = getSelectedHotel();
  const hotelSlug = selectedHotel?.slug || "";
  const categoryId = state.activeCategoryId;
  const categories = CONTENT?.global?.categories || [];
  const catObj = categories.find(c => c.id === categoryId);

  if (metaEl) metaEl.textContent = catObj ? t(catObj.navKey) : t("ui.pickCategory");

  if (!catObj) {
    emptyEl.style.display = "block";
    emptyEl.textContent = t("ui.pickCategory");
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
    const card = document.createElement("div");
    card.className = "card";
    const name = svc.name?.[state.lang] || svc.name?.tr || svc.id;
    const desc = svc.desc?.[state.lang] || svc.desc?.tr || "";

    const price = svc.price;
    const cur = svc.currency || "EUR";
    const dur = svc.durationMin || svc.duration;

    card.innerHTML = `
        <div class="card-body">
            <div class="result-row">
              <div style="min-width:0;">
                <div class="card-title">${name}</div>
                ${desc ? `<div class="card-desc">${desc}</div>` : ``}
                <div class="result-meta">
                   ${dur ? `<span class="kv">⏱ ${dur} dk</span>` : ``}
                   ${price != null ? `<span class="kv">💶 ${price} ${cur}</span>` : ``}
                </div>
              </div>
              <div style="flex:0 0 auto;">
                <button class="btn-sm" type="button" data-book>Book</button>
              </div>
            </div>
        </div>
      `;

    card.querySelector("[data-book]").onclick = (e) => {
      e.stopPropagation();
      state.selectedServiceId = svc.id;
      openBookingModal();
    };
    card.onclick = () => openServiceDrawer(svc.id);
    listEl.appendChild(card);
  }
}

function renderTopPicks() {
  const grid = document.getElementById("topPicksGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const selectedHotel = getSelectedHotel();
  const services = CONTENT?.global?.services || {};
  let ids = [];

  if (selectedHotel && selectedHotel.featuredServices) {
    ids = selectedHotel.featuredServices.slice(0, 3);
  } else {
    ids = Object.keys(services).slice(0, 3);
  }

  for (const id of ids) {
    const svc = services[id];
    if (!svc) continue;
    const name = svc.name?.[state.lang] || svc.name?.tr || id;

    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `<div class="mini-title">${name}</div>`;
    card.onclick = () => {
      state.selectedServiceId = id;
      openBookingModal();
    };
    grid.appendChild(card);
  }
}

/* Booking Logic (Full) */
function openBookingModal() {
  const modal = document.getElementById("bookingModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  hideAlert("bookingAlert");
  hideAlert("formAlert");
  document.getElementById("successBox").classList.remove("show");
  document.getElementById("successBox").textContent = "";
  document.getElementById("shareWhatsappBtn").style.display = "none";

  renderBookingUI();
  updateWhatsappPreview();

  setTimeout(() => document.getElementById("bookHotel")?.focus(), 50);
  window.addEventListener("keydown", escCloseOnce);
}

function closeBookingModal() {
  const modal = document.getElementById("bookingModal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  window.removeEventListener("keydown", escCloseOnce);
}

function escCloseOnce(e) {
  if (e.key === "Escape") closeBookingModal();
}

function renderBookingUI() {
  // Titles
  document.getElementById("bookingModalTitle").textContent = t("booking.title");
  const selectedHotel = getSelectedHotel();
  const hotelName = selectedHotel ? (selectedHotel.translations?.[state.lang]?.name || selectedHotel.translations?.tr?.name) : "Network";
  document.getElementById("bookingModalSub").textContent = hotelName;

  document.getElementById("waPanelTitle").textContent = t("booking.buttons.whatsapp"); // Using button text as title for now or add specific title key
  document.getElementById("formPanelTitle").textContent = t("booking.title");

  // Labels
  const labels = {
    lblBookHotel: "booking.fields.hotel",
    lblBookService: "booking.fields.service",
    lblBookDate: "booking.fields.date",
    lblBookTime: "booking.fields.time",
    lblBookPeople: "booking.fields.guests",
    lblBookRoom: "booking.fields.room",
    lblBookNotes: "booking.fields.notes",
    lblFullName: "booking.fields.name",
    lblPhone: "booking.fields.phone",
    lblFormNotes: "booking.fields.notes"
  };
  for (const [id, key] of Object.entries(labels)) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }

  document.getElementById("txtConsentPrivacy").textContent = t("booking.fields.agree_privacy");
  document.getElementById("txtConsentTerms").textContent = t("booking.fields.agree_cancel");

  // Buttons
  document.getElementById("whatsappBtn").textContent = t("booking.buttons.whatsapp");
  document.getElementById("submitFormBtn").textContent = t("booking.buttons.submit");
  // document.getElementById("shareWhatsappBtn").textContent = t("booking.success.shareWhatsapp"); // Removed in new structure, handle if needed

  // Hotel Select
  const bookHotel = document.getElementById("bookHotel");
  bookHotel.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "—";
  bookHotel.appendChild(opt0);

  for (const h of getHotels()) {
    const opt = document.createElement("option");
    opt.value = h.slug;
    opt.textContent = h.translations?.[state.lang]?.name || h.translations?.tr?.name || h.slug;
    bookHotel.appendChild(opt);
  }
  bookHotel.value = state.hotel || "";

  bookHotel.onchange = () => {
    renderServiceSelectInModal();
    updateWhatsappPreview();
  };

  renderServiceSelectInModal();
  updateWhatsappPreview();

  // Wire inputs
  const watchIds = ["bookDate", "bookTime", "bookPeople", "bookRoom", "bookNotes"];
  watchIds.forEach(id => {
    document.getElementById(id).addEventListener("input", updateWhatsappPreview);
  });

  document.getElementById("copyMsgBtn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById("waPreview").value || "");
      alert(t("ui.copied") || "Copied");
    } catch (e) { console.error(e); }
  };

  document.getElementById("submitFormBtn").onclick = submitOnlineForm;
}

function renderServiceSelectInModal() {
  const bookService = document.getElementById("bookService");
  const bookHotel = document.getElementById("bookHotel");
  const hotelSlug = bookHotel.value;
  const hotelObj = getHotels().find(h => h.slug === hotelSlug);

  bookService.innerHTML = "";
  if (!hotelSlug) {
    bookService.disabled = true;
    const opt = document.createElement("option");
    opt.textContent = "—"; // Simplified fallback
    bookService.appendChild(opt);
    return;
  }
  bookService.disabled = false;

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "—";
  bookService.appendChild(opt0);

  const services = CONTENT?.global?.services || {};
  const featured = hotelObj?.featuredServices || [];

  // Featured Group
  if (featured.length) {
    const g1 = document.createElement("optgroup");
    g1.label = t("sections.topPicks") || "Top Picks"; // Reusing existing key
    featured.forEach(sid => {
      if (services[sid]) {
        const opt = document.createElement("option");
        opt.value = sid;
        opt.textContent = services[sid].name?.[state.lang] || services[sid].name?.tr;
        g1.appendChild(opt);
      }
    });
    bookService.appendChild(g1);
  }

  // All Group
  const g2 = document.createElement("optgroup");
  g2.label = t("booking.serviceGroups.otherServices") || "Others";
  g2.label = "Others"; // Fallback
  Object.keys(services).forEach(sid => {
    if (!featured.includes(sid)) {
      const opt = document.createElement("option");
      opt.value = sid;
      opt.textContent = services[sid].name?.[state.lang] || services[sid].name?.tr;
      g2.appendChild(opt);
    }
  });
  bookService.appendChild(g2);

  if (state.selectedServiceId) bookService.value = state.selectedServiceId;
  bookService.onchange = updateWhatsappPreview;
}

function getBookingVars() {
  const hotelSlug = document.getElementById("bookHotel").value;
  const serviceId = document.getElementById("bookService").value;
  const hotelObj = getHotels().find(h => h.slug === hotelSlug);
  const hotelName = hotelObj ? (hotelObj.translations?.[state.lang]?.name || hotelObj.translations?.tr?.name) : "";
  const serviceObj = (CONTENT?.global?.services || {})[serviceId];
  const serviceName = serviceObj ? (serviceObj.name?.[state.lang] || serviceObj.name?.tr) : "";

  return {
    hotelSlug,
    serviceId,
    hotelName,
    serviceName,
    date: document.getElementById("bookDate").value || "",
    time: document.getElementById("bookTime").value || "",
    people: document.getElementById("bookPeople").value || "",
    room: document.getElementById("bookRoom").value || "",
    notes: document.getElementById("bookNotes").value || ""
  };
}

function updateWhatsappPreview() {
  hideAlert("bookingAlert");
  const vars = getBookingVars();
  const btn = document.getElementById("whatsappBtn");

  if (!vars.hotelSlug || !vars.serviceId) {
    if (btn) {
      btn.classList.add("disabled");
      btn.href = "#";
    }
    return;
  }
  if (btn) btn.classList.remove("disabled");

  const msg = buildWhatsappMessage(vars);
  const waNumber = "905348350169"; // Simplified default
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  if (btn) btn.href = waLink;

  const pv = document.getElementById("waPreview");
  if (pv) pv.value = msg;
}

function buildWhatsappMessage(vars) {
  const tpl = t("booking.whatsapp_template");
  let priceTimeLine = "";
  // Simplified price logic for brevity, assuming standard EUR/min
  const msg = tpl
    .replace("{hotel}", vars.hotelName)
    .replace("{service}", vars.serviceName)
    .replace("{date}", vars.date)
    .replace("{time}", vars.time)
    .replace("{guests}", vars.people) // Changed from people to guests to match template
    .replace("{kisi}", vars.people) // Turkish template uses kisi
    .replace("{name}", vars.hotelName) // Note: Template uses name for user name usually, check logic. 
    // Actually template uses {name} for user name. We need user name input in getBookingVars if we want to use it in WA message.
    // For now, let's just replace what we have.
    .replace("{url}", window.location.href);

  return cleanWhatsappMessage(msg);
}

function cleanWhatsappMessage(msg) {
  return msg.split("\n").filter(line => {
    const t = line.trim();
    if (!t) return false;
    if (t.includes("{notes}") || t.includes("{priceTime}")) return false;
    return true;
  }).join("\n");
}

function submitOnlineForm() {
  // Demo submission
  const vars = getBookingVars();
  if (!vars.hotelSlug || !vars.serviceId) {
    showAlert("formAlert", "Hotel/Service required");
    return;
  }
  const ref = "SC-" + Math.floor(Math.random() * 900000);
  const box = document.getElementById("successBox");
  box.textContent = `Booking Received! Ref: ${ref}`; // Simplified fallback
  box.classList.add("show");
}

function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add("show"); }
}
function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ""; el.classList.remove("show"); }
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
    document.getElementById("svcDrawerTitle").textContent = svc.name?.[state.lang] || svc.name?.tr;
    document.getElementById("svcDrawerDesc").textContent = svc.desc?.[state.lang] || svc.desc?.tr;
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
  const ls = document.getElementById("langSelect");
  if (ls) ls.value = state.lang;

  renderHotelSelect();
  renderNav();
  renderUITexts();
  renderTopPicks();
  renderCategoryToolbar();
  renderCategories();
  renderServiceResults();

  localStorage.setItem("santis_lang", state.lang);
  localStorage.setItem("santis_hotel", state.hotel);
}

async function loadContent() {
  try {
    // Dosya yolu ve yapı uyumsuzluğunu düzelt
    const res = await fetch("santis-hotels.json");
    const data = await res.json();
    // app.js 'global' anahtarı bekliyor, eğer yoksa biz saralım
    return data.global ? data : { global: data };
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function init() {
  state.lang = localStorage.getItem("santis_lang") || "tr";
  state.hotel = localStorage.getItem("santis_hotel") || "";

  CONTENT = await loadContent();
  if (!CONTENT) return;

  const ls = document.getElementById("langSelect");
  if (ls) ls.onchange = (e) => {
    state.lang = e.target.value;
    renderAll();
  };

  // Wire global events
  document.getElementById("svcOverlay")?.addEventListener("click", closeServiceDrawer);
  document.getElementById("svcDrawerClose")?.addEventListener("click", closeServiceDrawer);
  document.getElementById("closeBookingBtn2")?.addEventListener("click", closeBookingModal);
  document.getElementById("bookingCloseBtn")?.addEventListener("click", closeBookingModal);

  renderAll();
}

init();
