(function SantisBookingFunnel() {
  const WHATSAPP_NUMBER = '905348350169';

  const state = {
    intent: '',
    ritual: '',
    time: '',
    guests: '1',
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
  }

  function buildMessage() {
    return [
      'Merhaba Santis Concierge,',
      '',
      'Santis Club üzerinden bir ritüel talebi oluşturmak istiyorum.',
      '',
      `Niyet: ${state.intent || 'Concierge önerisi'}`,
      `Ritüel: ${state.ritual || 'Concierge önerisi'}`,
      `Zaman tercihi: ${state.time || 'Concierge önerisi'}`,
      `Kişi sayısı: ${state.guests || '1'}`,
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
    `;

    persistState();
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

        <div class="santis-booking-summary" data-booking-summary></div>

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
