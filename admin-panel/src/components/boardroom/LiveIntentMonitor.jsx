import React, { useState, useEffect } from 'react';
import { SovereignButton } from "@santis/ui";
import { useBoardroomMode } from "../../features/boardroom/context/BoardroomModeContext";

export default function LiveIntentMonitor() {
  const { mode } = useBoardroomMode();
  const [events, setEvents] = useState([]);
  const eventBuffer = React.useRef([]);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let eventSource;
    let reconnectTimeout;

    const streamUrl = import.meta.env.VITE_STREAM_URL || 'http://localhost:3030/api/v1/stream/events';

    const connectSSE = () => {
      if (retryCount >= maxRetries) {
        console.warn('[SOVEREIGN KALKANI] SSE Realtime stream unavailable. Falling back to offline mode.');
        return;
      }
      
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        retryCount = 0; // reset on success
      };

      eventSource.onmessage = (event) => {
        try {
          const incomingData = JSON.parse(event.data);
          
          // BİLİŞSEL VE KONTROL FİLTRESİ: Heartbeat, bağlantı mesajları ve boş telemetry verilerini engelle
          if (
            !incomingData ||
            incomingData.type === 'HEARTBEAT' ||
            incomingData.type === 'CONNECTED' ||
            (!incomingData.traceId && !incomingData.eventType && !incomingData.payload?.intent)
          ) {
            return;
          }

          // TEMPORAL ISOLATION: Eğer geçmişteyse, event'leri sadece bellekte tut (buffer)
          if (mode === 'HISTORICAL') {
            eventBuffer.current = [incomingData, ...eventBuffer.current].slice(0, 50);
            return;
          }

          // EĞER GELEN FISILTI "TESLİMAT BAŞARILI" SİNYALİYSE:
          if (incomingData.eventType === 'communication.whatsapp.delivered') {
            setEvents(prevEvents => prevEvents.map(evt => 
              evt.traceId === incomingData.traceId 
                ? { ...evt, deliveryStatus: 'SECURED' } 
                : evt
            ));
          } 
          else {
            setEvents(prevEvents => [incomingData, ...prevEvents].slice(0, 100));
          }
        } catch (error) {
          console.error('[SOVEREIGN KALKANI] Fısıltı deşifre edilemedi:', error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        retryCount++;
        if (retryCount <= maxRetries) {
          console.warn(`[SOVEREIGN KALKANI] SSE bağlantısı koptu (Deneme ${retryCount}/${maxRetries})`);
          reconnectTimeout = setTimeout(connectSSE, 3000 * retryCount);
        }
      };
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [mode]);

  useEffect(() => {
    if (mode === 'LIVE' && eventBuffer.current.length > 0) {
      setEvents(prev => [...eventBuffer.current, ...prev].slice(0, 100));
      eventBuffer.current = [];
    }
  }, [mode]);

  return (
    <div className="min-h-screen bg-sovereign-black p-10 font-sans">
      <h2 className="text-sovereign-gold font-serif text-2xl mb-8 font-light tracking-widest uppercase">
        Sovereign GodMode Radarı
      </h2>
      
      <div className="space-y-4">
        {events.map((evt, index) => {
          // Zümrüt Yeşili Durum Kontrolü
          const isSecured = evt.deliveryStatus === 'SECURED';
          
          return (
            <div 
              key={`${evt.traceId}-${index}`} 
              className={`p-6 rounded-md border transition-all duration-1000 ease-in-out flex justify-between items-center ${
                isSecured 
                  ? 'bg-sovereign-success/5 border-sovereign-success' // Zümrüt Aurası
                  : 'bg-sovereign-dark border-sovereign-line hover:border-sovereign-gold/50' // Standart Vanta/Mat Pirinç
              }`}
            >
              <div className="flex flex-col gap-2">
                <span className="text-sovereign-muted text-2xs tracking-widest uppercase font-medium">
                  Trace ID: {evt.traceId}
                </span>
                <span className={`text-lg font-serif tracking-wide ${isSecured ? 'text-sovereign-success' : 'text-sovereign-ink'}`}>
                  {evt.payload?.intent || evt.eventType}
                </span>
              </div>

              {/* Statü ve Rozet Alanı */}
              <div className="flex items-center gap-6">
                {isSecured ? (
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-sovereign-success" />
                    <span className="text-sovereign-success font-mono text-xs tracking-widest">CONVERSION SECURED</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-sovereign-gold text-sm font-mono tracking-widest">PENDING CONVERSION</span>
                    <span className="text-sovereign-muted text-2xs tracking-widest uppercase">Bekleniyor...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
