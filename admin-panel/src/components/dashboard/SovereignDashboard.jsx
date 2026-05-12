import React, { useState, useEffect } from 'react';
import GhostDrawer from './GhostDrawer';

export default function SovereignDashboard() {
  const [anomalies, setAnomalies] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [latestRisk, setLatestRisk] = useState(0);
  const [hasUnreadPulse, setHasUnreadPulse] = useState(false);

  // 1. STATE İZOLASYONU (Cold Boot): Sayfa açıldığında Ring Buffer'ı çek
  useEffect(() => {
    fetch('http://localhost:4040/api/v1/telemetry/recent')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.length > 0) {
          setAnomalies(json.data);
          const lastRisk = parseFloat(json.data[json.data.length - 1].riskDelta);
          setLatestRisk(isNaN(lastRisk) ? 0 : lastRisk);
        }
      })
      .catch(err => console.error("Sovereign Kalkanı: Geçmiş veriler alınamadı", err));
  }, []);

  // 2. CANLI AKIŞ: WebSocket Entegrasyonu (Exponential Backoff + Jitter)
  useEffect(() => {
    let ws;
    let reconnectTimeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_DELAY = 30000;

    const connectWebSocket = () => {
      const token = window.SANTIS_WS_TOKEN || localStorage.getItem("SANTIS_WS_TOKEN") || "santis-dev-token";
      ws = new WebSocket(`ws://localhost:8080/ws?token=${encodeURIComponent(token)}`);

      ws.onopen = () => {
        console.log("Sovereign Kalkanı: Nöral Köprü Aktif.");
        reconnectAttempts = 0; // Bağlantı başarılı, sayacı sıfırla
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'EVENT' && payload.payload?.action === 'STATUS_UPDATE') {
            const newAnomaly = payload.payload.data;
            
            setAnomalies(prev => {
              const updated = [...prev, newAnomaly];
              return updated.length > 50 ? updated.slice(updated.length - 50) : updated;
            });
            
            const newRisk = parseFloat(newAnomaly.riskDelta);
            if (!isNaN(newRisk)) {
              setLatestRisk(newRisk);
              if (!isDrawerOpen && newRisk > 0.5) {
                setHasUnreadPulse(true);
              }
            }
          }
        } catch (err) {
          console.error("Sovereign WS parse error", err);
        }
      };

      ws.onclose = () => {
        // Exponential Backoff (Üstel Geri Çekilme): 1s, 2s, 4s, 8s...
        const baseDelay = Math.min(1000 * (2 ** reconnectAttempts), MAX_RECONNECT_DELAY);
        
        // Jitter (Sapma): 0 ile 500ms arası rastgele bir gecikme ekle
        const jitter = Math.random() * 500; 
        const totalDelay = baseDelay + jitter;

        console.warn(`Sinyal zayıf. ${Math.round(totalDelay/1000)} saniye içinde otonom onarım deneniyor...`);

        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          connectWebSocket(); // Kendi kendini çağırarak yeniden bağlanmayı dene
        }, totalDelay);
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [isDrawerOpen]);

  // 3. CINEMATIC RITUAL: Risk > 0.5 ise tüm ekran derinleşir
  useEffect(() => {
    if (latestRisk > 0.5) {
      document.body.classList.add('cinematic-ritual');
    } else {
      document.body.classList.remove('cinematic-ritual');
    }
    
    // Component unmount olduğunda class'ı temizle
    return () => document.body.classList.remove('cinematic-ritual');
  }, [latestRisk]);

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
    setHasUnreadPulse(false); // Kullanıcı paneli kendi isteğiyle açtığında nabız durur
  };

  return (
    <div style={{ padding: '3rem 4rem', minHeight: '100vh', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 300, letterSpacing: '0.15em', margin: 0, textTransform: 'uppercase' }}>
            Sovereign <span style={{ color: 'var(--nv-brushed-gold)' }}>Dashboard</span>
          </h1>
          <p style={{ color: 'var(--nv-text-muted)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.5rem' }}>
            Otonom Nöral Köprü Aktif
          </p>
        </div>
        
        {/* Kullanıcı Egemenliği: Nabız (Pulse) İkonu */}
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center' }}>
          {hasUnreadPulse ? (
            <div 
              className="pulse-icon" 
              onClick={handleOpenDrawer}
              title="Yeni Hayalet Operasyon Saptandı" 
            />
          ) : (
            <div 
              style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--nv-text-muted)', cursor: 'pointer', transition: 'background-color 0.3s' }} 
              onClick={handleOpenDrawer}
              title="Operasyon Paneli" 
            />
          )}
        </div>
      </header>

      <main style={{ marginTop: '10rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', fontWeight: 100, letterSpacing: '0.15em', transition: 'color 1.2s ease', color: latestRisk > 0.5 ? 'var(--nv-text-light)' : 'var(--nv-text-muted)' }}>
          {latestRisk > 0.5 ? 'MÜDAHALE EDİLİYOR' : 'SİSTEM OPTİMAL'}
        </div>
      </main>

      <GhostDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        anomalies={anomalies} 
      />
    </div>
  );
}
