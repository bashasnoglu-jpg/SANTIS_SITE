import { sovereignStore } from '../state/sovereignStore.js';

/**
 * Görev: Kanonik Projection'ı (Read Model) dinler. Asla ham event taşımaz.
 * Akış: SSE -> Normalize -> Store
 */
export const IntentSseClient = (() => {
    let eventSource = null;

    const connect = (sessionId) => {
        if (eventSource) {
            console.warn("Zaten bir SSE bağlantısı var. Yeni bağlantı açılmadı.");
            return;
        }

        const ENDPOINT = `/api/v1/streams/intent/${sessionId}`;
        
        // 1. Devlet: Bağlanıyor
        sovereignStore.update('liveIntentSnapshot', {
            connectionStatus: 'connecting',
            data: sovereignStore.getState('liveIntentSnapshot').data,
            lastUpdatedAt: null
        });

        eventSource = new EventSource(ENDPOINT);

        eventSource.onopen = () => {
            sovereignStore.update('liveIntentSnapshot', {
                connectionStatus: 'live',
                data: sovereignStore.getState('liveIntentSnapshot').data,
                lastUpdatedAt: null
            });
        };

        // Kanonik Veri Akışı
        eventSource.onmessage = (event) => {
            try {
                // Heartbeat/Empty logic
                if (event.data === ":") return;
                
                const payload = JSON.parse(event.data);

                // ZERO-TRUST KONTROL: Sadece resmi Snapshot Payload'larını Store'a Al
                if (payload.type === "intent.snapshot.updated" || payload.type === "intent.snapshot.initial") {
                    
                    // NORMALIZATION: Dış formatı (API spec) UI'ın beklediği iç formata (Store spec) dönüştür
                    const normalizedData = {
                        moodAffinity: payload.data.moodAffinity || [],
                        traceId: payload.traceId || null
                    };

                    sovereignStore.update('liveIntentSnapshot', {
                        connectionStatus: 'live',
                        data: normalizedData,
                        lastUpdatedAt: payload.data.updatedAt || new Date().toISOString()
                    });
                }
                else if (payload.type === "intent.snapshot.empty") {
                     sovereignStore.update('liveIntentSnapshot', {
                        connectionStatus: 'live',
                        data: null, // Veri yok materyalize edilmemiş
                        lastUpdatedAt: null
                    });
                }
            } catch (error) {
                console.error("SSE Parse Error:", error);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE Connection Degraded", err);
            sovereignStore.update('liveIntentSnapshot', {
                connectionStatus: 'disconnected',
                data: sovereignStore.getState('liveIntentSnapshot').data,
                lastUpdatedAt: null
            });
            eventSource.close();
            eventSource = null;
            
            // Opsiyonel Auto-Reconnect mekanizması (Exponential Backoff) eklenebilir.
        };
    };

    const disconnect = () => {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
            sovereignStore.update('liveIntentSnapshot', {
                connectionStatus: 'disconnected',
                data: null,
                lastUpdatedAt: null
            });
        }
    };

    return { connect, disconnect };
})();
