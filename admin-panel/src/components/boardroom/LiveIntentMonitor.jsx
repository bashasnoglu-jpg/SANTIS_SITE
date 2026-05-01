import React, { useState, useEffect } from 'react';
import { SovereignButton } from "@santis/ui";

export default function LiveIntentMonitor() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3030/api/v1/stream/events');

    eventSource.onmessage = (event) => {
      try {
        const incomingData = JSON.parse(event.data);
        
        // EĞER GELEN FISILTI "TESLİMAT BAŞARILI" SİNYALİYSE:
        if (incomingData.eventType === 'communication.whatsapp.delivered') {
          setEvents(prevEvents => prevEvents.map(evt => 
            // Aynı Trace ID'ye sahip orijinal "Niyet Onaylandı" satırını bul ve Mühürle!
            evt.traceId === incomingData.traceId 
              ? { ...evt, deliveryStatus: 'SECURED' } 
              : evt
          ));
          console.log('[SOVEREIGN KALKANI] Zümrüt Işıması Tetiklendi: Teslimat Başarılı.');
        } 
        // DİĞER STANDART FISILTILAR (Örn: Niyet Onayı)
        else {
          setEvents(prevEvents => [incomingData, ...prevEvents]);
        }
      } catch (error) {
        console.error('[SOVEREIGN KALKANI] Fısıltı deşifre edilemedi:', error);
      }
    };

    return () => eventSource.close();
  }, []);

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
