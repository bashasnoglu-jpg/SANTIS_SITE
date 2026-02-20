/* ==========================================================================
   SANTIS HOME-ENGINE v1.0
   Homepage-only code: Bento grid renderer, data bridge, WebSocket,
   content loader, cinematic intro, scroll observer, gallery renderer.
   Loaded ONLY on homepage via conditional script tag.
   Phase 7B-3 extraction from app.js monolith.
   ========================================================================== */

function renderHomeSections(data) {

  // FALLBACK IF DATA MISSING

  if (!data || !data.sections) {

    console.warn("Bento Core: Data invalid, utilizing fallback.");

    data = FALLBACK_HOME_DATA;

  }

  const main = document.getElementById('nv-main');

  if (!main) return;

  main.innerHTML = ''; // Clean slate

  // 🛡️ Auto-Depth Calculation for Assets

  // This ensures assets load correctly from ANY depth (e.g. tr/cilt-bakimi/)

  const getRoot = () => {

    if (window.SITE_ROOT) return window.SITE_ROOT;

    const depth = window.location.pathname.split('/').length - 2;

    return depth > 0 ? "../".repeat(depth) : "";

  };

  const root = getRoot();

  // A. HERO SECTION

  let heroData = null;

  if (data.sections.hero && data.sections.hero.items && data.sections.hero.items.length > 0) {

    heroData = data.sections.hero.items[0];

  } else {

    heroData = { title: "SANTIS CLUB", subtitle: "Wellness & Spa", image: "/assets/img/hero/santis_hero_main.webp", link: "#" };

  }

  // Prepend Root to Hero Image

  // Check if image is already absolute or relative-fixed, if not, prepend root

  const heroImg = (heroData.image.startsWith('http') || heroData.image.startsWith('../')) ? heroData.image : root + heroData.image;

  const heroHTML = `

        <section class="editorial-grid-engine" style="margin-bottom: 60px;">

            <div class="bento-card bento-hero" data-href="${heroData.link}">

                <img class="bento-img" src="${heroImg}" alt="${heroData.subtitle}" loading="eager" data-fallback-src="https://placehold.co/1920x1080?text=Santis+Club">

                <div class="bento-content">

                    <span class="bento-cat">FEATURED</span>

                    <h2 class="bento-title" style="font-size:3rem; margin-bottom:10px;">${heroData.title}</h2>

                    <p class="bento-desc" style="opacity:1; transform:none;">${heroData.subtitle}</p>

                </div>

            </div>

        </section>

    `;

  // B. BENTO GRID SECTIONS

  // Helper: Map legacy 'g-*' classes to Bento V6 classes

  const getBentoClass = (legacyClass) => {

    if (!legacyClass) return 'bento-box';

    if (legacyClass.includes('g-wide')) return 'bento-wide';

    if (legacyClass.includes('g-span-2')) return 'bento-tall'; // Vertical emphasis

    if (legacyClass.includes('g-focus')) return 'bento-tall';

    if (legacyClass.includes('g-overlap')) return 'bento-box';

    return 'bento-box'; // Default

  };

  // Helper to generate grid HTML

  const createBentoGrid = (items, id) => {

    if (!items) return '';

    return items.map((item, i) => {

      // Prepend Root to Card Images

      const itemImg = (item.image.startsWith('http') || item.image.startsWith('../')) ? item.image : root + item.image;

      // Resolve Class

      const className = getBentoClass(item.layout_class);

      return `

            <div class="bento-card ${className}" data-href="${item.link}">

                <img class="bento-img" src="${itemImg}" alt="${item.title}" loading="lazy">

                <div class="bento-content">

                    <span class="bento-cat">${item.badge || 'SANTIS'}</span>

                    <h3 class="bento-title">${item.title}</h3>

                    <p class="bento-desc">${item.subtitle || ''}</p>

                </div>

            </div>

        `}).join('');

  };

  const safeItems = (sec) => (data.sections[sec] ? data.sections[sec].items : []);

  const slots = [

    ...safeItems("grid-hammam"),

    ...safeItems("grid-massages"),

    ...safeItems("grid-skincare")

  ];

  const gridHTML = `

        <section class="editorial-grid-engine" id="bento-grid">

            ${createBentoGrid(slots, 'main-grid')}

        </section>

    `;

  main.innerHTML = heroHTML + gridHTML + "<div style='height:100px;'></div>"; // Spacer

  // CSP-safe navigation and image fallback bindings.
  main.querySelectorAll('.bento-card[data-href]').forEach(card => {
    if (card.dataset.navBound === '1') return;
    card.dataset.navBound = '1';
    card.addEventListener('click', (event) => {
      if (event.target.closest('a') || event.target.closest('button') || event.target.closest('input')) return;
      const href = card.getAttribute('data-href');
      if (href) window.location.href = href;
    });
  });

  main.querySelectorAll('img[data-fallback-src]').forEach(img => {
    if (img.dataset.fallbackBound === '1') return;
    img.dataset.fallbackBound = '1';
    const fallback = img.getAttribute('data-fallback-src');
    if (!fallback) return;
    img.addEventListener('error', () => {
      if (img.getAttribute('src') !== fallback) img.setAttribute('src', fallback);
    }, { once: true });
  });

}

