import React, { useState, useEffect } from 'react';
import { useBoardroomMode } from "../../features/boardroom/context/BoardroomModeContext";

function ReceptionLiveToday() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const params = new URLSearchParams({ locationName: 'budva', environment: 'Live' });

    fetch(`/api/v1/reception/bookings/today?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    })
      .then((response) => response.json())
      .then((payload) => {
        setData(payload);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  const bookings = data?.bookings || [];

  return (
    <section className="bg-sovereign-obsidian border border-sovereign-panel rounded-sm p-6 mb-6 font-sans">
      <div className="flex items-center justify-between border-b border-sovereign-panel pb-4 mb-4">
        <div>
          <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Reception Live Today</h3>
          <p className="text-sovereign-bronze text-xs mt-1">{status === 'ready' ? `${data?.location} · ${data?.date}` : 'Reading live bookings'}</p>
        </div>
        <span className="text-sovereign-accent font-serif text-2xl">{status === 'ready' ? data?.count || 0 : '—'}</span>
      </div>

      {status === 'loading' && <p className="text-sovereign-bronze text-sm">Live bookings are loading…</p>}
      {status === 'error' && <p className="text-red-100 text-sm">Reception data could not be loaded.</p>}
      {status === 'ready' && bookings.length === 0 && (
        <p className="text-sovereign-ink text-sm">Bugün bu şube için canlı rezervasyon bulunmuyor.</p>
      )}
      {status === 'ready' && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="border border-sovereign-panel bg-sovereign-coal/30 rounded-sm p-4">
              <div className="text-sovereign-ink text-sm">{booking.timeDisplay || booking.startDateTime}</div>
              <div className="text-sovereign-bronze text-xs mt-2">
                {booking.clientName || '—'} · {booking.serviceName || '—'} · {booking.therapistName || '—'}
              </div>
              <div className="text-sovereign-bronze text-xs mt-1">
                {booking.paymentStatus || 'Payment Unknown'} · Due €{booking.balanceDueEur || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

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
            if (!incomingData.occurredAt) incomingData.occurredAt = Date.now();
            eventBuffer.current = [incomingData, ...eventBuffer.current].slice(0, 50);
            return;
          }

          if (!incomingData.occurredAt) incomingData.occurredAt = Date.now();
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

  return (
    <>
      <ReceptionLiveToday />
      {events.length > 0 && (
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
                      Trace ID: {evt.traceId} • {new Date(evt.occurredAt).toLocaleTimeString()}
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
      )}
    </>
  );
}
