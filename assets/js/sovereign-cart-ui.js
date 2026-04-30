// assets/js/sovereign-cart-ui.js

/**
 * SANTIS_CONFIG öncelikli, fallback hardcoded değer.
 * Production'da window.SANTIS_CONFIG = { whatsappNumber: '9053...', apiBase: 'https://api.santis.club' }
 * olarak sayfa başında tanımlanmalıdır.
 */
function getSantisConfig() {
  const config = window.SANTIS_CONFIG || {};
  return {
    whatsappNumber: String(config.whatsappNumber || '905348350169').replace(/[^\d]/g, ''),
    apiBase: config.apiBase || '', // Boş string = telemetry devre dışı
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Otonom Arayüz İnşası: Sepet İkonu ve Çekmeceyi DOM'a enjekte et
  const uiContainer = document.createElement("div");
  uiContainer.innerHTML = `
    <div id="sovereign-cart-fab" style="position: fixed; bottom: 30px; right: 30px; width: 56px; height: 56px; background-color: var(--nv-anthracite); border: 1px solid var(--nv-brushed-gold); border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 100; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: transform 0.3s ease;">
      <span style="color: var(--nv-brushed-gold); font-size: 20px;">✧</span>
      <span id="sovereign-cart-badge" style="position: absolute; top: -5px; right: -5px; background-color: var(--nv-brushed-gold); color: var(--nv-anthracite); font-size: 12px; font-weight: bold; width: 22px; height: 22px; border-radius: 50%; display: none; justify-content: center; align-items: center;">0</span>
    </div>

    <div id="sovereign-cart-drawer" style="position: fixed; top: 0; right: 0; width: 340px; height: 100%; background-color: #151618; border-left: 1px solid #2A2B2E; transform: translateX(100%); transition: transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1); z-index: 200; padding: 30px; box-sizing: border-box; display: flex; flex-direction: column;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h2 style="color: var(--nv-brushed-gold); font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin: 0; font-weight: 300;">Rezervasyonlarınız</h2>
        <button id="sovereign-close-cart" style="background: none; border: none; color: #8E8E93; cursor: pointer; font-size: 18px;">✕</button>
      </div>

      <div id="sovereign-cart-items" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px;">
        <p style="color: #8E8E93; font-size: 13px; font-style: italic;">Şu an için planlanmış bir ritüel bulunmuyor.</p>
      </div>

      <div style="margin-top: 20px; border-top: 1px solid #2A2B2E; padding-top: 20px;">
        <button id="sovereign-checkout-btn" style="width: 100%; padding: 15px; background-color: var(--nv-brushed-gold); color: #151618; border: none; border-radius: 4px; font-size: 12px; font-weight: bold; letter-spacing: 1px; cursor: pointer; text-transform: uppercase; transition: opacity 0.3s ease;">
          Sovereign Club'a İlet
        </button>
      </div>
    </div>

    <div id="sovereign-cart-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 150; opacity: 0; pointer-events: none; transition: opacity 0.8s ease;"></div>
  `;
  document.body.appendChild(uiContainer);

  // 2. DOM Elementlerini Yakalama
  const fab = document.getElementById("sovereign-cart-fab");
  const badge = document.getElementById("sovereign-cart-badge");
  const drawer = document.getElementById("sovereign-cart-drawer");
  const overlay = document.getElementById("sovereign-cart-overlay");
  const closeBtn = document.getElementById("sovereign-close-cart");
  const itemsContainer = document.getElementById("sovereign-cart-items");

  // 3. Çekmeceyi Açma ve Kapama Mantığı
  const toggleCart = (show) => {
    drawer.style.transform = show ? "translateX(0)" : "translateX(100%)";
    overlay.style.opacity = show ? "1" : "0";
    overlay.style.pointerEvents = show ? "auto" : "none";
  };

  fab.addEventListener("click", () => toggleCart(true));
  closeBtn.addEventListener("click", () => toggleCart(false));
  overlay.addEventListener("click", () => toggleCart(false));

  // Event delegation — inline onclick yerine tek CSP uyumlu listener
  itemsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-item-id]");
    if (!button) return;
    const itemId = button.getAttribute("data-cart-item-id");
    if (itemId && window.SovereignCart?.removeItem) {
      window.SovereignCart.removeItem(itemId);
    }
  });

  // 4. Havaya Fırlatılan Sinyali Yakalama (Core Logic)
  window.addEventListener("sovereignCartUpdated", (event) => {
    const cart = event.detail.cart;
    
    // İkon rozetini (badge) güncelle
    if (cart.length > 0) {
      badge.textContent = cart.length;
      badge.style.display = "flex";
      // Nabız efekti
      fab.style.transform = "scale(1.1)";
      setTimeout(() => fab.style.transform = "scale(1)", 200);
    } else {
      badge.style.display = "none";
    }

    // Çekmece içindeki listeyi güncelle
    itemsContainer.innerHTML = "";
    if (cart.length === 0) {
      itemsContainer.innerHTML = '<p style="color: #8E8E93; font-size: 13px; font-style: italic;">Şu an için planlanmış bir ritüel bulunmuyor.</p>';
      return;
    }

    cart.forEach(item => {
      const itemEl = document.createElement("div");
      itemEl.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px; background-color: #1E1F22; border: 1px solid #2A2B2E; border-radius: 6px;";

      const titleWrap = document.createElement("div");
      const title = document.createElement("h4");
      title.style.cssText = "color: #E5E5EA; font-size: 13px; margin: 0 0 5px 0; font-weight: 400;";
      title.textContent = String(item.title ?? '');
      titleWrap.appendChild(title);

      const removeButton = document.createElement("button");
      removeButton.className = "santis-cart-remove";
      removeButton.dataset.cartItemId = String(item.id ?? '');
      removeButton.style.cssText = "background: none; border: none; color: #8E8E93; cursor: pointer; font-size: 16px;";
      removeButton.type = "button";
      removeButton.textContent = "✕";

      itemEl.appendChild(titleWrap);
      itemEl.appendChild(removeButton);
      itemsContainer.appendChild(itemEl);
    });
  });

  // 5. İlk yüklemede mevcut durumu senkronize et
  if (window.SovereignCart) {
    window.SovereignCart.triggerCartUpdateEvent();
  }

  // 6. Checkout (Sovereign Club'a İlet) Serüveni
  const checkoutBtn = document.getElementById("sovereign-checkout-btn");
  
  checkoutBtn.addEventListener("click", () => {
    const cart = window.SovereignCart ? window.SovereignCart.getCart() : [];
    
    if (cart.length === 0) return; // Boş sepetle VIP asistanı meşgul etme

    // Zarafetle formatlanmış karşılama mesajı
    let message = "✧ *Sovereign Club Rezervasyon Talebi* ✧\n\n";
    message += "Aşağıdaki ritüeller için VIP asistanlık talep ediyorum:\n\n";
    
    // Ritüelleri listele
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.title}\n`;
    });
    
    message += "\nLütfen uygunluk durumunu benimle paylaşın.";

    // Sovereign VIP Hattı
    const { whatsappNumber, apiBase } = getSantisConfig();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Nöral Fısıltı (Telemetry Ping) — yalnızca apiBase tanımlıysa çalışır
    if (apiBase) {
      fetch(`${apiBase}/api/v1/telemetry/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VIP_LEAD",
          message: "Sovereign Club WhatsApp kanalına yeni bir misafir geçiş yaptı.",
          cartSize: cart.length
        })
      }).catch((err) => {
        console.warn("[Santis Cart] Telemetry lead failed:", err);
      });
    }

    // Yeni sekmede WhatsApp'a süzül
    window.open(whatsappUrl, '_blank');

    // Mesaj iletildikten sonra odayı temizle (Sessiz Lüks buharlaşması)
    sessionStorage.removeItem(window.SovereignCart.storageKey);
    window.SovereignCart.triggerCartUpdateEvent();
    toggleCart(false); // Çekmeceyi kapat
  });
});
