import { Router, Request, Response } from 'express';

const router: import('express').Router = Router();

// GodMode radarına bağlanan tüm aktif komuta merkezlerini (istemcileri) hafızada tutarız
export const activeRadars = new Set<Response>();

/**
 * GET /api/v1/stream/events
 * GodMode Server-Sent Events (SSE) Bağlantı Noktası
 */
router.get('/events', (req: Request, res: Response) => {
  // Sessiz Lüks SSE (Server-Sent Events) Başlıkları
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // CORS ve güvenlik zırhı eklentileri (gerekirse)
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Radar bağlantısı kurulduğunda ilk fısıltıyı (Otonom Selamlama) gönder
  res.write(`data: ${JSON.stringify({ 
    eventType: 'system.radar.online', 
    message: 'Sovereign GodMode Radarı Çevrimiçi' 
  })}\n\n`);

  // Bu radarı aktif istemciler arasına ekle
  activeRadars.add(res);

  // Kiosk/GodMode kapatıldığında veya bağlantı koptuğunda hafızadan sil (Memory Leak Zırhı)
  req.on('close', () => {
    activeRadars.delete(res);
  });
});

export default router;
