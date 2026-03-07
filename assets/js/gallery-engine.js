/**
 * assets/js/gallery-engine.js
 * Phase Visual — Santis Gallery Engine v1.0
 * API-driven masonry gallery: filter, lightbox, Phase J live price, Phase O scarcity badge.
 */
(function () {
  'use strict';

  const API = '/api/v1/media/assets';
  const LANG = document.documentElement.getAttribute('lang') || 'tr';
  const CATS = [
    { key: 'all', label: { tr: 'Tümü', en: 'All' } },
    { key: 'hamam', label: { tr: 'Hamam', en: 'Hamam' } },
    { key: 'masaj', label: { tr: 'Masaj', en: 'Massage' } },
    { key: 'cilt', label: { tr: 'Cilt Bakımı', en: 'Skincare' } },
    { key: 'diger', label: { tr: 'Genel', en: 'General' } },
  ];

  let allAssets = [];
  let activeCategory = 'all';
  let lightboxEl = null;
  let currentMultiplier = 1.0;

  /* ─── Fetch ──────────────────────────────────────────────────── */
  async function fetchAssets() {
    try {
      const res = await fetch(`${API}?lang=${LANG}&v=${Date.now()}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      allAssets = data.assets || [];
      currentMultiplier = data.multiplier || 1.0;
      if (allAssets.length === 0) throw new Error('API returned empty assets');
    } catch {
      // FALLBACK: use window.GALLERY_DATA or built-in gallery directory images
      console.warn('📸 Gallery: API unavailable, using local fallback data.');
      if (window.GALLERY_DATA && window.GALLERY_DATA.length) {
        allAssets = window.GALLERY_DATA.map((d, i) => ({
          id: i + 1,
          src: `/assets/img/gallery/${d.file}`,
          thumb: `/assets/img/gallery/${d.file}`,
          category: d.category,
          alt: d.caption,
          caption: d.caption
        }));
      } else {
        // Hard-coded fallback from gallery directory
        allAssets = [
          { id: 1, src: '/assets/img/gallery/santis_card_hammam_v1.webp', category: 'hamam', alt: 'Geleneksel Türk Hamamı', caption: 'Geleneksel Türk Hamamı' },
          { id: 2, src: '/assets/img/gallery/Hammamda köpük masajı huzuru.webp', category: 'hamam', alt: 'Hammamda köpük masajı huzuru', caption: 'Köpük Masajı Ritüeli' },
          { id: 3, src: '/assets/img/gallery/santis_card_couple_v1.webp', category: 'masaj', alt: 'Çift Masajı Couple Suite', caption: 'Çift Masajı (Couple Suite)' },
          { id: 4, src: '/assets/img/gallery/Altın yağı ve ellerin zarafeti.webp', category: 'masaj', alt: 'Altın yağı ve ellerin zarafeti', caption: 'Altın Yağı Masajı' },
          { id: 5, src: '/assets/img/gallery/Şirodhara terapi anı.webp', category: 'masaj', alt: 'Şirodhara terapi anı', caption: 'Şirodhara Terapisi' },
          { id: 6, src: '/assets/img/gallery/santis_card_skincare_v1.webp', category: 'cilt', alt: 'Sothys Cilt Bakımı', caption: 'Sothys Cilt Bakımı' },
          { id: 7, src: '/assets/img/gallery/Santis-face-mask-4x5-1080x1350.webp', category: 'cilt', alt: 'Yüz Maskesi Uygulaması', caption: 'Premium Yüz Maskesi' },
          { id: 8, src: '/assets/img/gallery/Santis_cellulite_yatay_3x2_quietlux.webp', category: 'cilt', alt: 'Selülit bakımı', caption: 'Selülit Bakım Ritüeli' },
          { id: 9, src: '/assets/img/gallery/hero-general.webp', category: 'diger', alt: 'Santis Lounge & Relax', caption: 'Santis Lounge & Relax' },
          { id: 10, src: '/assets/img/gallery/Anjali Mudra with soft lighting.webp', category: 'diger', alt: 'Anjali Mudra meditasyon', caption: 'Meditasyon & Huzur' },
          { id: 11, src: '/assets/img/gallery/Namaste elleri ve tütsü dumanı.webp', category: 'diger', alt: 'Namaste elleri ve tütsü dumanı', caption: 'Namaste Ritüeli' },
          { id: 12, src: '/assets/img/gallery/Gemini_Generated_Image_gw02fdgw02fdgw02.webp', category: 'diger', alt: 'Spa Atmosferi', caption: 'Santis Spa Atmosferi' },
          { id: 13, src: '/assets/img/gallery/Gemini_Generated_Image_jq8hzwjq8hzwjq8h.webp', category: 'hamam', alt: 'Hamam Detay', caption: 'Hamam İç Mekan' },
        ];
      }
    }
  }

  /* ─── Render Filter Bar ──────────────────────────────────────── */
  function renderFilterBar() {
    const bar = document.querySelector('.nv-gallery-filter') ||
      document.querySelector('.filter-bar') ||
      createFilterBar();
    bar.innerHTML = '';

    CATS.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'gal-filter-btn' + (cat.key === activeCategory ? ' active' : '');
      btn.textContent = cat.label[LANG] || cat.label.tr;
      btn.dataset.cat = cat.key;
      btn.addEventListener('click', () => {
        activeCategory = cat.key;
        renderFilterBar();
        renderGrid(true);
      });
      bar.appendChild(btn);
    });
  }

  function createFilterBar() {
    const bar = document.createElement('div');
    bar.className = 'nv-gallery-filter';
    const grid = document.getElementById('gallery-grid');
    grid.parentNode.insertBefore(bar, grid);
    return bar;
  }

  /* ─── Render Grid ─────────────────────────────────────────────── */
  function renderGrid(animate = false) {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    const filtered = activeCategory === 'all'
      ? allAssets
      : allAssets.filter(a => a.category === activeCategory);

    if (animate) {
      grid.style.opacity = '0';
      grid.style.transform = 'translateY(12px)';
    }

    console.log(`[Gallery Engine] Rendering grid... Category: ${activeCategory} | Total Filtered Assets: ${filtered.length}`);
    if (!grid) {
      console.error('[Gallery Engine] CRITICAL: #gallery-grid not found in DOM!');
      return;
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
      console.warn(`[Gallery Engine] Empty category. Original fetched assets: ${allAssets.length}`);
      grid.innerHTML = `<p class="gal-empty">${LANG === 'tr' ? 'Bu kategoride görsel yok.' : 'No images in this category.'}</p>`;
    } else {
      let injectedCards = 0;
      filtered.forEach((asset, i) => {
        const card = buildCard(asset, i);
        grid.appendChild(card);
        injectedCards++;
      });
      console.log(`[Gallery Engine] Successfully injected ${injectedCards} .gal-card elements.`);
    }

    // Forces immediate visibility without waiting for frame animations that might fail
    grid.style.transition = 'none';
    grid.style.opacity = '1';
    grid.style.transform = 'translateY(0)';
  }

  function buildCard(asset, index) {
    const card = document.createElement('div');
    card.className = 'gal-card';
    card.style.animationDelay = `${index * 0.04}s`;

    // URL düzeltme: Root-relative path zorla (Sovereign Fix)
    let url = asset.url || asset.src || '';
    if (url && !url.startsWith('/') && !url.startsWith('http')) {
      url = '/' + url;
    }

    // Surge badge
    const surgeBadge = currentMultiplier > 1.1
      ? `<span class="gal-surge-badge">${currentMultiplier.toFixed(2)}× SURGE</span>`
      : '';

    // Scarcity badge
    const scarcityBadge = asset.is_scarce
      ? `<span class="gal-scarcity-badge">⬥ ${asset.scarcity_label || 'Limited'}</span>`
      : '';

    const caption = asset.caption || '';

    card.innerHTML = `
      <div class="gal-img-wrap">
        <img
          src="${url}"
          alt="Santis ${asset.category} — ${caption}"
          loading="lazy"
          decoding="async"
          width="600"
          height="400"
        />
        <div class="gal-overlay">
          <div class="gal-overlay-inner">
            ${surgeBadge}
            ${scarcityBadge}
            <p class="gal-caption">${caption}</p>
            <button class="gal-cta" data-service="${asset.linked_service_id || ''}">
              ${LANG === 'tr' ? 'Rezervasyon Yap' : 'Book Now'} →
            </button>
          </div>
        </div>
      </div>
    `;

    // Click → lightbox
    const imgEl = card.querySelector('.gal-img-wrap img');
    imgEl.addEventListener('click', () => openLightbox(asset));

    // ─── Phase S / Phase 20: Predictive Intent Tracking ───
    let hoverTimer = null;
    let lastX = 0, lastY = 0;
    let enterTime = 0;

    imgEl.addEventListener('mousemove', (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
    });

    imgEl.addEventListener('mouseenter', () => {
      enterTime = Date.now();
      hoverTimer = setTimeout(() => {
        // Trigger Whisper prediction after 3 seconds
        dispatchVisualIntent(asset.category, lastX, lastY, asset.id, 3000, false);
      }, 3000);
    });
    imgEl.addEventListener('mouseleave', () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      const dwellTime = Date.now() - enterTime;
      // Phase 20 Intent Ping: If they stared long enough but didn't trigger whisper, still dispatch to HQ Radar
      if (dwellTime > 500 && dwellTime < 3000) {
        dispatchVisualIntent(asset.category, lastX, lastY, asset.id, dwellTime, true);
      }
    });
    // ───────────────────────────────────────

    // CTA → reservation
    card.querySelector('.gal-cta').addEventListener('click', (e) => {
      e.stopPropagation();
      const modal = document.getElementById('nv-reservation-modal');
      if (modal) { modal.classList.add('open'); }
      else { window.location.href = `/${LANG}/rezervasyon/`; }
    });

    return card;
  }

  /* ─── Lightbox ───────────────────────────────────────────────── */
  function buildLightbox() {
    const el = document.createElement('div');
    el.id = 'nv-gallery-lightbox';
    el.innerHTML = `
      <div class="gal-lb-backdrop"></div>
      <div class="gal-lb-panel">
        <button class="gal-lb-close">✕</button>
        <img class="gal-lb-img" src="" alt="" />
        <div class="gal-lb-info">
          <p class="gal-lb-caption"></p>
          <div class="gal-lb-meta"></div>
          <button class="gal-lb-book">${LANG === 'tr' ? 'Rezervasyon Yap' : 'Book Now'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelector('.gal-lb-backdrop').addEventListener('click', closeLightbox);
    el.querySelector('.gal-lb-close').addEventListener('click', closeLightbox);
    el.querySelector('.gal-lb-book').addEventListener('click', () => {
      const modal = document.getElementById('nv-reservation-modal');
      if (modal) modal.classList.add('open');
      closeLightbox();
    });
    return el;
  }

  function openLightbox(asset) {
    if (!lightboxEl) lightboxEl = buildLightbox();
    lightboxEl.querySelector('.gal-lb-img').src = asset.url || asset.src;
    lightboxEl.querySelector('.gal-lb-img').alt = asset.caption || 'Santis';
    lightboxEl.querySelector('.gal-lb-caption').textContent = asset.caption || '';
    lightboxEl.querySelector('.gal-lb-meta').innerHTML =
      `<span class="gal-lb-cat">${asset.category.toUpperCase()}</span>` +
      (asset.is_scarce ? `<span class="gal-lb-scarce">⬥ Limited Availability</span>` : '');
    lightboxEl.style.display = 'flex';
    requestAnimationFrame(() => lightboxEl.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('open');
    setTimeout(() => { lightboxEl.style.display = 'none'; }, 300);
    document.body.style.overflow = '';
  }

  /* ─── Phase S / 20: Predictive Offers & Radar ───────────────── */
  let lastIntentTime = 0;

  async function dispatchVisualIntent(category, x, y, asset_id = null, dwell_time = 0, skip_whisper = false) {
    const now = Date.now();

    // Phase 20: Always fire Async Fire & Forget Heatmap Track for Radar
    fetch('/api/v1/analytics/track_heatmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x: x || 0,
        y: y || 0,
        category: category,
        element: '.gal-card',
        asset_id: asset_id,
        dwell_time: dwell_time
      })
    }).catch(e => console.error("Heatmap tracking failed", e));

    // If only radar ping was requested, abort predictive whisper
    if (skip_whisper) return;

    // Throttle actual pop-up offers to once every 30s
    if (now - lastIntentTime < 30000) return;
    lastIntentTime = now;

    try {
      const res = await fetch('/api/v1/predictive/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category,
          duration_seconds: 3, // Captured by the setTimeout threshold
          guest_id: getGuestId()
        })
      });
      const data = await res.json();
      if (data.status === 'offer_generated' && data.offer) {
        showPulseWhisper(data.offer);
      }
    } catch (e) {
      console.error('Phase S Intent tracking failed', e);
    }
  }

  function getGuestId() {
    let gid = localStorage.getItem('santis_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('santis_guest_id', gid);
    }
    return gid;
  }

  function showPulseWhisper(offer) {
    let whisper = document.getElementById('santis-pulse-whisper');
    if (!whisper) {
      whisper = document.createElement('div');
      whisper.id = 'santis-pulse-whisper';
      document.body.appendChild(whisper);
    }

    // Clear existing timer if any
    if (window.santisFlashTimer) clearInterval(window.santisFlashTimer);

    const isPackage = offer.is_package;
    const icon = isPackage ? '✦' : '✧';
    const buttonText = isPackage ? 'Claim Ritual' : 'Accept Offer';

    whisper.innerHTML = `
            <div class="whisper-content">
                <div class="whisper-icon">${icon}</div>
                <div class="whisper-text">
                    ${offer.message}
                    <div class="whisper-timer" id="santis-flash-timer"></div>
                    <button class="whisper-cta" onclick="acceptOffer('${offer.category}')">${buttonText}</button>
                    <button class="whisper-close" onclick="document.getElementById('santis-pulse-whisper').classList.remove('show')">✕</button>
                </div>
            </div>
        `;

    requestAnimationFrame(() => whisper.classList.add('show'));

    // The Ticking Clock (Phase U)
    let timeLeft = offer.valid_for_seconds || 15;
    const timerEl = document.getElementById('santis-flash-timer');

    const updateTimerDisplay = () => {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      timerEl.innerHTML = `<span style="color:#ff3e3e; font-weight:bold; font-family:monospace;">⏳ offer expires in ${m}:${s.toString().padStart(2, '0')}</span>`;
    };

    updateTimerDisplay();
    window.santisFlashTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(window.santisFlashTimer);
        whisper.classList.remove('show');
      } else {
        updateTimerDisplay();
      }
    }, 1000);
  }

  window.acceptOffer = function (category) {
    document.getElementById('santis-pulse-whisper').classList.remove('show');

    // Track Conversion (Fire & Forget)
    fetch('/api/v1/analytics/track_conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: category,
        discount: 0.90, // We could pull this directly from the offer payload 
        base_price: 250 // Mock base price
      })
    }).catch(e => console.error(e));

    const modal = document.getElementById('nv-reservation-modal');
    if (modal) { modal.classList.add('open'); }
    else { window.location.href = `/${LANG}/rezervasyon/?intent=${category}&offer=active`; }
  };
  /* ────────────────────────────────────────────────────────────── */

  /* ─── CSS Injection ──────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('nv-gallery-engine-css')) return;
    const style = document.createElement('style');
    style.id = 'nv-gallery-engine-css';
    style.textContent = `
      .nv-gallery-filter {
        display: flex; gap: 10px; justify-content: center;
        margin: 0 auto 40px; flex-wrap: wrap;
      }
      .gal-filter-btn {
        padding: 10px 26px; border-radius: 2px; cursor: pointer;
        font-family: inherit; font-size: 12px; letter-spacing: 0.12em;
        text-transform: uppercase; transition: all 0.25s;
        background: transparent; color: #888;
        border: 1px solid #333;
      }
      .gal-filter-btn:hover { border-color: #C9A96E; color: #C9A96E; }
      .gal-filter-btn.active { background: #C9A96E; color: #000; border-color: #C9A96E; }

      #gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        padding: 0 24px 60px;
        transition: opacity 0.4s ease, transform 0.4s ease;
      }

      .gal-card { position: relative; overflow: hidden; border-radius: 2px; cursor: pointer; }
      .gal-img-wrap { position: relative; overflow: hidden; aspect-ratio: 4/3; background: #111; }
      .gal-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block;
        transition: transform 0.6s ease; }
      .gal-card:hover .gal-img-wrap img { transform: scale(1.06); }

      .gal-overlay {
        position: absolute; inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 50%);
        opacity: 0; transition: opacity 0.35s ease;
        display: flex; align-items: flex-end;
      }
      .gal-card:hover .gal-overlay { opacity: 1; }
      .gal-overlay-inner { padding: 16px; width: 100%; }

      .gal-surge-badge {
        display: inline-block; background: #C9A96E; color: #000;
        font-size: 10px; font-weight: 700; padding: 3px 8px;
        letter-spacing: 0.1em; border-radius: 2px; margin-bottom: 6px;
        animation: gold-pulse 2s infinite;
      }
      @keyframes gold-pulse {
        0%,100% { box-shadow: 0 0 4px rgba(201,169,110,0.4); }
        50%      { box-shadow: 0 0 14px rgba(201,169,110,0.9); }
      }
      .gal-scarcity-badge {
        display: inline-block; background: #8B0000; color: #fff;
        font-size: 10px; padding: 3px 8px; letter-spacing: 0.1em;
        border-radius: 2px; margin-left: 6px; margin-bottom: 6px;
      }
      .gal-caption { color: #ddd; font-size: 13px; margin: 0 0 8px; }
      .gal-cta {
        display: inline-block; padding: 8px 18px;
        border: 1px solid #C9A96E; color: #C9A96E;
        background: transparent; font-size: 11px; letter-spacing: 0.1em;
        text-transform: uppercase; cursor: pointer; transition: all 0.2s;
      }
      .gal-cta:hover { background: #C9A96E; color: #000; }
      .gal-empty { text-align: center; color: #555; padding: 60px 0; width: 100%; }

      /* Lightbox */
      #nv-gallery-lightbox {
        display: none; position: fixed; inset: 0; z-index: 9000;
        align-items: center; justify-content: center;
      }
      #nv-gallery-lightbox.open .gal-lb-panel {
        opacity: 1; transform: scale(1);
      }
      .gal-lb-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.88); }
      .gal-lb-panel {
        position: relative; z-index: 1; max-width: 860px; width: 92%;
        background: #111; border: 1px solid #2a2a2a;
        display: flex; flex-direction: column; overflow: hidden;
        opacity: 0; transform: scale(0.96); transition: all 0.3s ease;
      }
      .gal-lb-close {
        position: absolute; top: 12px; right: 16px; background: none;
        border: none; color: #888; font-size: 20px; cursor: pointer;
        z-index: 2; transition: color 0.2s;
      }
      .gal-lb-close:hover { color: #C9A96E; }
      .gal-lb-img { width: 100%; max-height: 520px; object-fit: cover; display: block; }
      .gal-lb-info { padding: 20px 24px; }
      .gal-lb-caption { color: #ccc; font-size: 14px; margin: 0 0 10px; }
      .gal-lb-meta { margin-bottom: 14px; }
      .gal-lb-cat {
        font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
        color: #C9A96E; padding: 3px 8px; border: 1px solid #C9A96E33;
      }
      .gal-lb-scarce {
        font-size: 10px; color: #ff6666; margin-left: 8px;
      }
      .gal-lb-book {
        padding: 10px 28px; background: #C9A96E; color: #000;
        border: none; font-size: 12px; letter-spacing: 0.12em;
        text-transform: uppercase; cursor: pointer; transition: background 0.2s;
      }
      .gal-lb-book:hover { background: #b5924d; }

      .gal-lb-book:hover { background: #b5924d; }

      /* Pulse Whisper (Phase S/T/U) */
      #santis-pulse-whisper {
        position: fixed; bottom: 30px; left: 30px; z-index: 9999;
        max-width: 380px; background: rgba(17, 17, 19, 0.95);
        border: 1px solid #C9A96E; border-left: 3px solid #C9A96E;
        border-radius: 4px; padding: 16px; color: #ddd;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        transform: translateY(120%); opacity: 0; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(10px);
      }
      #santis-pulse-whisper.show {
        transform: translateY(0); opacity: 1;
      }
      .whisper-content { display: flex; gap: 14px; align-items: flex-start; }
      .whisper-icon { color: #C9A96E; font-size: 20px; animation: gold-pulse 2s infinite; }
      .whisper-text { font-size: 13px; line-height: 1.5; color: #eee; }
      .whisper-timer { margin-top: 8px; font-size: 11px; }
      .whisper-cta {
        display: block; margin-top: 12px; padding: 6px 14px; background: transparent;
        color: #C9A96E; border: 1px solid #C9A96E; font-size: 11px; text-transform: uppercase;
        letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; border-radius: 2px;
      }
      .whisper-cta:hover { background: #C9A96E; color: #000; }
      .whisper-close {
        position: absolute; top: 12px; right: 12px; background: none; border: none;
        color: #888; font-size: 16px; cursor: pointer;
      }
      .whisper-close:hover { color: #fff; }
    `;
    document.head.appendChild(style);
  }

  /* ─── Init ───────────────────────────────────────────────────── */
  async function init() {
    try {
      console.log("[Gallery Engine] Init started...");
      injectStyles();
      await fetchAssets();
      renderFilterBar();
      renderGrid(false);
      console.log("[Gallery Engine] Init finished natively without crash.");
    } catch (e) {
      console.error("[Gallery Engine] FATAL INIT ERROR:", e);
      document.body.insertAdjacentHTML('afterbegin', `<div style="padding:20px;background:red;color:white;z-index:99999;position:relative"><strong>Gallery Crash:</strong> ${e.message}<br/>${e.stack}</div>`);
    }
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
