(() => {

  try {

    const head = document.head;

    if (!head) return;



    // perf-head.js'in konumundan site root'unu bul (GitHub Pages repo path uyumlu)

    const cs = document.currentScript;

    const base = cs && cs.src ? new URL("../..", cs.src) : new URL(location.href);



    const ensureLink = (attrs) => {

      const rel = attrs.rel;

      const href = attrs.href;

      if (rel && href) {

        const exists = head.querySelector(`link[rel="${rel}"][href="${href}"]`);

        if (exists) return;

      }

      const link = document.createElement("link");

      Object.entries(attrs).forEach(([k, v]) => {

        if (v == null) return;

        if (k === "crossorigin") link.crossOrigin = v;

        else if (k === "fetchpriority") link.setAttribute("fetchpriority", String(v));

        else link.setAttribute(k, String(v));

      });

      head.appendChild(link);

    };



    // Fonts: now self-hosted; external preconnect removed




    // Placeholders: varsayılan olarak preload etme; gerekirse <html data-preload-placeholders="true"> ile aç

    const allowPages = new Set([]);

    const datasetFlag =

      document.documentElement &&

      document.documentElement.dataset &&

      document.documentElement.dataset.preloadPlaceholders;



    const rawPath = (location.pathname || "/").replace(/\/+$/, "");

    const lastSegment = rawPath.split("/").pop() || "";

    const pageName = lastSegment.includes(".")

      ? lastSegment.toLowerCase()

      : "index.html";

    const shouldPreloadPlaceholders =

      datasetFlag === "true" || allowPages.has(pageName);



    if (shouldPreloadPlaceholders) {

      // Page-specific placeholder needs

      const placeholderMap = {};



      const list =

        placeholderMap[pageName] ||

        (datasetFlag === "true"

          ? [

            "/images/placeholders/service-hero.svg",

            "/images/placeholders/service-card.svg",

            "/images/placeholders/category-hero.svg",

          ]

          : []);



      list.forEach((href) => {

        ensureLink({ rel: "preload", href, as: "image", type: "image/svg+xml" });

      });

    }



    // Opsiyonel: sayfa özel hero preload (ileride gerçek foto gelince)

    // <html data-hero-preload="images/hero/home.webp"> gibi.

    const customHero = document.documentElement && document.documentElement.dataset

      ? document.documentElement.dataset.heroPreload

      : "";

    if (customHero) {

      const href = new URL(customHero, base).href;



      // Basit MIME tespiti (minimal, güvenli)

      const lower = String(customHero).toLowerCase();

      let mime = "";

      if (lower.endsWith(".webp")) mime = "image/webp";

      else if (lower.endsWith(".webp")) mime = "image/png";

      else if (lower.endsWith(".webp") || lower.endsWith(".webp")) mime = "image/jpeg";

      else if (lower.endsWith(".svg")) mime = "image/svg+xml";



      const attrs = { rel: "preload", href, as: "image", fetchpriority: "high" };

      if (mime) attrs.type = mime;

      ensureLink(attrs);

    }

  } catch (e) {

    console.warn("perf-head init failed", e);

  }

})();



// 🌊 UNIVERSAL PRELOADER KILLER (Fail-safe for all pages)

(function () {

  const liftVeil = () => {

    const p = document.getElementById('preloader');

    if (p && !p.classList.contains('hidden')) {

      p.classList.add('hidden');

      setTimeout(() => { if (p) p.style.display = 'none'; }, 800);

      console.log("🌊 Santis: Preloader veil lifted.");

    }

  };

  window.addEventListener('load', () => setTimeout(liftVeil, 1000));

  document.addEventListener('DOMContentLoaded', () => setTimeout(liftVeil, 2000));

  setTimeout(liftVeil, 3000); // hard fallback
})();

// Hreflang injector now lives in assets/js/hreflang-loader.js
