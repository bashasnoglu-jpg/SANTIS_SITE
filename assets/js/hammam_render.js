/* ==========================================================================
   SANTIS CLUB - HAMMAM RENDER LOGIC (v2)
   - Fallback: NV_HAMAM_RITUALS yoksa santis-hotels.json -> categoryId=hammam
   - Discover: top 6
   - ZigZag: all
   ========================================================================== */

(function () {
    if (window.__NV_HAMAM_INIT__) return;
    window.__NV_HAMAM_INIT__ = true;

    const DEFAULT_CATEGORY_ID = "hammam";
    const FALLBACK_IMG =
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1400";

    function resolveLang() {
        const qs = new URLSearchParams(location.search);
        return qs.get("lang") || document.documentElement.lang || "tr";
    }

    async function fetchJSONSmart() {
        // Hem root hem relative ihtimalleri dene (local dev klasörlerine göre)
        const candidates = [
            "/data/santis-hotels.json",
            "data/santis-hotels.json",
            "../data/santis-hotels.json",
            "../../data/santis-hotels.json",
        ];

        for (const url of candidates) {
            try {
                const res = await fetch(url, {
                    cache: "no-store"
                });
                if (res.ok) return await res.json();
            } catch (_) { }
        }
        return null;
    }

    async function getRituals() {
        // 1) Direkt global data varsa onu kullan
        if (Array.isArray(window.NV_HAMAM_RITUALS) && window.NV_HAMAM_RITUALS.length) {
            return window.NV_HAMAM_RITUALS;
        }
        // 2) Yoksa JSON'dan üret
        const data = await fetchJSONSmart();
        if (!data || !data.services) return [];

        const lang = resolveLang();

        const services = Object.entries(data.services)
            .map(([key, s]) => ({
                key,
                s
            }))
            .filter(({
                s
            }) => s && s.categoryId === DEFAULT_CATEGORY_ID);

        return services.map(({
            key,
            s
        }) => {
            const title = s.name?.[lang] || s.name?.en || key;
            const desc = s.desc?.[lang] || s.desc?.en || "";
            const duration = s.durationMin ? `${s.durationMin} DK` : (s.duration || "");
            const tier = (s.tier || s.collection || "Signature").toString();
            const price = s.price != null ? `${s.price} ${s.currency || ""}`.trim() : null;

            return {
                id: key,
                href: `/service.html?service=${encodeURIComponent(key)}&lang=${encodeURIComponent(
                    lang
                )}#${DEFAULT_CATEGORY_ID}`,
                img: s.img || FALLBACK_IMG,
                title,
                desc,
                duration,
                tier,
                price,
                cart: {
                    id: key,
                    name: title,
                    price: s.price ?? 0,
                    cat: "Hamam",
                },
            };
        });
    }

    async function renderDiscover(container) {
        if (!container) return;
        const data = await getRituals();
        const top = data.slice(0, 6);

        container.innerHTML = top
            .map(
                (item) => `
        <div class="nv-pin" onclick="window.location.href='${item.href}'">
          <img src="${item.img}" alt="${item.title}" class="nv-pin-img" loading="lazy">
          <div class="nv-pin-content">
            <div class="nv-pin-meta">${item.duration} • ${item.tier}</div>
            <h3 class="nv-pin-title">${item.title}</h3>
          </div>
        </div>
      `
            )
            .join("");
    }

    async function renderZigZag(container) {
        if (!container) return;
        const data = await getRituals();

        container.innerHTML = data
            .map(
                (item) => `
        <article class="nv-z-item">
          <div class="nv-z-visual">
            <img src="${item.img}" alt="${item.title}" class="nv-z-img" loading="lazy">
          </div>

          <div class="nv-z-content">
            <span class="nv-z-badge">${item.tier} COLLECTION</span>
            <h2 class="nv-z-title">${item.title}</h2>
            <p class="nv-z-desc">${item.desc}</p>

            <div class="nv-z-specs">
              <div class="nv-spec-item">SÜRE<span class="nv-spec-val">${item.duration}</span></div>
              <div class="nv-spec-item">FİYAT<span class="nv-spec-val">${item.price || "Fiyat sorunuz"}</span></div>
              <div class="nv-spec-item">YOĞUNLUK<span class="nv-spec-val">Orta-Sert</span></div>
            </div>

            <div class="nv-z-actions">
              <a href="${item.href}" class="btn-ed-secondary">HİKAYEYİ OKU</a>
              <button class="btn-ed-primary" onclick="handleAddToCart('${item.id}', event)">
                SEPETE EKLE +
              </button>
            </div>
          </div>
        </article>
      `
            )
            .join("");
    }
    // Global Handler for Add to Cart (safe)
    window.handleAddToCart = async function (id, ev) {
        ev?.stopPropagation?.();

        const data = await getRituals();
        const item = data.find((i) => i.id === id);

        if (!item) return console.error("Cart: item not found", id);
        if (!window.SHOP?.addToCart) return console.error("Cart: SHOP.addToCart missing");

        window.SHOP.addToCart({
            id: item.cart?.id || item.id,
            name: item.cart?.name || item.title,
            price: item.cart?.price ?? 0,
            img: item.img,
            cat: item.cart?.cat || "Hamam",
        });
    };

    async function initHammamList() {
        const discoverContainer = document.getElementById("hammamDiscover");
        const zigZagContainer = document.getElementById("hammamZigZag");

        await renderDiscover(discoverContainer);
        await renderZigZag(zigZagContainer);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHammamList);
    } else {
        initHammamList();
    }
})();
