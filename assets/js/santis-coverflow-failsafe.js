/**
 * SANTIS COVER FLOW FAILSAFE ENGINE v1.0
 * Phase 75.3 — Inline Fallback Extraction
 *
 * Görev: Ana Cover Flow motoru (santis-v8-engine.js vb.) başlamazsa
 * `data-santis-bg` attribute'larını uygular ve temel kart döngüsünü
 * (click + swipe) devreye alır.
 *
 * Kullanım: <script defer src="/assets/js/santis-coverflow-failsafe.js"></script>
 * Güvenlik: CSP uyumlu, inline JS yok, `'use strict'` zorunlu.
 */
(function () {
  'use strict';

  /* ─── CORE INIT ─────────────────────────────────────────────────── */
  function initCoverFlow() {
    const stage = document.getElementById('sov-3d-stage-elements');
    if (!stage) return;

    /* 1. Background image enjeksiyonu */
    const cards = stage.querySelectorAll('.santis-stack-card');
    cards.forEach((card) => {
      const bg = card.dataset.santisBg;
      if (bg && !card.style.backgroundImage) {
        card.style.backgroundImage = `url('${bg}')`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
      }
    });

    if (cards.length === 0) return;

    /* 2. Ana engine çalışmışsa devret */
    if (stage.dataset.cfInit === '1') return;
    stage.dataset.cfInit = '1';

    let active = 0;
    const total = cards.length;

    /* 3. Kart pozisyon motoru */
    function positionCards() {
      cards.forEach((card, i) => {
        const offset    = i - active;
        const absOffset = Math.abs(offset);

        /* En fazla 3 kart görünür */
        card.style.display  = absOffset > 2 ? 'none' : 'flex';
        card.style.zIndex   = String(total - absOffset);
        card.style.opacity  = absOffset === 0 ? '1' : absOffset === 1 ? '0.7' : '0.4';
        card.style.transform = [
          `translateX(calc(-50% + ${offset * 180}px))`,
          `translateY(-50%)`,
          `scale(${absOffset === 0 ? 1 : absOffset === 1 ? 0.88 : 0.76})`,
          `rotateY(${offset * -12}deg)`,
        ].join(' ');
      });
    }

    positionCards();

    /* ─── LIFECYCLE: is-loading kaldır ─── */
    stage.classList.remove('is-loading');
    stage.setAttribute('aria-busy', 'false');

    /* 4. Click → sonraki kart */
    stage.addEventListener('click', (e) => {
      if (e.target.closest('a')) return; // rezervasyon linkine dokunma
      active = (active + 1) % total;
      positionCards();
    });

    /* 5. Swipe desteği (mobil) */
    let startX = 0;
    stage.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        active = diff > 0
          ? (active + 1) % total
          : (active - 1 + total) % total;
        positionCards();
      }
    }, { passive: true });

    /* 6. Skeleton veil'ı kaldır */
    const veil = stage.querySelector('.santis-reveal-veil');
    if (veil) {
      veil.style.transition = 'opacity 0.4s ease';
      veil.style.opacity = '0';
      veil.style.pointerEvents = 'none';
      setTimeout(() => veil.remove(), 450);
    }
  }

  /* ─── BOOT SEQUENCE ─────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoverFlow);
  } else {
    initCoverFlow();
  }

  /* Double-tap guarantee: bootloader tamamlandıktan sonra da çalıştır */
  window.addEventListener('load', () => setTimeout(initCoverFlow, 500));
})();
