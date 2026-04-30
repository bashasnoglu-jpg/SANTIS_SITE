import type { SovereignBus } from "@santis/sovereign-bus";
import type { SantisEvent } from "@santis/event-dictionary";

/**
 * 📊 IN-MEMORY READ MODELS (Projections)
 * Gerçekte bu veriler Redis'e veya MongoDB'nin hızlı bir View koleksiyonuna yazılır.
 * Okuma işlemleri her zaman 0ms sürer çünkü veri önden hesaplanmıştır!
 */
export const BoardroomReadModels = {
  revenueMetrics: {
    totalRevenue: 0,
    dailyTarget: 50000,
    trend: "neutral" as "up" | "down" | "neutral",
    delta: 0,
    lastUpdateTraceId: null as string | null
  },
  moodHeatmap: {
    deep_relaxation: 0,
    recovery: 0,
    detox: 0,
    beauty: 0,
    couple_connection: 0
  }
};

/**
 * MİMARİ SIR: Hem canlı akan veriyi hem de geçmişten gelen (Replay) veriyi 
 * tek bir merkezden projeksiyonlara yansıtan Hydrator motoru.
 */
export const projectEvent = (event: SantisEvent) => {
  if (event.eventType === "experience.interaction.mood_selected") {
    const mood = event.payload.mood;
    if (BoardroomReadModels.moodHeatmap[mood as keyof typeof BoardroomReadModels.moodHeatmap] !== undefined) {
      BoardroomReadModels.moodHeatmap[mood as keyof typeof BoardroomReadModels.moodHeatmap] += 1;
      console.log(`🔥 [Projection: Mood] Isı haritası güncellendi: ${mood} (${BoardroomReadModels.moodHeatmap[mood as keyof typeof BoardroomReadModels.moodHeatmap]})`);
    }
  }

  if (event.eventType === "commerce.upsell.therapist_accepted") {
    const amount = event.payload.upsellAmount;
    const previousRevenue = BoardroomReadModels.revenueMetrics.totalRevenue;
    BoardroomReadModels.revenueMetrics.totalRevenue += amount;
    
    if (previousRevenue > 0) {
      BoardroomReadModels.revenueMetrics.delta = parseFloat(((amount / previousRevenue) * 100).toFixed(1));
      BoardroomReadModels.revenueMetrics.trend = "up";
    }
    BoardroomReadModels.revenueMetrics.lastUpdateTraceId = event.traceId;
    console.log(`💰 [Projection: Revenue] Kasa güncellendi: +€${amount}. Toplam: €${BoardroomReadModels.revenueMetrics.totalRevenue}`);
  }
};

import { broadcastCoreStatePatch } from "../routes/core-state-stream";

/**
 * 📡 PROJECTION SUBSCRIBERS (Event Dinleyicileri)
 */
export const registerBoardroomProjections = (bus: SovereignBus) => {
  console.log("📈 [Projections] Boardroom Dinleyicileri Aktif.");

  // Canlı (Live) eventleri dinle ve projeksiyona uygula
  bus.events.subscribe("experience.interaction.mood_selected", async (e: any) => {
    projectEvent(e);
  });
  
  bus.events.subscribe("commerce.upsell.therapist_accepted", async (e: any) => {
    projectEvent(e);
    
    // Broadcast live delta to the Boardroom PRO Cockpit
    broadcastCoreStatePatch({
      totalRevenue: BoardroomReadModels.revenueMetrics.totalRevenue,
      bookingCount: Math.floor(BoardroomReadModels.revenueMetrics.totalRevenue / 1500), // Mock booking count for now
    });
  });
};
