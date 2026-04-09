/**
 * SovereignStreamer: Fiber Optik SSE (Server-Sent Events) Bağlantısı
 * Backend'den gelen gerçek zamanlı (Real-Time) olayları dinler ve Store'a pompalar.
 */
import { sovereignStore } from '../state/sovereignStore.js';

export const SovereignStreamer = (() => {
    // API'mizde tasarladığın gerçek God Mode stream uç noktası
    const STREAM_URL = 'http://localhost:3000/api/v1/streams/god'; 
    let eventSource = null;

    const connect = () => {
        if (eventSource) return;

        console.log("📡 [Sovereign Streamer] Fiber optik hat çekiliyor... Matrix'e bağlanılıyor.");
        
        // Native SSE Bağlantısı
        eventSource = new EventSource(STREAM_URL);

        // 1. BAĞLANTI AÇILDIĞINDA
        eventSource.onopen = () => {
            console.log("🟢 [Sovereign Streamer] SSE Bağlantısı Kuruldu! Canlı veri akışı aktif.");
            sovereignStore.update('telemetryStatus', 'ONLINE');
            
            // Eğer Fallback veya Intent statusları bağlanıyorsa, opsiyonel tetiklemeler
            // sovereignStore.update('liveIntentSnapshot', { connectionStatus: 'live', data: null, lastUpdatedAt: null });
        };

        // 2. VERİ (EVENT) GELDİĞİNDE
        eventSource.onmessage = (event) => {
            try {
                if (event.data === ":" || event.data.trim() === "heartbeat") return;

                // Backend'den fırlatılan temiz (Parsed) veriyi yakala
                const data = JSON.parse(event.data);
                
                // Event Sözlüğümüze (Dictionary) göre Store'u güncelle
                if (data.eventType === 'commerce.revenue.updated' || data.type === 'commerce.revenue.updated') {
                    const payload = data.payload || data.data; // Dictionary uyumluluğu
                    // Cerrahi vuruş: Veri anında Store'a girer, UI otonom olarak yeşil parlar!
                    sovereignStore.update('revenueMetrics', {
                        totalRevenue: payload.totalRevenue,
                        trend: payload.trend,
                        delta: payload.delta
                    });
                }

                // İleride Mood Heatmap ve Fallback radarlarını da buraya ekleyeceğiz
                if (data.eventType === 'experience.interaction.mood_selected' || data.type === 'experience.interaction.mood_selected') {
                    // Seçilen duygu durumunu yakala
                    const payload = data.payload || data.data;
                    const selectedMood = payload.mood;
                    
                    // Store'daki mevcut veriyi al
                    const currentMoods = { ...sovereignStore.getState().moodMetrics };
                    
                    // İlgili duygunun sayacını artır
                    if (currentMoods[selectedMood] !== undefined) {
                        currentMoods[selectedMood] += 1;
                        
                        // Store'u güncelle: DOM anında tepki verecek!
                        sovereignStore.update('moodMetrics', currentMoods);
                        console.log(`🌡️ [Heat Map] Sıcaklık artıyor: ${selectedMood}`);
                    }
                }

                // [Faz 7: Midas Surge] Kuantum Çarpanı Yakalayıcısı
                if (data.eventType === 'pricing.midas.engaged' || data.type === 'pricing.midas.engaged') {
                    const payload = data.payload || data.data;
                    sovereignStore.update('activeSurge', {
                        isEngaged: true,
                        multiplier: payload.prestigeMultiplier || 1.45,
                        message: "Yüksek Talep: Prestij Sınıfı Deneyim"
                    });
                    console.log(`✨ [Midas Surge] Altın dalga yakalandı! Çarpan: x${payload.prestigeMultiplier}`);
                }

                if (data.eventType === 'alert.whale_detected' || data.type === 'alert.whale_detected') {
                    console.log(`🐋 [WHALE ALERT] ${data.payload ? data.payload.message : "Premium Update"}`);
                }

            } catch (error) {
                console.error("🚨 [Sovereign Streamer] Gelen paket parçalanamadı:", error);
            }
        };

        // 3. BAĞLANTI KOPTUĞUNDA (Otonom Direnç)
        eventSource.onerror = (error) => {
            // EventSource'un en büyük gücü: Koptuğunda kendi kendine yeniden bağlanmayı dener!
            console.warn("🔴 [Sovereign Streamer] Bağlantı koptu. Tarayıcı otonom olarak yeniden deniyor...");
            sovereignStore.update('telemetryStatus', 'OFFLINE');
        };
    };

    const disconnect = () => {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
            console.log("🔌 [Sovereign Streamer] Bağlantı manuel olarak kesildi.");
            sovereignStore.update('telemetryStatus', 'OFFLINE');
        }
    };

    return { connect, disconnect };
})();
