import { santisEventBus } from './santis-event-bus.js';
import { z } from 'zod'; 

// Misafir katmanına inen verinin "Egemen Sözleşmesi" (Sovereign Contract)
const GuestPricingContract = z.object({
  multiplier: z.number().positive("Çarpan pozitif olmalıdır"),
  reason: z.string().min(5, "Açıklanabilirlik gerekçesi yetersiz").nullable()
});

/**
 * Santis Dynamic Pricing Engine (Zod Hardened)
 * Truth Layer'dan gelen anlık talep verilerini merkezi Event Bus üzerinden alır, doğrular ve fiyatları günceller.
 */
export class SantisDynamicPricing {
  constructor() {
    // Merkezi İstihbarat Bağlantısı (Event Bus üzerinden)
    this.bus = santisEventBus;
    this.priceElements = document.querySelectorAll('.pkg-card-price');
    this.init();
  }

  init() {
    console.log('💎 Dinamik Fiyatlandırma Motoru (Sovereign Sync) başlatıldı...');

    this.bus.on('public:pricing_update', (rawData) => {
      try {
        // Gelen veriyi Zod sözleşmesinden geçiriyoruz
        const validatedData = GuestPricingContract.parse(rawData);
        
        // Eğer parse işlemi başarılıysa (veri temizse), UI güncellenir
        this.updatePrices(validatedData.multiplier, validatedData.reason);
      } catch (error) {
        // Açıklanabilirlik Derinliği: Hatalı veri misafire yansıtılmaz, sessizce loglanır
        console.warn('🛡️ Sovereign Guard: Geçersiz fiyatlandırma verisi reddedildi.', error.errors || error);
      }
    });
  }

  updatePrices(multiplier, reason) {
    this.priceElements.forEach(priceEl => {
      let basePrice = parseInt(priceEl.getAttribute('data-base-price'));
      
      if (!basePrice) {
        basePrice = parseInt(priceEl.innerText.replace(/[^0-9]/g, ''));
        priceEl.setAttribute('data-base-price', basePrice);
      }

      const newPrice = Math.round(basePrice * multiplier);
      const isIncreasing = multiplier > 1;
      
      // Mikro-kinetik animasyon ve görsel feedback
      priceEl.style.transform = 'scale(1.08)';
      priceEl.style.color = isIncreasing ? 'var(--color-warning-text)' : 'var(--color-primary-text)';
      
      setTimeout(() => {
        priceEl.innerText = `${newPrice} €`;
        priceEl.style.transform = 'scale(1)';
      }, 150);

      priceEl.style.transition = 'all var(--duration-normal) var(--ease-lux)';

      // Açıklanabilirlik Derinliği: Misafire neden değiştiğini gösteriyoruz
      this.injectExplanationToken(priceEl, multiplier, reason);
    });
  }

  injectExplanationToken(priceEl, multiplier, reason) {
    const card = priceEl.closest('.santis-pkg-card');
    if (!card) return;

    let badge = card.querySelector('.santis-demand-badge');
    
    if (multiplier > 1.0 && reason) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'santis-demand-badge';
        
        // Token tabanlı lüks tasarım
        Object.assign(badge.style, {
          fontSize: 'var(--text-xs)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-warning-bg-subtle)',
          color: 'var(--color-warning-text)',
          marginLeft: 'var(--spacing-sm)',
          fontFamily: 'var(--font-body)',
          verticalAlign: 'middle',
          opacity: '0',
          transform: 'translateY(5px)',
          transition: 'all 0.4s var(--ease-lux)',
          cursor: 'pointer',
          border: '1px solid var(--color-warning-border-subtle)'
        });

        // Hover Efekti
        badge.onmouseenter = () => badge.style.backgroundColor = 'var(--color-warning-bg)';
        badge.onmouseleave = () => badge.style.backgroundColor = 'var(--color-warning-bg-subtle)';

        // Tıklama: Açıklanabilirlik Modülü Tetikleyici ve Niyet Takibi
        badge.onclick = (e) => {
          e.stopPropagation();
          
          // Niyet Sinyali (Intent Signal) Gönderimi
          const intentData = {
            packageId: card.querySelector('.santis-pkg-title').innerText,
            action: "explanation_viewed",
            timestamp: new Date().toISOString(),
            currentMultiplier: multiplier
          };
          this.bus.emit('public:guest_intent', intentData);
          console.log('📡 [Sovereign Tracker]: Misafir niyet sinyali Truth Layer\'a iletildi.', intentData);

          this.showExplanationDetail(reason);
        };
        
        const meta = card.querySelector('.pkg-card-meta') || priceEl.parentElement;
        meta.appendChild(badge);
        
        requestAnimationFrame(() => {
          badge.style.opacity = '1';
          badge.style.transform = 'translateY(0)';
        });
      }
      badge.innerText = reason; 
    } else if (badge) {
      badge.style.opacity = '0';
      badge.style.transform = 'translateY(-5px)';
      setTimeout(() => badge.remove(), 400);
    }
  }

  showExplanationDetail(reason) {
    // Santis Sovereign Intelligence Modal (Simple Injection)
    console.log(`🌌 Sovereign Intelligence: ${reason} gerekçesi için detaylar hazırlanıyor...`);
    
    const modalHtml = `
      <div id="santis-intel-modal" style="position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); opacity:0; transition:opacity 0.5s ease;">
        <div style="background:var(--color-surface-glass); border:1px solid var(--color-border-glass); padding:var(--spacing-3xl); border-radius:var(--radius-2xl); max-width:400px; text-align:center; transform:scale(0.9); transition:transform 0.5s var(--ease-lux);">
          <div style="color:var(--color-warning-text); font-size:var(--text-xs); letter-spacing:0.2em; margin-bottom:var(--spacing-md);">SOVEREIGN INTELLIGENCE</div>
          <h2 style="color:var(--color-text-primary); font-family:var(--font-display); margin-bottom:var(--spacing-lg);">${reason}</h2>
          <p style="color:var(--color-text-secondary); font-size:var(--text-sm); line-height:1.6; margin-bottom:var(--spacing-xl);">
            Santis OS Antigravity AI, şu anki sistem doluluğunu ve talep yoğunluğunu analiz ederek kapasite dengesini korumak adına bu otonom fiyatlandırma kararını almıştır.
          </p>
          <button onclick="document.getElementById('santis-intel-modal').remove()" style="background:none; border:1px solid var(--color-border-glass); color:var(--color-text-primary); padding:var(--spacing-md) var(--spacing-xl); border-radius:var(--radius-full); cursor:pointer; font-size:var(--text-xs); letter-spacing:0.1em;">ANLADIM</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('santis-intel-modal');
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      modal.querySelector('div').style.transform = 'scale(1)';
    });
  }
}
