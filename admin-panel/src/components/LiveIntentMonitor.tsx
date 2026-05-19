import React, { useEffect, useState, useMemo } from 'react';
import { useSovereignWebSocket } from '../hooks/useSovereignWebSocket';
import type { SovereignEventRecord } from '@santis/event-dictionary';
import { SignalBadge } from './SignalBadge';
import { SignalType } from '../lib/signal-token-map';

export function LiveIntentMonitor() {
  const { status, latestMessage } = useSovereignWebSocket();
  const [eventMap, setEventMap] = useState<Map<string, SovereignEventRecord>>(new Map());
  const [visible, setVisible] = useState(true);

  // Global Klavye Kısayolu (Toggle: 'm')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm') setVisible(v => !v);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!latestMessage) {
      return;
    }

    setEventMap((prevMap) => {
      const newMap = new Map(prevMap); // Immutable update
      
      if (latestMessage.type === 'EVENT_REPLAY') {
        // Geçmişi yükle (Deduplication id ile otomatik çözülür)
        latestMessage.payload.forEach((event) => {
          newMap.set(event.id, event as unknown as SovereignEventRecord);
        });
      } else if (latestMessage.type === 'EVENT_STREAM') {
        // Canlı akışı ekle (Varsa günceller, yoksa ekler = Dup yok)
        newMap.set(latestMessage.payload.id, latestMessage.payload as unknown as SovereignEventRecord);
      }
      
      // Hafıza yönetimi: Çok şişmesin diye limit
      if (newMap.size > 50) {
        const keysToDelete = Array.from(newMap.keys()).slice(0, newMap.size - 50);
        keysToDelete.forEach(k => newMap.delete(k));
      }
      
      return newMap;
    });
  }, [latestMessage]);

  // 4. ORDERING: Zamanda kayma olmaması için DB "createdAt" bazında azalan (yeni en üstte) sıralama
  const intents = useMemo(() => {
    return Array.from(eventMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10); // UI'da en güncel 10 olayı göster
  }, [eventMap]);

  // Health State UI
  const healthConfig = {
    OPEN: { color: 'bg-sovereign-success animate-pulse', label: 'NEURAL BRIDGE ONLINE' },
    CONNECTING: { color: 'bg-sovereign-warning animate-pulse', label: 'ESTABLISHING LINK...' },
    CLOSED: { color: 'bg-sovereign-neutral-600', label: 'BRIDGE SUSPENDED' },
    ERROR: { color: 'bg-sovereign-danger animate-pulse', label: 'CONNECTION DEAD' },
  };

  const currentHealth = healthConfig[status] || healthConfig.CLOSED;

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none flex flex-col items-end">
      <div className="p-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-full max-w-sm pointer-events-auto">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <h2 className="text-micro font-semibold tracking-[0.25em] text-sovereign-gold uppercase">Live Intent Monitor</h2>
          <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full border border-white/5">
            <span className={`w-2 h-2 rounded-full ${currentHealth.color}`} />
            <span className="text-2xs font-mono tracking-widest text-sovereign-neutral-300">{currentHealth.label}</span>
          </div>
        </div>

        <div className="space-y-2 min-h-40 relative">
          {intents.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-2xs font-mono text-sovereign-neutral-600 opacity-50 tracking-widest">
              [ WAITING FOR NEURAL BRIDGE ]
            </div>
          ) : (
            intents.map((intent, i) => (
              <div 
                key={intent.id} 
                className="flex flex-col p-3 bg-white/5 border border-white/5 rounded-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
                style={{ animation: 'fadeIn 0.4s ease-out forwards' }}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-mono text-sovereign-neutral-400 bg-white/5 px-1.5 py-0.5 rounded">{intent.type}</span>
                    {intent.payload?.signalType && (
                      <SignalBadge type={intent.payload.signalType as SignalType} />
                    )}
                  </div>
                  <span className="text-2xs font-mono text-sovereign-neutral-500">
                    {new Date(intent.createdAt).toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                  </span>
                </div>
                <span className="text-sm font-medium text-sovereign-gold-deep tracking-wide">{intent.payload.intent || intent.subject}</span>
                <span className="text-2xs font-mono text-sovereign-neutral-600 mt-1 truncate">ID: {intent.id}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="mt-2 text-2xs font-mono text-sovereign-neutral-600 tracking-widest pointer-events-auto">PRESS 'M' TO TOGGLE HUD</div>
    </div>
  );
}
