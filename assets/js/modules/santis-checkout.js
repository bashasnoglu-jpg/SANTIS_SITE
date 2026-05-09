/**
 * SANTIS OS - MODULE: Checkout State Manager
 * Architecture: Reactive Pricing, Zero-Reload Validation
 */

export class CheckoutManagerModule {
  constructor(engine) {
    this.engine = engine;
    this._isAlive = false;
    this._subscriptions = [];
    
    // Varsayılan sepet verisi (Normalde API veya LocalStorage'dan gelir)
    this.cartData = { subtotal: 4500, currency: '₺' }; 
  }

  mount() {
    this._isAlive = true;
    this.initCheckoutUI();

    // Çekirdeği dinle: activeDiscount State'i değiştiği an tetiklenir
    const unsubDiscount = this.engine.subscribe('activeDiscount', (discountData) => {
      if (!this._isAlive || !discountData) return;
      this.applyDiscount(discountData);
    });

    this._subscriptions.push(unsubDiscount);
  }

  initCheckoutUI() {
    // Sayfa ilk yüklendiğinde temel fiyatları bas
    this.updatePriceDOM(this.cartData.subtotal, 0, this.cartData.subtotal);
  }

  applyDiscount(discountData) {
    // 1. Matematiği Çöz
    const discountAmount = this.cartData.subtotal * discountData.rate;
    const finalTotal = this.cartData.subtotal - discountAmount;

    // 2. DOM İnfazı (Jank-Free)
    requestAnimationFrame(() => {
      // Satır içi sepet güncellemesi
      this.updatePriceDOM(this.cartData.subtotal, discountAmount, finalTotal);

      // Arayüzde "Sessiz Lüks" onay mesajı
      this.showSuccessToast(`${discountData.code} başarıyla uygulandı.`);
      
      // Gerekirse sepet görünümüne VIP rozeti ekle
      const checkoutBox = document.getElementById('santis-checkout-summary');
      if (checkoutBox) {
        checkoutBox.classList.add('border-santis-gold', 'santis-checkout-discount-active');
      }
    });
  }

  updatePriceDOM(subtotal, discount, total) {
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountRow = document.getElementById('cart-discount-row');
    const discountEl = document.getElementById('cart-discount-amount');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString('tr-TR')} ₺`;
    
    if (discount > 0 && discountRow && discountEl) {
      discountRow.classList.remove('hidden'); // İndirim satırını göster
      discountEl.textContent = `- ${discount.toLocaleString('tr-TR')} ₺`;
      
      // Toplam fiyat animasyonu (Eskisini çiz, yenisini yaz)
      if (totalEl) {
        totalEl.innerHTML = `
          <span class="santis-checkout-previous-total line-through text-lg mr-2">${subtotal.toLocaleString('tr-TR')} ₺</span>
          <span class="text-3xl text-santis-gold font-light animate-fade-in">${total.toLocaleString('tr-TR')} ₺</span>
        `;
      }
    } else {
      if (totalEl) totalEl.textContent = `${total.toLocaleString('tr-TR')} ₺`;
    }
  }

  showSuccessToast(msg) {
    // Sağ üst köşede beliren minimalist bildirim
    const toast = document.createElement('div');
    toast.className = 'santis-checkout-toast fixed top-5 right-5 px-6 py-4 rounded shadow-lg transform translate-x-10 opacity-0 transition-all duration-500 font-light tracking-wide text-sm';
    toast.textContent = msg;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-10', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-x-10', 'opacity-0');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  unmount() {
    this._isAlive = false;
    this._subscriptions.forEach(fn => fn());
    this._subscriptions = [];
  }
}
