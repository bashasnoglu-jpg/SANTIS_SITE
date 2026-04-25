import express from 'express';
import { SovereignPricingService } from '../services/pricing.service';

const router = express.Router();
const pricingService = new SovereignPricingService();

/**
 * GET /api/v1/rituals/pricing
 * Kiosk bu rotaya istek atarak ritüelin otonom fiyatını (Prestij Vektörü) çeker.
 */
router.get('/', (req, res) => {
  try {
    const { ritualId, basePrice, guestSegment } = req.query;

    if (!ritualId || !basePrice) {
      return res.status(400).json({ error: "Eksik parametre: ritualId ve basePrice zorunludur." });
    }

    // Gerçekte bu veriler (Occupancy) DB'den veya GodMode Radarı'ndan çekilir.
    // Şimdilik sistemin yaşayan doğasını simüle ediyoruz:
    const mockOccupancyRate = 85; // %85 doluluk (Kritik sınır %70'in üstü)
    const mockHighDemandWindow = false;

    // Fiyatlandırma motorunu (Yield Engine) ateşle
    const pricingVector = pricingService.calculateNeuralPrice({
      ritualId: String(ritualId),
      basePrice: Number(basePrice),
      currentOccupancyRate: mockOccupancyRate,
      guestSegment: (guestSegment as any) || 'STANDARD',
      isHighDemandWindow: mockHighDemandWindow
    });

    res.json({
      success: true,
      data: pricingVector
    });
  } catch (error) {
    console.error("[SOVEREIGN PRICING ROUTE] Kalkan Hatası:", error);
    res.status(500).json({ error: "Prestij vektörü hesaplanamadı." });
  }
});

export default router;
