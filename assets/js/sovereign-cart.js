// assets/js/sovereign-cart.js

const SovereignCart = {
  // Sepetin tarayıcı hafızasındaki anahtarı
  storageKey: "sovereign_booking_cart",

  // 1. Sepeti Getir
  getCart: function() {
    try {
      // Sessiz Lüks felsefesine uygun olarak sessionStorage kullanıldı.
      const cartData = sessionStorage.getItem(this.storageKey);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error("Sovereign Kalkanı: Sepet verisi okunamadı.", error);
      return [];
    }
  },

  // 2. Sepete Ritüel Ekle
  addItem: function(assetId, title, price) {
    const cart = this.getCart();
    
    // Aynı ritüel zaten sepette var mı kontrolü (Sessiz Lüks mükerrerliği sevmez)
    const exists = cart.find(item => item.id === assetId);
    if (exists) {
      console.log(`[Sovereign Cart] ${title} zaten sepetinizde bulunuyor.`);
      return false; // Eklenmedi
    }

    cart.push({ id: assetId, title: title, price: price, addedAt: new Date().toISOString() });
    sessionStorage.setItem(this.storageKey, JSON.stringify(cart));
    
    console.log(`[Sovereign Cart] ${title} rezervasyon ağına eklendi.`);
    this.triggerCartUpdateEvent(); // Arayüzü uyarmak için özel bir sinyal fırlat
    return true; // Başarıyla eklendi
  },

  // 3. Sepetten Ritüel Çıkar
  removeItem: function(assetId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.id !== assetId);
    sessionStorage.setItem(this.storageKey, JSON.stringify(cart));
    this.triggerCartUpdateEvent();
  },

  // 4. Arayüzü Güncelleme Sinyali (Otonom Bildirim)
  triggerCartUpdateEvent: function() {
    const event = new CustomEvent("sovereignCartUpdated", {
      detail: { cart: this.getCart() }
    });
    window.dispatchEvent(event);
  }
};

// Global erişim için window objesine bağlıyoruz
window.SovereignCart = SovereignCart;
