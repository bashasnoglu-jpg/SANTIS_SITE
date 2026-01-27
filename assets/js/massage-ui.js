// assets/js/massage-ui.js
// SANTIS — Massage List UI
// Adapted from skincare-ui.js with Hotel Filtering Support

(function () {
    const CATS_ORDER = [
        "classicMassages",
        "sportsTherapy",
        "asianMassages",
        "signatureCouples",
        "kidsFamily"
    ];

    const $list = () => document.getElementById("nvList");
    const $search = () => document.getElementById("nvSearch");
    const $chips = () => document.getElementById("nvChips");

    const safe = (v) => String(v ?? "");
    const norm = (v) => safe(v).toLowerCase().trim();

    // Helper to get current hotel param
    function getHotelSlug() {
        const p = new URLSearchParams(window.location.search);
        return p.get("hotel") || null; // e.g. "alba-royal"
    }

    function priceLabel(price) {
        if (typeof window.NV_MASSAGE_PRICE_LABEL === "function") return window.NV_MASSAGE_PRICE_LABEL(price);
        return !price ? "Fiyat sorunuz" : `${price}€`;
    }

    // Filter available items based on hotel
    function filterByHotel(items) {
        const hotel = getHotelSlug();
        if (!hotel) return items; // If no hotel selected, show all (or could default to a specific logic)

        return items.filter(item => {
            // If item has no hotelSlugs defined, assume available everywhere? 
            // Better to assume strict if defined.
            if (!item.hotelSlugs) return true;
            return item.hotelSlugs.includes(hotel);
        });
    }

    function buildChips(availableCats, activeCat, onChange) {
        const root = $chips();
        if (!root) return;

        root.innerHTML = "";
        const labels = window.NV_MASSAGE_CATEGORY_LABELS || {};

        // Always show "Tümü"
        const items = [{ key: "all", label: "Tümü" }];

        // Add categories ONLY if they exist in the available items (after hotel filter)
        CATS_ORDER.forEach(k => {
            if (availableCats.has(k) && labels[k]) {
                items.push({ key: k, label: labels[k] });
            }
        });

        items.forEach((it) => {
            const btn = document.createElement("button");
            btn.className = "nv-chip";
            btn.type = "button";
            btn.textContent = it.label;
            btn.setAttribute("aria-pressed", String(activeCat === it.key));
            btn.addEventListener("click", () => onChange(it.key));
            root.appendChild(btn);
        });
    }

    function groupByCategory(list) {
        const map = new Map();
        list.forEach((x) => {
            const cat = x.category || "other";
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat).push(x);
        });
        return map;
    }

    function cardHTML(x) {
        // Fallback HREF
        const href = x.href || ("/service-detail.html?slug=" + encodeURIComponent(x.slug || x.id));
        return `
      <a class="nv-card" href="${href}" data-id="${safe(x.id)}">
        <div class="nv-cardImg">
          <img loading="lazy" src="${x.img}" alt="${safe(x.title)}" width="600" height="400" />
        </div>

        <div class="nv-cardBody">
          <div class="nv-cardTop">
            <h3 class="nv-cardTitle">${safe(x.title)}</h3>
            <div class="nv-cardMeta">${safe(x.duration)}</div>
          </div>

          <p class="nv-cardDesc">${safe(x.desc)}</p>

          <div class="nv-cardBottom">
            <span class="nv-pill">${safe(x.tier)}</span>
            <span class="nv-price">${priceLabel(x.price)}</span>
          </div>
        </div>
      </a>
    `;
    }

    function render(list, activeCat, labels) {
        const root = $list();
        if (!root) return;

        root.innerHTML = "";

        if (!list.length) {
            root.innerHTML = `<div class="nv-empty">Sonuç bulunamadı.</div>`;
            return;
        }

        const grouped = groupByCategory(list);

        // Determine which cats to render sections for
        const cats =
            activeCat && activeCat !== "all"
                ? [activeCat]
                : CATS_ORDER.filter((c) => grouped.has(c));

        cats.forEach((cat) => {
            const items = grouped.get(cat) || [];
            if (!items.length) return;

            const section = document.createElement("section");
            section.className = "nv-section";
            section.id = cat; // Allow #anchor linking

            const h = document.createElement("h2");
            h.className = "nv-sectionTitle";
            h.textContent = labels[cat] || cat;
            section.appendChild(h);

            const grid = document.createElement("div");
            grid.className = "nv-grid";
            grid.innerHTML = items.map(cardHTML).join("");
            section.appendChild(grid);

            root.appendChild(section);
        });
    }

    function applyFilters() {
        // 1. Get Base Data (Check Plural THEN Singular)
        const all = Array.isArray(window.NV_MASSAGES) ? window.NV_MASSAGES : (Array.isArray(window.NV_MASSAGE) ? window.NV_MASSAGE : []);

        // 2. Filter by Hotel First (Strict Rule: Alba Royal -> No Kids)
        const hotelFiltered = filterByHotel(all);

        // 3. User Inputs
        const q = $search() ? norm($search().value) : "";
        const activeCat = window.__NV_ACTIVE_MASSAGE_CAT || "all";

        // 4. Filter by Text & Category
        let displayList = hotelFiltered;

        if (activeCat !== "all") {
            displayList = displayList.filter((x) => x.category === activeCat);
        }

        if (q) {
            displayList = displayList.filter((x) => {
                const hay = norm([x.title, x.desc, x.tier, x.category, (x.tags || []).join(" ")].join(" "));
                return hay.includes(q);
            });
        }

        // 5. Re-render
        // Pass 'hotelFiltered' to group logic to know which categories actally exist for this hotel (for chips)
        const availableCats = groupByCategory(hotelFiltered); // Map of cats available for this hotel

        // Re-build chips if hotel changed (or first load)
        buildChips(availableCats, activeCat, (newCat) => {
            window.__NV_ACTIVE_MASSAGE_CAT = newCat;
            applyFilters(); // Recursion but safe as we just update state
        });

        render(displayList, activeCat, window.NV_MASSAGE_CATEGORY_LABELS || {});
    }

    document.addEventListener("DOMContentLoaded", () => {
        const root = $list();
        if (!root) return;

        const hasData = Array.isArray(window.NV_MASSAGES) || Array.isArray(window.NV_MASSAGE);
        if (!hasData) {
            root.innerHTML = `<div class="nv-empty">Masaj verisi bulunamadı. (massage-data.js yüklü mü?)</div>`;
            return;
        }

        window.__NV_ACTIVE_MASSAGE_CAT = "all";

        if ($search()) $search().addEventListener("input", applyFilters);

        applyFilters();
    });
})();
