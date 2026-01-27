// assets/js/skincare-ui.js
// SANTIS — Skincare List UI

(function () {
    const CATS_ORDER = [
        "classicFacials",
        "hydrationGlow",
        "antiAgingLift",
        "targetedCare",
        "advancedAesthetics",
        "miniPrograms",
    ];

    const $list = () => document.getElementById("nvList");
    const $search = () => document.getElementById("nvSearch");
    const $chips = () => document.getElementById("nvChips");

    const safe = (v) => String(v ?? "");
    const norm = (v) => safe(v).toLowerCase().trim();

    function priceLabel(price) {
        if (typeof window.NV_SKINCARE_PRICE_LABEL === "function") return window.NV_SKINCARE_PRICE_LABEL(price);
        return !price ? "Fiyat sorunuz" : `${price}€`;
    }

    function buildChips(activeCat, onChange) {
        const root = $chips();
        if (!root) return;

        root.innerHTML = "";
        const labels = window.NV_SKINCARE_CATEGORY_LABELS || {};

        const items = [
            { key: "all", label: "Tümü" }
        ]
            .concat(CATS_ORDER.filter((k) => labels[k]).map((k) => ({ key: k, label: labels[k] })));

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
        return `
      <a class="nv-card" href="${x.href}" data-id="${safe(x.id)}">
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

    function render(list, activeCat) {
        const root = $list();
        if (!root) return;

        root.innerHTML = "";

        if (!list.length) {
            root.innerHTML = `<div class="nv-empty">Sonuç bulunamadı.</div>`;
            return;
        }

        const labels = window.NV_SKINCARE_CATEGORY_LABELS || {};
        const grouped = groupByCategory(list);

        const cats =
            activeCat && activeCat !== "all"
                ? [activeCat]
                : CATS_ORDER.filter((c) => grouped.has(c)).concat(
                    [...grouped.keys()].filter((k) => !CATS_ORDER.includes(k))
                );

        cats.forEach((cat) => {
            const items = grouped.get(cat) || [];
            if (!items.length) return;

            const section = document.createElement("section");
            section.className = "nv-section";

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
        const all = Array.isArray(window.NV_SKINCARE) ? window.NV_SKINCARE : [];
        const q = $search() ? norm($search().value) : "";
        const activeCat = window.__NV_ACTIVE_SKINCARE_CAT || "all";

        let filtered = all;

        if (activeCat !== "all") {
            filtered = filtered.filter((x) => x.category === activeCat);
        }

        if (q) {
            filtered = filtered.filter((x) => {
                const hay = norm([x.title, x.desc, x.tier, x.duration, x.category].join(" "));
                return hay.includes(q);
            });
        }

        render(filtered, activeCat);
    }

    document.addEventListener("DOMContentLoaded", () => {
        const root = $list();
        if (!root) return;

        if (!window.NV_SKINCARE) {
            root.innerHTML = `<div class="nv-empty">NV_SKINCARE bulunamadı. (skincare-data.js yüklü mü?)</div>`;
            return;
        }

        window.__NV_ACTIVE_SKINCARE_CAT = "all";

        const onChipChange = (cat) => {
            window.__NV_ACTIVE_SKINCARE_CAT = cat;
            buildChips(cat, onChipChange);
            applyFilters();
        };

        buildChips("all", onChipChange);

        if ($search()) $search().addEventListener("input", applyFilters);

        applyFilters();
    });
})();
