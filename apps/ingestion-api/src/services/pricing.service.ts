// apps/ingestion-api/src/services/pricing.service.ts

import { SovereignInventoryService } from './inventory.service';

export type GuestSegment = 'STANDARD' | 'PREMIUM' | 'UHNWI';

export interface PricingContext {
  ritualId: string;
  basePrice: number;
  currentOccupancyRate: number; // 0 ile 100 arası (%)
  guestSegment: GuestSegment;
  isHighDemandWindow: boolean;  // Örn: Karadağ sezon zirvesi veya özel saatler
}

export interface PricingVector {
  ritualId: string;
  finalPrice: number;
  breakdown: {
    base: number;
    yieldMultiplier: number;
    segmentMultiplier: number;
    scarcityMultiplier: number;
    demandPremium: number;
  };
  lockedAt: Date; // Fiyatın geçerlilik süresini mühürlemek için
}

export class SovereignPricingService {
  
  private readonly MAX_YIELD_MULTIPLIER = 1.4; // %40'a kadar otonom artış
  private readonly UHNWI_PRESTIGE_FACTOR = 1.15; // UHNWI segmentine özel "Beyaz Eldiven" hizmet bedeli çarpanı
  private readonly HIGH_DEMAND_SURGE = 500; // Sabit dalgalanma primi ($)
  private readonly SCARCITY_MULTIPLIER = 1.20; // %20 Kıtlık Çarpanı Eklendi

  private inventoryService: SovereignInventoryService;

  constructor() {
    this.inventoryService = new SovereignInventoryService();
  }

  /**
   * Statik bir ritüel fiyatını, o anki matris durumuna göre 'Prestij Vektörüne' dönüştürür.
   */
  public calculateNeuralPrice(context: PricingContext): PricingVector {
    let currentMultiplier = 1.0;
    let segmentMultiplier = 1.0;
    let scarcityMultiplier = 1.0;
    let demandPremium = 0;

    // 1. Doluluk Çarpanı (Occupancy Yield): Doluluk %70'i geçerse fiyat otonom olarak bükülmeye başlar.
    if (context.currentOccupancyRate > 70) {
      // Örn: %85 doluluk -> %15 aşım. Çarpan logaritmik veya lineer artabilir.
      const excessOccupancy = context.currentOccupancyRate - 70;
      currentMultiplier = Math.min(1.0 + (excessOccupancy * 0.01), this.MAX_YIELD_MULTIPLIER);
    }

    // 2. Segment Çarpanı (Prestige Factor): UHNWI ekstra mahremiyet ve güvenlik protokolleri gerektirir.
    if (context.guestSegment === 'UHNWI') {
      segmentMultiplier = this.UHNWI_PRESTIGE_FACTOR;
    }

    // 3. KITLIK ÇARPANI (Scarcity Multiplier) - Lojistik Zekâ'dan gelen Nöral Sinyal
    if (this.inventoryService.isRitualInScarcity(context.ritualId)) {
      scarcityMultiplier = this.SCARCITY_MULTIPLIER;
    }

    // 4. Dalgalanma Primi (Demand Surge): Belirli saat/sezonlarda sabit ekleme.
    if (context.isHighDemandWindow) {
      demandPremium = this.HIGH_DEMAND_SURGE;
    }

    // Nöral Sentez (Kıtlık Çarpanı eklendi): Base * Yield * Segment * Scarcity + Surge
    const rawPrice = (context.basePrice * currentMultiplier * segmentMultiplier * scarcityMultiplier) + demandPremium;
    
    // Sessiz Lüks Estetiği: Fiyatlar her zaman 100'ün katlarına yuvarlanır (Örn: $8.532 yerine $8.500 veya $8.600)
    const finalPrice = Math.ceil(rawPrice / 100) * 100;

    console.log(`[SOVEREIGN PRICING] Vektör Hesaplandı | Base: $${context.basePrice} | Scarcity: ${scarcityMultiplier}x | Final: $${finalPrice}`);

    return {
      ritualId: context.ritualId,
      finalPrice,
      breakdown: {
        base: context.basePrice,
        yieldMultiplier: Number(currentMultiplier.toFixed(2)),
        segmentMultiplier: Number(segmentMultiplier.toFixed(2)),
        scarcityMultiplier: Number(scarcityMultiplier.toFixed(2)),
        demandPremium
      },
      lockedAt: new Date()
    };
  }
}
