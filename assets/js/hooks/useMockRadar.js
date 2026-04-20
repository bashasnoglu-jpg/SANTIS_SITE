// hooks/useMockRadar.js
import { useState, useEffect } from 'react';

export function useMockRadar() {
  const [threats, setThreats] = useState([]);
  const [degradations, setDegradations] = useState([]);
  const [streams, setStreams] = useState({}); // fileId ile objede tutuyoruz

  useEffect(() => {
    // 1. Orbital Stream Simülasyonu (Sürekli akan veri)
    const streamInterval = setInterval(() => {
      setStreams(prev => {
        const currentPercent = prev['upl_99xyz']?.percent || 0;
        if (currentPercent >= 100) return prev; // Bitti
        
        const nextPercent = Math.min(currentPercent + Math.floor(Math.random() * 8) + 1, 100);
        return {
          ...prev,
          'upl_99xyz': { fileId: 'upl_99xyz', percent: nextPercent, speed: `${(Math.random() * 5 + 1).toFixed(1)} MB/s`, visitorId: 'V19-Z' }
        };
      });
    }, 400);

    // 2. Rastgele Threat Pulse Simülasyonu
    const threatInterval = setInterval(() => {
      if (Math.random() > 0.7) { // %30 ihtimalle tehdit
        setThreats(prev => [{
          id: Date.now(),
          client: { visitorId: `V19-${Math.floor(Math.random() * 100)}`, ip: "192.168.x.x" },
          payload: { spoofedName: "rezervasyon-belgesi.pdf", detectedHex: "4d5a9000", action: "QUARANTINED" }
        }, ...prev].slice(0, 5)); // Son 5 logu tut
      }
    }, 3000);

    // 3. Rastgele Degradation Simülasyonu
    const degInterval = setInterval(() => {
      if (Math.random() > 0.8) { // %20 ihtimalle zayıflama
        setDegradations(prev => [{
          id: Date.now(),
          client: { visitorId: `V19-${Math.floor(Math.random() * 100)}`, userAgent: "Instagram WebView / iOS 15" },
          payload: { engineState: "FALLBACK_MAIN_THREAD_CANVAS" }
        }, ...prev].slice(0, 5));
      }
    }, 4500);

    return () => {
      clearInterval(streamInterval);
      clearInterval(threatInterval);
      clearInterval(degInterval);
    };
  }, []);

  return { threats, degradations, streams: Object.values(streams) };
}
