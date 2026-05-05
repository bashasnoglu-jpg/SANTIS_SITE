(() => {
  const CARD_SELECTOR = '.bento-card-v6, .matrix-service-card, .santis-matrix-card';

  function unlockScroll() {
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('overflow-y', 'auto', 'important');
    document.body.style.setProperty('height', 'auto', 'important');
    document.body.classList.remove('no-scroll');
  }

  function categoryMatch(item, category) {
    const cat = String(item.category || '').toLowerCase();
    const catId = String(item.categoryId || '').toLowerCase();
    const label = String(category || 'all').toLowerCase();

    if (label === 'massage' || label === 'masajlar') {
      return (cat.startsWith('massage') || catId.startsWith('massage')) && !catId.startsWith('ritual-hammam');
    }
    if (label === 'hamam' || label === 'hammam') {
      return cat === 'hammam' || catId.startsWith('ritual-hammam');
    }
    if (label === 'skincare') {
      return cat === 'skincare' || cat.startsWith('skincare-') || catId.startsWith('skincare-') || catId.startsWith('sothys');
    }
    if (label === 'rituals') return cat === 'journey' || catId.includes('journey');
    if (label === 'all' || label === 'index') return true;
    return cat === label || catId.includes(label);
  }

  function normalizeServices(raw) {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.services)) return raw.services;
    if (Array.isArray(raw?.categories)) {
      return raw.categories.flatMap((group) => group.services || group.items || []);
    }
    return [];
  }

  function cardHref(item, category) {
    if (item.detailUrl || item.url) return item.detailUrl || item.url;
    const slug = item.slug || item.id || 'index';
    const section = category === 'skincare' ? 'cilt-bakimi' : category === 'rituals' ? 'rituals' : category === 'hamam' ? 'hamam' : 'masajlar';
    return `/tr/${section}/${slug}.html`;
  }

  function renderFallbackCard(item, category, index) {
    const title = item.name || item.title || item.content?.tr?.title || 'Santis Ritüeli';
    const desc = item.description || item.content?.tr?.shortDesc || item.content?.tr?.tagline || '';
    const image = item.image || item.img || (item.media?.hero ? `/assets/img/cards/${item.media.hero}` : '/assets/img/luxury-placeholder.webp');
    const priceRaw = item.price_eur || item.price?.amount || '';
    const price = priceRaw ? `€${priceRaw}` : '';

    const card = document.createElement('a');
    card.className = 'bento-card-v6 santis-category-fallback-card is-revealed revealed active';
    if (category === 'rituals') card.className = 'santis-matrix-card santis-card santis-category-fallback-card';
    if (index % 5 === 0 && category !== 'rituals') card.classList.add('wide');
    card.href = cardHref(item, category);
    card.style.opacity = '1';
    card.style.visibility = 'visible';
    card.style.transform = 'translate3d(0,0,0)';
    card.innerHTML = `
      <img class="bento-card-media" src="${image}" alt="${title}" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async" onerror="this.onerror=null;this.src='/assets/img/luxury-placeholder.webp'">
      <div class="bento-card-protector"></div>
      <div class="bento-card-content">
        <span class="bento-meta">SANTIS RİTÜELİ</span>
        <h3 class="bento-title">${title}</h3>
        <p class="bento-desc">${desc}</p>
      </div>
      ${price ? `<div class="bento-price-tag">${price}</div>` : ''}
    `;
    return card;
  }

  async function renderFallback(container, category, limit = 999) {
    if (!container || container.querySelector(CARD_SELECTOR)) return;

    try {
      const response = await fetch('/assets/data/services.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const services = normalizeServices(await response.json())
        .filter((item) => categoryMatch(item, category))
        .slice(0, limit);

      if (!services.length) return;

      container.innerHTML = '';
      container.style.setProperty('opacity', '1', 'important');
      container.style.setProperty('visibility', 'visible', 'important');

      if (!container.classList.contains('santis-matrix-container')) {
        container.style.setProperty('display', 'grid', 'important');
      }

      const fragment = document.createDocumentFragment();
      services.forEach((item, index) => fragment.appendChild(renderFallbackCard(item, category, index)));
      container.appendChild(fragment);
      document.dispatchEvent(new CustomEvent('santis:cards-rendered', { detail: { count: services.length, fallback: true } }));
    } catch (err) {
      console.error('[Category Seal] Fallback render failed:', err);
    }
  }

  function reviveBento() {
    if (typeof window.initBentoCards === 'function') window.initBentoCards();
  }

  function boot() {
    unlockScroll();
    reviveBento();

    window.addEventListener('pageshow', unlockScroll);
    window.addEventListener('resize', unlockScroll);
    document.addEventListener('santis:nav:ready', unlockScroll);

    let unlockTicks = 0;
    const unlockTimer = setInterval(() => {
      unlockScroll();
      unlockTicks += 1;
      if (unlockTicks >= 20) clearInterval(unlockTimer);
    }, 500);

    setTimeout(() => {
      unlockScroll();
      reviveBento();

      document.querySelectorAll('#santis-bento-universe').forEach((container) => {
        renderFallback(container, container.dataset.category || document.body.dataset.page || 'all');
      });

      document.querySelectorAll('.santis-matrix-container').forEach((container) => {
        const limit = parseInt(container.dataset.limit || '999', 10);
        renderFallback(container, container.dataset.category || document.body.dataset.page || 'all', limit);
      });
    }, 4500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
