import React, { useState, useEffect } from 'react';
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

    const streamUrl = import.meta.env.VITE_STREAM_URL || '/api/v1/stream/advisor';

    const connectSSE = () => {
      if (retryCount >= maxRetries) {
        console.warn('[SOVEREIGN KALKANI] SSE Realtime stream unavailable. Falling back to offline mode.');
        return;
      }
      
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        retryCount = 0; // reset on success
      };

      eventSource.addEventListener('advisor_evaluated', (event) => {
        try {
          const incomingData = JSON.parse(event.data);
          
          if (!incomingData || !incomingData.traceId || !incomingData.payload?.intentDetected) {
            return;
          }

          if (mode === 'HISTORICAL') {
            eventBuffer.current = [incomingData, ...eventBuffer.current].slice(0, 50);
            return;
          }

          setEvents(prevEvents => [incomingData, ...prevEvents].slice(0, 100));
        } catch (error) {
          console.error('[SOVEREIGN KALKANI] Fısıltı deşifre edilemedi:', error);
        }
      });

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

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-sovereign-obsidian border border-sovereign-panel rounded-sm p-8 flex flex-col transition-colors mb-6 font-sans">
      <div className="flex items-center gap-3 mb-6 border-b border-sovereign-panel pb-4">
        <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">
          Live Intent Monitor
        </h3>
      </div>
      
      <div className="space-y-4">
        {events.map((evt, index) => {
          return (
            <div 
              key={`${evt.traceId}-${index}`} 
              className="p-6 rounded-md border border-sovereign-line bg-sovereign-dark flex justify-between items-center transition-all hover:border-sovereign-gold/50"
            >
              <div className="flex flex-col gap-2">
                <span className="text-sovereign-muted text-2xs tracking-widest uppercase font-medium">
                  Trace ID: {evt.traceId} • {new Date(evt.occurredAt || Date.now()).toLocaleTimeString()}
                </span>
                <span className="text-lg font-serif tracking-wide text-sovereign-ink">
                  {evt.payload.intentDetected}
                </span>
                <span className="text-xs text-sovereign-bronze font-mono mt-1">
                  Mode: {evt.payload.recommendedMode || 'unknown'} | Confidence: {evt.payload.confidence}
                </span>
              </div>

              {/* Statü ve Rozet Alanı */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-sovereign-gold text-sm font-mono tracking-widest">EVALUATED</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
