/**
 * SANTIS OS - MODULE: Stripe UI Component
 * Architecture: Frictionless Stripe Elements, Zero-Redirect Checkout
 */

export class StripeGatewayModule {
  constructor(engine) {
    this.engine = engine;
    this._isAlive = false;
    this.stripe = null;
    this.elements = null;
  }

  async mount() {
    this._isAlive = true;
    
    // Stripe.js asenkron yüklenir (Eğer index.html'de yoksa)
    this.stripe = window.Stripe('pk_test_SANTIS_PUBLIC_KEY'); 

    // Çekirdekten gelen "Kasa Mühürlendi" sinyalini dinle
    this.engine.subscribe('checkoutPayloadSealed', async (payload) => {
      if (!this._isAlive) return;
      await this.initializeStripeUI(payload.token, payload.signature);
    });
  }

  async initializeStripeUI(token, signature) {
    const container = document.getElementById('santis-payment-container');
    if (!container) return;

    // Yükleniyor animasyonu
    container.innerHTML = '<div class="animate-pulse h-40 bg-gray-100 rounded-xl"></div>';

    try {
      // 1. Sunucudan client_secret talep et
      const response = await fetch('/api/checkout/intent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({ token, signature })
      });

      const { clientSecret, error } = await response.json();
      if (error) throw new Error(error);

      // 2. Stripe Elements Görünümünü Santis DNA'sına Uyarla (Quiet Luxury)
      const appearance = {
        theme: 'flat',
        variables: {
          fontFamily: 'Inter, sans-serif',
          colorBackground: '#ffffff',
          colorText: '#111827',
          colorPrimary: '#D4AF37', // santis-gold
          borderRadius: '8px',
          spacingUnit: '4px',
        },
        rules: {
          '.Input': { border: '1px solid #E5E7EB', boxShadow: 'none' },
          '.Input:focus': { border: '1px solid #111827' }
        }
      };

      this.elements = this.stripe.elements({ clientSecret, appearance });
      
      // 'payment' elementi kart, Apple Pay ve Google Pay'i tek satırda çözer
      const paymentElement = this.elements.create('payment', { layout: 'tabs' });
      
      container.innerHTML = ''; // Skeleton'ı temizle
      paymentElement.mount(container);

      this.bindSubmitEvent();

    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">${err.message}</p>`;
    }
  }

  bindSubmitEvent() {
    const form = document.getElementById('santis-payment-form');
    const submitBtn = document.getElementById('santis-pay-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-pulse">İşleniyor...</span>';

      // 3. Ödemeyi Onayla ve Tamamla
      const { error } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          // Ödeme başarılı olduğunda Santis'in Sovereign Teşekkür sayfasına yönlendir (veya SPA içinde çöz)
          return_url: `${window.location.origin}/tr/checkout/success`,
        },
      });

      if (error) {
        // Hata durumunda (Bakiye yetersiz, red vs.) DOM'u kasmadan mesajı göster
        const messageContainer = document.querySelector('#payment-message');
        messageContainer.textContent = error.message;
        messageContainer.classList.remove('hidden');
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tekrar Dene';
      }
    });
  }

  unmount() {
    this._isAlive = false;
    // Bellek sızıntısını önlemek için iframe'leri temizle
    if (this.elements) {
        const paymentElement = this.elements.getElement('payment');
        if (paymentElement) paymentElement.destroy();
    }
  }
}
