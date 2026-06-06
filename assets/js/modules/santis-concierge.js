import { formatSovereignPrice } from '/assets/js/core/currency-formatter.js';
/**
 * SANTIS OS - MODULE: Concierge Engine V3 (Surgical Migration + Auto-Close)
 * Architecture: State-Driven, EventBus Connected, Voice Enabled, Zero-Friction Checkout
 */

export class ConciergeModule {
  constructor(engine) {
    this.engine = engine;
    this._isAlive = false;
    this._subscriptions = [];
  }

  render() {
    return `
      <div id="concierge-root" class="fixed bottom-6 right-6 z-50">
        <div id="concierge-box" class="hidden glassmorphism-panel p-6 rounded-2xl shadow-xl w-96 bg-black/95 border border-santis-gold/20 backdrop-blur-md">
          <div id="concierge-messages" class="space-y-3 mb-4 max-h-64 overflow-y-auto text-white"></div>
          
          <input 
            id="concierge-input"
            class="w-full bg-white/5 text-white border border-santis-gold/30 p-3 rounded-lg text-sm outline-none focus:border-santis-gold transition-all"
            placeholder="Nasıl hissediyorsunuz?"
          />
        </div>

        <button id="concierge-toggle" class="w-14 h-14 rounded-full bg-black text-santis-gold border border-santis-gold shadow-accent-glow flex items-center justify-center text-2xl transition-transform hover:scale-110 ml-auto mt-4">
          ✦
        </button>
      </div>
    `;
  }

