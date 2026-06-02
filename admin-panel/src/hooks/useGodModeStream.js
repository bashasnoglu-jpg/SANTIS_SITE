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
      const apiUrl = import.meta.env.VITE_INGESTION_API_BASE_URL || import.meta.env.VITE_CORE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/v1/read/history?limit=${limit}`);
      if (!res.ok) throw new Error('Akaşik kayıtlar okunamadı');
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        // En yeni olayın en üstte olması için ters çevir
        setEvents(data.data.reverse());
      }
      setIsHistoryLoaded(true);
    } catch (_err) {
      console.error('[GodMode] History fetch error:', _err);
      setError(_err);
      setIsHistoryLoaded(true);
    }
  }, [limit]);


  // Canlı Nöral Akışa (SSE) Bağlan
  useEffect(() => {
    let sse = null;
    let reconnectTimeout = null;
    let retryCount = 0;
    const maxRetries = 3;

    const connectSSE = () => {
      const streamUrl = import.meta.env.VITE_STREAM_URL || (import.meta.env.VITE_CORE_API_URL ? `${import.meta.env.VITE_CORE_API_URL}/api/v1/streams/god` : '/api/v1/streams/god');
      sse = new EventSource(streamUrl);

      sse.onopen = () => {
        setIsConnected(true);
        setError(null);
        retryCount = 0;
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
        } catch {
          // Parse hatası (genelde heartbeat kaynaklı) yoksay
        }
      };

      // eslint-disable-next-line no-unused-vars
      sse.onerror = () => {
        setIsConnected(false);
        sse.close();
        retryCount++;
        if (retryCount <= maxRetries) {
          console.warn(`[GodMode] SSE stream error, retrying (${retryCount}/${maxRetries})...`);
          reconnectTimeout = setTimeout(connectSSE, 3000 * retryCount);
        } else {
          console.warn(`[GodMode] SSE stream permanently failed after ${maxRetries} attempts.`);
        }
      };
    };

    // Önce tarihi çek, sonra akışa bağlan
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchHistory().then(() => {
      connectSSE();
    });


    return () => {
      if (sse) sse.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [fetchHistory, limit]);

  return { events, isConnected, isHistoryLoaded, error };
}
