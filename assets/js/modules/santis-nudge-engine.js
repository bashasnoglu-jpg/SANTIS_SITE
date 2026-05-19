import { santisEventBus } from './santis-event-bus.js';
import { z } from 'zod';

// Nudge Teklifi Zod Sözleşmesi
const NudgeContract = z.object({
  packageId: z.string(),
  offerTitle: z.string(),
  offerText: z.string(),
  expiresIn: z.number().positive()
});

/**
 * Santis Nudge Engine
 * Antigravity AI'dan gelen otonom teklifleri merkezi Event Bus üzerinden alır ve misafire lüks bir formatta sunar.
 */
export class SantisNudgeEngine {
  constructor() {
    // Merkezi İstihbarat Bağlantısı (Event Bus üzerinden)
    this.bus = santisEventBus;
    this.init();
  }

  init() {
    console.log('🎁 Nudge Engine (Dürtü Motoru) aktif edildi.');

    this.bus.on('public:nudge_offer', (rawData) => {
      try {
        const validatedOffer = NudgeContract.parse(rawData);
        this.displayEliteOffer(validatedOffer);
      } catch (error) {
        console.warn('🛡️ Geçersiz elit teklif reddedildi.', error.errors || error);
      }
    });
  }

  displayEliteOffer(offer) {
    if (document.getElementById('santis-nudge-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'santis-nudge-toast';
    
    // Token mimarisine uygun Toast stili
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: 'var(--spacing-2xl)',
      right: 'var(--spacing-2xl)',
      backgroundColor: 'rgba(20, 20, 20, 0.85)',
      backdropFilter: 'blur(15px)',
      border: '1px solid var(--color-warning-border-subtle)',
      padding: 'var(--spacing-lg)',
      borderRadius: 'var(--radius-xl)',
      color: 'var(--color-text-primary)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      zIndex: '9999',
      maxWidth: '320px',
      transform: 'translateY(100px)',
      opacity: '0',
      transition: 'all 0.6s var(--ease-lux)',
      fontFamily: 'var(--font-body)'
    });

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <span style="color: var(--color-warning-text); font-size: 1.2rem;">✨</span>
        <h4 style="margin: 0; font-family: var(--font-display); font-size: 1rem; color: var(--color-warning-text); letter-spacing: 0.05em;">
          ${offer.offerTitle}
        </h4>
      </div>
      <p style="margin: 0; font-size: 0.85rem; line-height: 1.6; color: var(--color-text-secondary);">
        ${offer.offerText}
      </p>
      <button id="santis-apply-offer-btn" style="margin-top: 16px; width: 100%; padding: 10px; background: var(--color-warning-bg-subtle); color: var(--color-warning-text); border: 1px solid var(--color-warning-border-subtle); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.75rem; letter-spacing: 0.1em; transition: all 0.3s ease;">
        TEKLİFİ AKTİF ET & REZERVE ET
      </button>
    `;

    document.body.appendChild(toast);

    const btn = toast.querySelector('#santis-apply-offer-btn');
    btn.onclick = () => {
      btn.innerText = "UYGULANDI ✓";
      btn.style.backgroundColor = "var(--color-success-bg-subtle)";
      btn.style.color = "var(--color-success-text)";
      
      // Misafiri rezervasyon modülüne yönlendir veya modülü aç
      setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        if (window.openReservationModal) {
          window.openReservationModal(offer.packageId + " (Elite Offer Applied)");
        } else {
          window.location.href = `https://wa.me/905348350169?text=Merhaba, ${offer.packageId} için özel teklifimi kullanmak istiyorum.`;
        }
        setTimeout(() => toast.remove(), 600);
      }, 800);
    };

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    // Otomatik kapanma
    setTimeout(() => {
      if (document.getElementById('santis-nudge-toast')) {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 600);
      }
    }, 15000); 
  }
}
