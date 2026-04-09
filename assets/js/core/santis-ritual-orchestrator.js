/**
 * SANTIS SOVEREIGN OS - Ritual Orchestrator
 * Zero Dependency VIP Concierge Handoff System
 */
class SantisRitualOrchestrator {
  constructor() {
    // Yeni Kuantum Durumu (State) - Artık her şeyi tek bir 'items' dizisinde tutuyoruz
    this.vault = {
      items: [], 
      guestCount: 1,
      totalDuration: 0,
      totalPrice: 0,
      currency: 'EUR'
    };
    
    this.conciergeNumber = "905551234567"; // Santis VIP WhatsApp Hattı
    this._bindEvents();
  }

  _bindEvents() {
    // Legacy support handling or future integrations
    document.addEventListener('santis:ritual:handoff', () => {
        this.executeHandoff();
    });
  }

  // --- OTONOM EKLEME MOTORU ---
  
  toggleVault(id) {
    if (this.vault.items.find(i => i.id === id)) {
      this.removeFromVault(id);
      return false;
    } else {
      this.addToVault(id);
      return true;
    }
  }

  addToVault(id) {
    const master = window.SantisData.masterCatalog;
    let foundItem = null;
    let itemType = null;

    // 1. Önce bu ID bir 'Journey' (Paket) mi diye bak
    foundItem = master.journeys.items.find(j => j.id === id);
    if (foundItem) itemType = 'journey';

    // 2. Journey değilse, 'Services' (Tekil Servisler) içinde ara
    if (!foundItem) {
      for (const cat of master.services) {
        foundItem = cat.items.find(s => s.id === id);
        if (foundItem) {
          itemType = 'service';
          break;
        }
      }
    }

    if (!foundItem) {
      console.error(`❌ [Orchestrator] Kuantum Çöküşü: ${id} ID'li mühimmat Master Catalog'da bulunamadı!`);
      return;
    }

    // 3. Çifte eklemeyi (Duplication) engelle
    if (!this.vault.items.find(i => i.id === foundItem.id)) {
      
      // Fiyat ve süreyi yapıya göre normalize ederek kasaya al
      this.vault.items.push({
        id: foundItem.id,
        name: foundItem.name,
        price: itemType === 'journey' ? foundItem.total_price : foundItem.price,
        // Journey'lerin sabit bir total süresi JSON'da olmadığı için null geçiyoruz, servislerin var
        duration: itemType === 'journey' ? null : foundItem.duration_minutes,
        type: itemType
      });

      console.log(`🦅 [Orchestrator] Kasaya Zerk Edildi: ${foundItem.name}`);
      this._recalculateVault();
    }
  }

  removeFromVault(id) {
    this.vault.items = this.vault.items.filter(i => i.id !== id);
    console.log(`🦅 [Orchestrator] Kasadan Çıkarıldı: ${id}`);
    this._recalculateVault();
  }

  setGuestCount(count) {
    this.vault.guestCount = count > 0 ? count : 1;
    this._recalculateVault();
  }

  // --- INTERNAL PHYSICS ---

  _recalculateVault() {
    let price = 0;
    let duration = 0;
    let hasJourney = false; // İçinde bir paket varsa UI'a "Full Journey" yazdırmak için bayrak

    this.vault.items.forEach(item => {
      price += item.price;
      if (item.duration) duration += item.duration;
      if (item.type === 'journey') hasJourney = true;
    });

    this.vault.totalPrice = price * this.vault.guestCount;
    this.vault.totalDuration = duration;

    // UI'ı tetikleyen Golden Pulse sinyali
    document.dispatchEvent(new CustomEvent('santis:vault:updated', { 
      detail: {
        ...this.vault,
        displayDuration: hasJourney ? "Full Journey" : `${duration} MIN`
      }
    }));
  }

  // --- SECURE VIP HANDOFF (API CORE) ---

  async executeHandoff() {
    // 1. Kasa (Vault) boşsa işlemi iptal et
    if (this.vault.items.length === 0) {
      console.warn("⚠️ [Orchestrator] Kasa boş. Kuantum atlayışı iptal edildi.");
      return;
    }

    // 2. Sovereign Server'ın anlayacağı dilde Payload (Veri Yükü) hazırla
    const payload = {
      intent_type: "luxury_booking",
      guest_count: this.vault.guestCount,
      items: this.vault.items.map(i => i.id),
      metrics: {
        total_duration: this.vault.displayDuration,
        total_price: this.vault.totalPrice,
        currency: this.vault.currency
      },
      timestamp: new Date().toISOString()
    };

    try {
      console.log("🦅 [Orchestrator] Secure API Handoff başlatılıyor...", payload);

      // 3. Kuantum Tüneli (Vanilla JS Fetch) ile Port 8080'e bağlan
      // Not: Endpoint'i Sovereign Server loglarındaki rotaya göre ayarladım
      const response = await fetch('http://localhost:8080/api/v1/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sovereign-Client': 'Santis-Web-Core' // Güvenlik imzası
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Anomaly! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ [Orchestrator] Handoff Başarılı. Sunucu Yanıtı:", result);

      // 4. UI Motoruna "Başarılı" sinyali gönder (Sovereign Bus üzerinden)
      document.dispatchEvent(new CustomEvent('santis:handoff:success', { 
        detail: { response: result, originalVault: this.vault } 
      }));

      // 5. Kasayı temizle (İsteğe bağlı - rezervasyon sonrası)
      this.clearVault(); 

    } catch (error) {
      console.error("❌ [Orchestrator] API Handoff Çöktü:", error);
      
      // UI Motoruna "Hata" sinyali gönder
      document.dispatchEvent(new CustomEvent('santis:handoff:error', { 
        detail: error.message 
      }));
    }
  }

  // Kasayı sıfırlayan yardımcı metod
  clearVault() {
    this.vault.items = [];
    this._recalculateVault();
  }
}

// Global Singleton Instance
window.SantisRitualOrchestrator = new SantisRitualOrchestrator();
