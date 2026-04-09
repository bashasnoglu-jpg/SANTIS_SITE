(function initSovereignFunnel() {
    const revealStage = document.getElementById('dynamic-reveal-stage');
    const triggerButtons = document.querySelectorAll('.intent-trigger');

    if (!revealStage || !triggerButtons.length) return;

    const revealContent = {
      unwind: {
        kicker: 'For softness, stillness and ritual comfort',
        title: 'Unwind & Relax',
        text: 'A calm, elegant path from pure ritual entry to the most persuasive all-round wellness value.',
        entry: {
          serviceId: 'ottoman-hamam-tradition',
          name: 'Ottoman Hamam Tradition',
          meta: '50 min',
          price: '90 €',
          copy: 'A refined Turkish bath ritual that opens the body and quiets the mind.'
        },
        hero: {
          serviceId: 'relax-program',
          name: 'Relax Program',
          meta: '95 min',
          price: '100 €',
          copy: 'The strongest value proposition in the menu — a near-perfect step-up from a single ritual.'
        },
        anchor: {
          serviceId: 'delux-program',
          name: 'Delux Program',
          meta: '115 min',
          price: '175 €',
          copy: 'A prestige-tier wellness journey designed to elevate the perception of the entire ritual ladder.'
        }
      },

      recover: {
        kicker: 'For tension, fatigue and muscular reset',
        title: 'Recover & Rebuild',
        text: 'Built around deeper bodywork and stronger therapeutic intent.',
        entry: {
          serviceId: 'local-deep-tissue-30',
          name: 'Local Deep Tissue',
          meta: '30 min',
          price: '55 €',
          copy: 'A precise, targeted release for local tension and overload.'
        },
        hero: {
          serviceId: 'deep-tissue-massage-50',
          name: 'Deep Tissue Massage',
          meta: '50 min',
          price: '90 €',
          copy: 'The practical recovery choice — stronger pressure, broader impact, clear result.'
        },
        anchor: {
          serviceId: 'mix-manuel-therapy-90',
          name: 'Mix Manuel Therapy',
          meta: '90 min',
          price: '180 €',
          copy: 'Your prestige therapeutic anchor — high authority, high depth, high perceived expertise.'
        }
      },

      detox: {
        kicker: 'For purification, renewal and body reset',
        title: 'Detox & Purify',
        text: 'A ritual route that begins with cleansing and moves toward full-body restoration.',
        entry: {
          serviceId: 'sea-salt-peeling-and-foam',
          name: 'Sea Salt Peeling and Foam',
          meta: '30 min',
          price: '50 €',
          copy: 'Mineral exfoliation and ritual foam for a clean, refreshing start.'
        },
        hero: {
          serviceId: 'medical-program',
          name: 'Medical Program',
          meta: '95 min',
          price: '115 €',
          copy: 'A sharper wellness composition that blends cleansing, therapeutic structure and visible value.'
        },
        anchor: {
          serviceId: 'delux-program',
          name: 'Delux Program',
          meta: '115 min',
          price: '175 €',
          copy: 'The full prestige ritual — longer, richer, and positioned as the upper benchmark.'
        }
      },

      eastern: {
        kicker: 'For master therapies, energy and exotic prestige',
        title: 'Eastern Harmony',
        text: 'Curated from the most premium and story-rich Eastern therapies in the menu.',
        entry: {
          serviceId: 'ayurveda-massage-50',
          name: 'Ayurveda Massage',
          meta: '50 min',
          price: '90 €',
          copy: 'A warm, sensory entry into Eastern ritual and restoration.'
        },
        hero: {
          serviceId: 'traditional-thai-massage-50',
          name: 'Traditional Thai Massage',
          meta: '50 min',
          price: '100 €',
          copy: 'The balanced centerpiece — cultural prestige, visible structure, strong perceived expertise.'
        },
        anchor: {
          serviceId: 'mandara-massage-4-hand-50',
          name: 'Mandara Massage (4 Hand)',
          meta: '50 min',
          price: '150 €',
          copy: 'The signature luxury statement — theatrical, memorable, and unmistakably premium.'
        }
      }
    };

    function setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    function setServiceId(cardId, serviceId) {
      const card = document.getElementById(cardId);
      if (card) card.dataset.serviceId = serviceId || '';
    }

    function renderReveal(intentKey) {
      const content = revealContent[intentKey];
      if (!content) return;

      setText('reveal-kicker', content.kicker);
      setText('reveal-title', content.title);
      setText('reveal-text', content.text);

      setText('tier-entry-name', content.entry.name);
      setText('tier-entry-meta', content.entry.meta);
      setText('tier-entry-price', content.entry.price);
      setText('tier-entry-copy', content.entry.copy);
      setServiceId('tier-entry-card', content.entry.serviceId);

      setText('tier-hero-name', content.hero.name);
      setText('tier-hero-meta', content.hero.meta);
      setText('tier-hero-price', content.hero.price);
      setText('tier-hero-copy', content.hero.copy);
      setServiceId('tier-hero-card', content.hero.serviceId);

      setText('tier-anchor-name', content.anchor.name);
      setText('tier-anchor-meta', content.anchor.meta);
      setText('tier-anchor-price', content.anchor.price);
      setText('tier-anchor-copy', content.anchor.copy);
      setServiceId('tier-anchor-card', content.anchor.serviceId);
    }

    triggerButtons.forEach((button) => {
      button.addEventListener('click', () => {
        triggerButtons.forEach((btn) => {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-expanded', 'false');
        });

        button.classList.add('is-active');
        button.setAttribute('aria-expanded', 'true');

        const intent = button.dataset.intent;
        renderReveal(intent);

        if (!revealStage.classList.contains('is-visible')) {
          revealStage.classList.add('is-visible');
          revealStage.setAttribute('aria-hidden', 'false');
        }

        setTimeout(() => {
          revealStage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
      });
    });

    function openConciergeReservation(serviceId) {
      if (!serviceId) return;

      const serviceNameHuman = serviceId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const encodedMessage = encodeURIComponent(`Hello, I wish to reserve the ${serviceNameHuman} ritual from the curated recommendations.`);

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const url = isMobile 
          ? `whatsapp://send?phone=905348350169&text=${encodedMessage}`
          : `https://web.whatsapp.com/send?phone=905348350169&text=${encodedMessage}`;

      window.open(url, '_blank', 'noopener,noreferrer');
    }

    ['tier-entry-card', 'tier-hero-card', 'tier-anchor-card'].forEach((id) => {
      const card = document.getElementById(id);
      if (!card) return;

      card.addEventListener('click', () => {
        openConciergeReservation(card.dataset.serviceId);
      });

      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openConciergeReservation(card.dataset.serviceId);
        }
      });
    });
})();
