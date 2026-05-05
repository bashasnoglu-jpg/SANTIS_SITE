(() => {
  function unlockScroll() {
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
    document.body.style.setProperty('overflow-y', 'auto', 'important');
    document.body.classList.remove('no-scroll');
  }

  function revealHomeCards() {
    unlockScroll();

    document.querySelectorAll('.santis-carousel-stage').forEach((stage) => {
      stage.classList.remove('is-loading');
      stage.removeAttribute('aria-busy');
      stage.style.setProperty('opacity', '1', 'important');
      stage.style.setProperty('visibility', 'visible', 'important');
      stage.style.setProperty('min-height', stage.style.minHeight || '400px', 'important');
      stage.querySelectorAll('.skeleton-card-wire').forEach((node) => node.remove());
    });

    document.querySelectorAll('.santis-stack-card').forEach((card, index) => {
      const bg = card.getAttribute('data-santis-bg');
      if (bg && !card.style.backgroundImage) {
        card.style.backgroundImage = `url("${bg}")`;
      }
      card.classList.add('santis-asset-loaded');
      card.style.setProperty('background-size', 'cover', 'important');
      card.style.setProperty('background-position', 'center', 'important');
      card.style.setProperty('display', index < 6 ? 'flex' : (card.style.display || 'flex'), 'important');
      card.style.setProperty('opacity', index < 3 ? String(1 - index * 0.18) : '0.55', 'important');
      card.style.setProperty('visibility', 'visible', 'important');
      card.style.setProperty('pointer-events', 'auto', 'important');
    });

    const primaryStage = document.getElementById('sov-3d-stage-elements');
    if (primaryStage) {
      const cards = primaryStage.querySelectorAll('.santis-stack-card');
      cards.forEach((card, index) => {
        if (index > 2) return;
        card.style.setProperty('position', 'absolute', 'important');
        card.style.setProperty('top', '50%', 'important');
        card.style.setProperty('left', '50%', 'important');
        card.style.setProperty('width', 'min(320px, 74vw)', 'important');
        card.style.setProperty('height', 'min(440px, 58vh)', 'important');
        card.style.setProperty('z-index', String(10 - index), 'important');
        card.style.setProperty('transform', `translateX(calc(-50% + ${index * 170}px)) translateY(-50%) scale(${1 - index * 0.1})`, 'important');
      });
    }
  }

  function boot() {
    revealHomeCards();
    window.addEventListener('pageshow', revealHomeCards);
    document.addEventListener('santis:nav:ready', revealHomeCards);
    let ticks = 0;
    const timer = setInterval(() => {
      revealHomeCards();
      ticks += 1;
      if (ticks >= 12) clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
