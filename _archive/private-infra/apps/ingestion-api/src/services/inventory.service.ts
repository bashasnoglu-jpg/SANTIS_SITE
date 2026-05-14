// apps/ingestion-api/src/services/inventory.service.ts

export interface InventoryItem {
  itemId: string;
  name: string;
  currentStock: number;
  criticalThreshold: number; // Bu seviyenin altına inildiğinde alarm tetiklenir
}

export class SovereignInventoryService {
  // Simüle edilmiş Sovereign Vault (Gerçekte DB'den çekilir)
  private vault: Map<string, InventoryItem> = new Map([
    ['sothys_nad_ampoule', { itemId: 'sothys_nad_ampoule', name: 'Sothys NAD+ Cellular Ampoule', currentStock: 12, criticalThreshold: 5 }],
    ['gold_leaf_serum', { itemId: 'gold_leaf_serum', name: '24K Gold Leaf Serum', currentStock: 8, criticalThreshold: 3 }]
  ]);

  /**
   * Ritüel mühürlendiğinde otonom olarak malzemeleri düşer.
   */
  public async consumeMaterials(ritualId: string): Promise<void> {
    // Ritüel reçetesi haritalaması (Bunu DB'den de okuyabiliriz)
    const recipe = this.getRitualRecipe(ritualId);

    console.log(`[SOVEREIGN LOJİSTİK] ${ritualId} mühürlendi. Stoklar otonom olarak güncelleniyor...`);

    for (const requirement of recipe) {
      const item = this.vault.get(requirement.itemId);
      
      if (item) {
        item.currentStock -= requirement.quantity;
        console.log(`[ENANTER ZIRHI] ${item.name} tüketildi. Kalan Stok: ${item.currentStock}`);

        // Kritik seviye kontrolü
        if (item.currentStock <= item.criticalThreshold) {
          await this.triggerProcurementWhisper(item);
        }
      }
    }
  }

  /**
   * Fiyatlandırma motoru için ritüelin kıtlık (scarcity) durumunu analiz eder.
   * Eğer ritüelin reçetesindeki herhangi bir ürün kritik eşikteyse true döner.
   */
  public isRitualInScarcity(ritualId: string): boolean {
    const recipe = this.getRitualRecipe(ritualId);
    
    for (const requirement of recipe) {
      const item = this.vault.get(requirement.itemId);
      if (item && item.currentStock <= item.criticalThreshold) {
        console.warn(`[SOVEREIGN RADAR] ${item.name} kıtlık seviyesinde. Kıtlık Çarpanı tetikleniyor!`);
        return true;
      }
    }
    return false;
  }

  private getRitualRecipe(ritualId: string) {
    // Örnek reçete: NAD+ Infusion ritüeli 2 ampul ve 1 serum tüketir
    if (ritualId === 'sovereign_choice_nad') {
      return [
        { itemId: 'sothys_nad_ampoule', quantity: 2 },
        { itemId: 'gold_leaf_serum', quantity: 1 }
      ];
    }
    return [];
  }

  /**
   * Stok kritik seviyeye düştüğünde Satın Alma (Procurement) birimine Nöral Fısıltı gönderir.
   */
  private async triggerProcurementWhisper(item: InventoryItem): Promise<void> {
    console.warn(`[SOVEREIGN ALARM] ⚠️ KRİTİK STOK: ${item.name}. Sadece ${item.currentStock} adet kaldı!`);
    // Burada SovereignBus üzerinden 'inventory.stock.critical' event'i fırlatılır.
    // Bu fısıltı GodMode ekranında kırmızı/altın bir uyarıya veya tedarikçiye giden otomatik bir maile dönüşebilir.
  }
}
