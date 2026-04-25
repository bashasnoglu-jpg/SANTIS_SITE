import { useState, useEffect, useCallback } from 'react';

/**
 * useGodModeStream
 * GodMode Dashboard için "Akaşik Kayıtları" (REST) çekip 
 * üzerine "Canlı Nöral Akışı" (SSE) bağlayan hibrit hook.
 */
export function useGodModeStream(limit = 50) {
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Akaşik Kayıtları (History) Çek
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3030/api/v1/read/history?limit=${limit}`);
      if (!res.ok) throw new Error('Akaşik kayıtlar okunamadı');
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        // En yeni olayın en üstte olması için ters çevir
        setEvents(data.data.reverse());
      }
      setIsHistoryLoaded(true);
    } catch (err) {
      console.error('[GodMode] History fetch error:', err);
      setError(err);
      setIsHistoryLoaded(true); // Hata olsa da loading bitsin
    }
  }, [limit]);

  // Canlı Nöral Akışa (SSE) Bağlan
  useEffect(() => {
    let sse = null;
    let reconnectTimeout = null;

    const connectSSE = () => {
      sse = new EventSource('http://localhost:3030/api/v1/streams/god');

      sse.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      sse.onmessage = (message) => {
        try {
          // Heartbeat sinyallerini (:) yoksay
          if (message.data === '') return;

          const data = JSON.parse(message.data);

          // System Status olayları (ONLINE) ayrı ele alınabilir
          if (data.eventType === 'system.status') {
             return;
          }

          // Yeni gelen gerçek event'i listenin EN BAŞINA (prepend) ekle
          setEvents((prevEvents) => {
            const newArray = [data, ...prevEvents];
            return newArray.slice(0, limit); // Sınırı koru
          });
        } catch (err) {
          // Parse hatası (genelde heartbeat kaynaklı) yoksay
        }
      };

      sse.onerror = (err) => {
        setIsConnected(false);
        sse.close();
        // Otonom Yeniden Bağlanma (Auto-Healing)
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    // Önce tarihi çek, sonra akışa bağlan
    fetchHistory().then(() => {
      connectSSE();
    });

    return () => {
      if (sse) sse.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [fetchHistory, limit]);

  return { events, isConnected, isHistoryLoaded, error };
}