// 🛡️ FALLBACK DATA (Fail-Safe)

// 🛡️ FALLBACK DATA (Fail-Safe)

// Using var to prevent SyntaxError if script is loaded twice

var FALLBACK_HOME_DATA = window.FALLBACK_HOME_DATA || {

  sections: {

    "grid-hammam": { items: [] },

    "grid-massages": { items: [] },

    "grid-skincare": { items: [] },

    "hero": { items: [{ title: "SANTIS", subtitle: "System Offline", image: "", link: "#" }] }

  }

};

window.FALLBACK_HOME_DATA = FALLBACK_HOME_DATA;

(async () => {

  // 🛡️ Auto-Depth Helper

  const determineRoot = () => {

    if (window.SITE_ROOT) return window.SITE_ROOT;

    const depth = window.location.pathname.split('/').length - 2;

    return depth > 0 ? "../".repeat(depth) : "";

  };

  try {

    // ✅ Correct Path: Assets (Public) instead of Admin (Private)

    // ✅ Dynamic Path Handling for Sub-pages

    const root = determineRoot();

    const response = await fetch(`${root}assets/data/home_data.json`);

    if (response.ok) {

      homeData = await response.json();

      console.log("🧠 Santis Brain Loaded (JSON Mode)");

      // Trigger Render if needed or rely on existing flow

      // if (document.getElementById('grid-hammam')) {
      //   renderHomeSections(homeData);
      // }
      console.log("🍱 Bento Core: Static Mode Active (Render Skipped)");
    } else {

      throw new Error("HTTP " + response.status);

    }

  } catch (e) {

    console.warn("⚠️ Santis Brain Offline (Using Fallback):", e);

    homeData = FALLBACK_HOME_DATA;

  }

  // Call render here if logic was blocked, but original code continued below.

  if (homeData) {

    // renderHomeSections(homeData);

  }

  // 🔬 NEURAL LINK (WebSocket V3.0 - Smart Connect)

  // Only attempts connection if server responds to health check

  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const ENABLE_NEURAL_LINK = isLocalDev;

  if (ENABLE_NEURAL_LINK) {

    const host = "localhost:8000";

    // 🛡️ Pre-flight check: Verify server is running before WebSocket attempt

    // This prevents console spam from failed WebSocket connections

    (async () => {

      try {

        // Quick health check with timeout

        const controller = new AbortController();

        const timeout = setTimeout(() => controller.abort(), 1000); // 1 second timeout

        const response = await fetch(`http://${host}/health`, {

          method: 'GET',

          signal: controller.signal

        }).catch(() => null);

        clearTimeout(timeout);

        if (!response || !response.ok) {

          // Server not available - stay silent

          console.log("🧘 Neural Link: Zen Mode (Server offline)");

          return;

        }

        // Server is available, now establish WebSocket

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        const wsUrl = `${protocol}//${host}/ws`;

        const socket = new WebSocket(wsUrl);

        socket.onerror = () => {

          console.log("🔸 Neural Link: Passive Mode (WS endpoint unavailable)");

        };

        socket.onopen = () => console.log("🟢 Neural Link Established");

        socket.onmessage = async (event) => {

          try {

            const msg = JSON.parse(event.data);

            if (msg.type === 'update' && msg.file === 'home_data.json') {

              console.log("⚡ Neural Pulse Received: Updating Grid...");

              const res = await fetch('/assets/data/home_data.json?t=' + Date.now());

              if (res.ok) {

                // renderHomeSections(await res.json());
                console.log("✨ Grid Synced with Hive Mind (Render Disabled for Stability)");

              }

            }

          } catch (err) { console.warn("Neural Pulse Error:", err); }

        };

        socket.onclose = () => console.log("🔴 Neural Link Severed");

      } catch (e) {

        // Health check failed silently - don't spam console

        console.log("🧘 Neural Link: Zen Mode (Offline)");

      }

    })();

  } else {

    // Default State

    console.log("🧘 Santis Brain: Zen Mode (Disabled)");

  }

  // 🎩 SANTIS CONCIERGE (Frontend Injection)

  // Auto-activates if Neural Link is enabled or forced

  // 🎩 SANTIS CONCIERGE (Legacy Injection Removed)
  // Now handled by static script tags in index.html (concierge-engine + ui)
  if (false) {
    // cleaned up
  }

})();


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
