(function SantisBookingFunnel() {
  const WHATSAPP_NUMBER = '905348350169';

  const state = {
    intent: '',
    ritual: '',
    time: '',
    guests: '1',
    upsell: '',
  };

  const copy = {
    intents: [
      ['reset', 'Reset / Yenilenme'],
      ['relaxation', 'Derin Rahatlama'],
      ['hamam', 'Hamam Ritüeli'],
      ['couple', 'Çift Deneyimi'],
      ['skin', 'Cilt Yenilenmesi'],
    ],
    rituals: [
      ['classic', 'Klasik Masaj'],
      ['bali', 'Bali Masajı'],
      ['deep-tissue', 'Derin Doku Masajı'],
      ['hammam', 'Hamam Kese & Köpük'],
      ['signature', 'Signature Ritual'],
    ],
    times: [
      ['today', 'Bugün'],
      ['tomorrow', 'Yarın'],
      ['week', 'Bu hafta'],
      ['concierge', 'Concierge önerisi'],
    ],
  };

  const upsellRules = [
    {
      match: ['Bali Masajı', 'Derin Rahatlama'],
      label: 'Altın Yüz Maskesi',
      value: 'gold-mask',
      copy: 'Bu deneyimi 30 dakikalık Altın Yüz Maskesi ile taçlandırmak ister misiniz?',
      score: 25,
    },
    {
      match: ['Hamam Kese & Köpük', 'Hamam Ritüeli'],
      label: 'Deniz Tuzu Peelingi',
      value: 'sea-salt-peeling',
      copy: 'Hamam ritüelinize Deniz Tuzu Peelingi ekleyerek arınma etkisini derinleştirebilirsiniz.',
      score: 20,
    },
    {
      match: ['Signature Ritual', 'Çift Deneyimi'],
      label: 'Private Ritual Suite',
      value: 'private-suite',
      copy: 'Bu ritüeli Private Ritual Suite ile daha sessiz ve kişisel bir deneyime dönüştürebilirsiniz.',
      score: 35,
    },
    {
      match: ['Cilt Yenilenmesi'],
      label: 'LED Glow Therapy',
      value: 'led-glow',
      copy: 'Cilt yenilenmesini LED Glow Therapy ile daha görünür bir ışıltıya taşıyabilirsiniz.',
      score: 20,
    },
  ];

  function getActiveUpsell() {
    return upsellRules.find((rule) => {
      return rule.match.some((token) => {
        return state.intent === token || state.ritual === token;
      });
    });
  }

  function calculateLeadScore() {
    let score = 10;

    const guests = Number(state.guests || 1);

    if (guests >= 2) score += 20;
    if (guests >= 4) score += 15;

    if (state.ritual === 'Signature Ritual') score += 35;
    if (state.ritual === 'Bali Masajı') score += 20;
    if (state.ritual === 'Derin Doku Masajı') score += 15;
    if (state.ritual === 'Hamam Kese & Köpük') score += 15;

    if (state.time === 'Bugün') score += 15;
    if (state.time === 'Concierge önerisi') score += 10;

    const upsell = getActiveUpsell();
    if (state.upsell && upsell) score += upsell.score;

    return score;
  }

  function getLeadTag() {
    const score = calculateLeadScore();

    if (score >= 75) return '[VIP-LEAD]';
    if (score >= 45) return '[PRIORITY]';
    return '[STANDARD]';
  }

  function renderUpsell() {
    const box = document.querySelector('[data-booking-upsell]');
    if (!box) return;

    const active = getActiveUpsell();

    if (!active) {
      box.hidden = true;
      return;
    }

    box.hidden = false;

    const title = box.querySelector('[data-upsell-title]');
    const copyEl = box.querySelector('[data-upsell-copy]');
    const btn = box.querySelector('[data-upsell-accept]');

    title.textContent = active.label;
    copyEl.textContent = active.copy;

    btn.classList.toggle('is-active', state.upsell === active.label);
    btn.textContent = state.upsell === active.label
      ? 'Premium ekleme seçildi'
      : 'Bu eklemeyi dahil et';

    btn.onclick = () => {
      state.upsell = state.upsell === active.label ? '' : active.label;
      updateSummary();
    };
  }

  const STORAGE_KEY = 'santis_booking_state_v1';

  function persistState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function restoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
    } catch (e) {
      console.warn('State restore failed', e);
    }
  }

  function hydrateFromDataset(el) {
    if (!el || !el.dataset) return;

    if (el.dataset.bookingIntent) {
      state.intent = el.dataset.bookingIntent;
    }

    if (el.dataset.bookingRitual) {
      state.ritual = el.dataset.bookingRitual;
    }

    if (el.dataset.bookingTime) {
      state.time = el.dataset.bookingTime;
    }

    if (el.dataset.bookingGuests) {
      state.guests = el.dataset.bookingGuests;
    }
  }

  function applySelectionsToUI() {
    document.querySelectorAll('.santis-booking-option').forEach((btn) => {
      const group = btn.dataset.group;
      const value = btn.textContent;

      if (state[group] === value) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    const countEl = document.querySelector('[data-guest-count]');
    if (countEl) {
      countEl.textContent = state.guests;
    }

    updateSummary();
    renderUpsell();
  }

  function buildMessage() {
    const leadTag = getLeadTag();
    const score = calculateLeadScore();

    return [
      `${leadTag} Merhaba Santis Concierge,`,
      '',
      'Santis Club üzerinden bir ritüel talebi oluşturmak istiyorum.',
      '',
      `Niyet: ${state.intent || 'Concierge önerisi'}`,
      `Ritüel: ${state.ritual || 'Concierge önerisi'}`,
      `Zaman tercihi: ${state.time || 'Concierge önerisi'}`,
      `Kişi sayısı: ${state.guests || '1'}`,
      state.upsell ? `Premium ekleme: ${state.upsell}` : 'Premium ekleme: Concierge önerisi',
      '',
      `Lead skoru: ${score}`,
      '',
      'Benim için en uygun saat ve deneyim önerisini paylaşır mısınız?',
    ].join('\n');
  }

  function openWhatsApp() {
    const message = encodeURIComponent(buildMessage());
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function optionButton(group, value, label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'santis-booking-option';
    btn.textContent = label;
    btn.dataset.group = group;
    btn.dataset.value = value;

    btn.addEventListener('click', () => {
      state[group] = label;

      document
        .querySelectorAll(`.santis-booking-option[data-group="${group}"]`)
        .forEach((el) => el.classList.remove('is-active'));

      btn.classList.add('is-active');
      updateSummary();
    });

    return btn;
  }

  function updateSummary() {
    const summary = document.querySelector('[data-booking-summary]');
    if (!summary) return;

    summary.innerHTML = `
      <span>Niyet: <strong>${state.intent || 'Seçilmedi'}</strong></span>
      <span>Ritüel: <strong>${state.ritual || 'Seçilmedi'}</strong></span>
      <span>Zaman: <strong>${state.time || 'Seçilmedi'}</strong></span>
      <span>Kişi: <strong>${state.guests || '1'}</strong></span>
      <span>Premium: <strong>${state.upsell || 'Seçilmedi'}</strong></span>
      <span>Lead: <strong>${getLeadTag()} / ${calculateLeadScore()}</strong></span>
    `;

    renderUpsell();
    updateScarcity();
    persistState();
  }

  function updateScarcity() {
    const scarcityEl = document.querySelector('[data-booking-scarcity]');
    if (!scarcityEl) return;

    if (state.time === 'Bugün' || state.time === 'Yarın') {
      scarcityEl.innerHTML = 'Yakın zamanlı talepler için <strong>son 2 sessiz saat aralığı</strong> önerilebilir.';
      scarcityEl.style.color = 'var(--nv-gold, #CFA968)';
      return;
    }

    if (state.ritual) {
      scarcityEl.innerHTML = `${state.ritual} deneyimi için sınırlı concierge kapasitesi bulunmaktadır.`;
      scarcityEl.style.color = '';
      return;
    }

    scarcityEl.innerHTML = 'Talepleriniz için VIP Concierge kapasitesi sınırlı tutulmaktadır.';
    scarcityEl.style.color = '';
  }

  function createDrawer() {
    if (document.querySelector('#santis-booking-drawer')) return;

    const drawer = document.createElement('aside');
    drawer.id = 'santis-booking-drawer';
    drawer.className = 'santis-booking-drawer';
    drawer.setAttribute('aria-hidden', 'true');

    drawer.innerHTML = `
      <div class="santis-booking-backdrop" data-booking-close></div>
      <div class="santis-booking-panel" role="dialog" aria-modal="true" aria-label="Santis Booking Concierge">
        <button class="santis-booking-close" type="button" data-booking-close aria-label="Kapat">×</button>

        <p class="santis-booking-kicker">SANTIS CONCIERGE</p>
        <h2 class="santis-booking-title">Ritüelinizi birlikte kuralım.</h2>
        <p class="santis-booking-copy">
          Bir hizmet seçmek zorunda değilsiniz. Sadece ihtiyacınız olan hali seçin;
          Santis Concierge size en uygun zamanı ve deneyimi önersin.
        </p>

        <section class="santis-booking-step">
          <h3>Bugün neye ihtiyacınız var?</h3>
          <div class="santis-booking-options" data-intent-options></div>
        </section>

        <section class="santis-booking-step">
          <h3>Ritüel tercihi</h3>
          <div class="santis-booking-options" data-ritual-options></div>
        </section>

        <section class="santis-booking-step">
          <h3>Zaman tercihi</h3>
          <div class="santis-booking-options" data-time-options></div>
        </section>

        <section class="santis-booking-step">
          <h3>Kişi sayısı</h3>
          <div class="santis-booking-guests">
            <button type="button" data-guest-minus>−</button>
            <strong data-guest-count>1</strong>
            <button type="button" data-guest-plus>+</button>
          </div>
        </section>

        <section class="santis-booking-upsell" data-booking-upsell hidden>
          <p class="santis-booking-upsell-kicker">SANTIS ÖNERİSİ</p>
          <h3 data-upsell-title>Deneyimi yükseltin</h3>
          <p data-upsell-copy></p>
          <button type="button" class="santis-booking-upsell-button" data-upsell-accept>
            Bu eklemeyi dahil et
          </button>
        </section>

        <div class="santis-booking-summary" data-booking-summary></div>

        <div class="santis-booking-scarcity" data-booking-scarcity></div>

        <button class="santis-booking-submit" type="button" data-booking-submit>
          WhatsApp Concierge’e Gönder
        </button>
      </div>
    `;

    document.body.appendChild(drawer);

    const intentWrap = drawer.querySelector('[data-intent-options]');
    const ritualWrap = drawer.querySelector('[data-ritual-options]');
    const timeWrap = drawer.querySelector('[data-time-options]');

    copy.intents.forEach(([value, label]) => intentWrap.appendChild(optionButton('intent', value, label)));
    copy.rituals.forEach(([value, label]) => ritualWrap.appendChild(optionButton('ritual', value, label)));
    copy.times.forEach(([value, label]) => timeWrap.appendChild(optionButton('time', value, label)));

    drawer.querySelector('[data-guest-minus]').addEventListener('click', () => {
      state.guests = String(Math.max(1, Number(state.guests) - 1));
      drawer.querySelector('[data-guest-count]').textContent = state.guests;
      updateSummary();
    });

    drawer.querySelector('[data-guest-plus]').addEventListener('click', () => {
      state.guests = String(Math.min(8, Number(state.guests) + 1));
      drawer.querySelector('[data-guest-count]').textContent = state.guests;
      updateSummary();
    });

    drawer.querySelector('[data-booking-submit]').addEventListener('click', openWhatsApp);

    drawer.querySelectorAll('[data-booking-close]').forEach((el) => {
      el.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDrawer();
    });

    updateSummary();
  }

  function openDrawer(event) {
    restoreState();

    if (event) {
      event.preventDefault();
      hydrateFromDataset(event.currentTarget);
    }

    createDrawer();

    const drawer = document.querySelector('#santis-booking-drawer');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('santis-booking-open');

    applySelectionsToUI();
  }

  function closeDrawer() {
    const drawer = document.querySelector('#santis-booking-drawer');
    if (!drawer) return;

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('santis-booking-open');
  }

  function bindTriggers() {
    const selectors = [
      '[data-booking-open]',
      'a[href="/rezervasyon"]',
      'a[href="/tr/rezervasyon"]',
      'a[href="/tr/rezervasyon/"]',
    ];

    document.querySelectorAll(selectors.join(',')).forEach((trigger) => {
      trigger.addEventListener('click', openDrawer);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTriggers);
  } else {
    bindTriggers();
  }

  window.SantisBookingFunnel = {
    open: openDrawer,
    close: closeDrawer,
    state,
  };
})();