  mount() {
    this._isAlive = true;

    // Arayüzü DOM'a Ekle
    const viewport = document.getElementById('santis-master-viewport') || document.body;
    viewport.insertAdjacentHTML('beforeend', this.render());

    const toggleBtn = document.getElementById('concierge-toggle');
    const box = document.getElementById('concierge-box');
    const input = document.getElementById('concierge-input');

    toggleBtn.onclick = () => {
      box.classList.toggle('hidden');
      if (!box.classList.contains('hidden')) input.focus();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim() !== '') {
        this.handleInput(e.target.value);
        e.target.value = '';
      }
    });

    // 🔥 STATE LISTENER
    const unsub = this.engine.subscribe('concierge', (state) => {
      if (!this._isAlive || !state) return;

      if (state.active && box.classList.contains('hidden')) {
          box.classList.remove('hidden');
      }

      if (state.suggestions && state.suggestions.length > 0) {
          // Intent datasını da gönderiyoruz
          this.renderSuggestions(state.suggestions, state);
      } else if (state.voiceEnabled && window.SantisVoice && state.suggestions) {
        window.SantisVoice.speak(
          "Sizin için bazı önerilerim var",
          { pitch: 0.9, rate: 0.85 }
        );
      }
    });

    // 🔥 INTERVENTION ENGINE BINDING
    const unsubTrigger = this.engine.subscribe('TRIGGER_CONCIERGE', (data) => {
        if (!this._isAlive) return;
        this.engine.setState('concierge', { active: true });
        
        const container = document.getElementById('concierge-messages');
        if (container) {
            container.innerHTML = `<div class='p-3 bg-white/5 rounded-lg text-sm text-santis-gold'>${data.reason === 'idle_confusion' ? 'Kararsız kaldığınızı seziyorum. Ruhunuzun ihtiyacı olan sessizliği bulmanıza yardım edebilir miyim?' : 'Size nasıl yardımcı olabilirim?'}</div>`;
        }
    });

    this._subscriptions.push(unsub, unsubTrigger);
    
    // AI Mock Engine
    if (!window.SantisConciergeAI) {
        window.SantisConciergeAI = {
          analyze(text) {
            return {
              intent: "relaxation",
              score: 0.87,
              topMatches: [
                { name: "Santis Signature Massage", price: 4500 }
              ]
            };
          }
        };
    }
  }

  handleInput(text) {
    const container = document.getElementById('concierge-messages');
    container.innerHTML += `<div class='p-3 bg-santis-gold/10 rounded-lg text-sm text-white ml-auto w-3/4 mb-2'>${escapeHtml(text)}</div>`;
      
    // Simüle edilmiş AI Analizi
    const result = window.SantisConciergeAI.analyze(text);

    this.engine.setState('concierge', {
      active: true,
      intent: result.intent,
      score: result.score,
      suggestions: result.topMatches,
      voiceEnabled: true
    });

    // God's Eye'a bildir
    if (this.engine.publish) {
        this.engine.publish('CONCIERGE_ENGAGED', result);
    }
  }

  // 🔴 AUTO-CLOSE MANTIĞI EKLENDİ
  renderSuggestions(suggestions, intentData) {
    const container = document.getElementById('concierge-messages');
    if (!container) return;

    // container.innerHTML = ''; // Eski mesajları tutmak isteyebiliriz, şimdilik tutalım veya silelim:
    // Bu metot handleInput'tan sonra çağırılacağı için ek olarak basıyoruz.

    if (intentData.score > 0.85 && suggestions.length > 0) {
      this.renderFrictionlessCheckoutCard(container, suggestions[0]);
      this.playSalesScript(intentData.intent);
      // Container scroll to bottom
      container.scrollTop = container.scrollHeight;
      return;
    }

    // 🟢 STANDART LİSTELEME
    suggestions.forEach(item => {
      const el = document.createElement('div');
      el.className = 'p-3 bg-white/5 border border-santis-gold/20 rounded-lg text-sm mb-2 cursor-pointer hover:bg-santis-gold/10 transition-colors';
      el.innerHTML = `<span class="text-santis-gold font-bold">ÖNERİ:</span> ${escapeHtml(item.name)}`;
      
      el.onclick = () => {
          this.handleInput(`Hemen ${item.name} rezerve etmek istiyorum.`);
      };

      container.appendChild(el);
    });
    container.scrollTop = container.scrollHeight;
  }

  // 💳 SATIŞ KAPATICI KART (Tek Tıkla Ödeme Tüneli)
  renderFrictionlessCheckoutCard(container, product) {
    const card = document.createElement('div');
    card.className = 'p-5 bg-black rounded-2xl shadow-2xl text-white transform transition-all duration-500 scale-95 opacity-0 animate-fade-in-up mt-2';
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div>
          <span class="block text-micro uppercase tracking-cta text-santis-gold mb-1">SİZE ÖZEL HAZIRLANDI</span>
          <h4 class="text-lg font-light">${escapeHtml(product.name)}</h4>
        </div>
        <div class="text-right">
          <span class="block text-sm text-white/50 line-through">${formatSovereignPrice((product.price * 1.15).toFixed(0))}</span>
          <span class="text-xl font-light text-santis-gold">${formatSovereignPrice(product.price)}</span>
        </div>
      </div>
      <p class="text-xs text-white/50 mb-6 font-light">Semptomlarınıza yönelik en ideal ritüel. %15 Concierge ayrıcalığı anında tanımlandı.</p>
      
      <button id="ai-auto-checkout-btn" class="w-full py-3 bg-white text-black text-sm uppercase tracking-widest rounded-lg hover:bg-santis-gold hover:text-white transition-colors font-bold">
        Tek Tıkla Rezerve Et
      </button>
    `;

    container.appendChild(card);
    
    // CSS Reflow Trick
    void card.offsetWidth;
    card.classList.remove('scale-95', 'opacity-0');

    // SATIŞI INFAZ ET
    const btn = card.querySelector('#ai-auto-checkout-btn');
    if (btn) {
        btn.onclick = () => {
            this.triggerFrictionlessCheckout(product);
        };
    }
  }

  triggerFrictionlessCheckout(product) {
    // 1. Core State'i manipüle et (Sepeti güncelle)
    this.engine.setState('cartData', {
      serviceName: product.name,
      subtotal: product.price,
      currency: '€'
    });

    // 2. Phase 13 VIP İndirimini uygula
    this.engine.setState('activeDiscount', {
      code: 'CONCIERGE_VIP_15',
      rate: 0.15,
      type: 'AI_OFFER'
    });

    // 3. Modülü Kapat ve God's Eye'a Sinyal Çak
    const box = document.getElementById('concierge-box');
    if (box) box.classList.add('hidden');
    
    if (this.engine.publish) {
        this.engine.publish('AI_AUTO_CLOSE_TRIGGERED', { product: product.name });
    }
    
    // Stripe veya Iyzico modalını açan global state'i tetikle
    this.engine.setState('paymentModalOpen', true);
  }

  // 🗣️ NEURAL VOICE: Psikolojik Satış Senaryoları
  playSalesScript(intentCategory) {
    if (!window.SantisVoice || !this.engine.getState('concierge').voiceEnabled) return;

    const scripts = {
      relaxation: "Sizi anlıyorum. Bedeninizin ve zihninizin bu molaya ihtiyacı var. Sizin için hazırladığım bu özel ritüeli, VIP ayrıcalığı ile hemen onaylayabilirsiniz.",
      skincare: "Cildinizin ışıltısını geri kazanması için en etkili protokolü hazırladım. Fırsatı onaylamak için ekrana dokunmanız yeterli.",
      urgent_booking: "Sizin için son uygun saati rezerve ediyorum. Lütfen işlemi tamamlayarak yerinizi garantiye alın."
    };

    const textToSpeak = scripts[intentCategory] || "Sizin için en uygun seçeneği hazırladım. Hemen onaylayabilirsiniz.";

    // Sessiz Lüks tonlaması: Derin, yavaş ve ikna edici
    window.SantisVoice.speak(textToSpeak, { pitch: 0.85, rate: 0.88, volume: 1.0 });
  }

  unmount() {
    this._isAlive = false;
    this._subscriptions.forEach(fn => fn());
    this._subscriptions = [];
    const root = document.getElementById('concierge-root');
    if (root) root.remove();
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

