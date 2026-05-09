import React, { useEffect, useState, useRef } from 'react';

const LiveFeedTicker = () => {
  const [logs, setLogs] = useState([]);
  const audioCtx = useRef(null);

  // Biyometrik Ping Sesi (Web Audio API)
  const playPing = (isCritical) => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isCritical ? 880 : 440, audioCtx.current.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.current.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.current.destination);

    osc.start();
    osc.stop(audioCtx.current.currentTime + 0.5);
  };

  useEffect(() => {
    // 4040 Gateway portumuzdan dinliyoruz
    const ws = new WebSocket('ws://localhost:4040');

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'AUTH', role: 'GODS_EYE', payload: { apiKey: 'SOVEREIGN_ADMIN_KEY_19X' } }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'TELEMETRY_EMIT' || data.type === 'PULSE') {
            const telemetry = data.payload?.data || data;
            const stress = parseInt(telemetry.stressLevel || 0);
            const isCritical = stress > 80;

            const newLog = {
                id: Date.now(),
                text: `[SECURED] VOKAL ANALİZ: %${stress} STRES | UPLINK: KIOSK_01 | TSTAMP: ${telemetry.timestamp || new Date().toISOString()}`,
                isCritical
            };

            setLogs((prev) => [newLog, ...prev].slice(0, 10)); // Son 10 logu tut
            playPing(isCritical);
        }
      } catch(e) {}
    };

    return () => ws.close();
  }, []);

  return (
    <>
    <div className="bg-black border-t border-sbr-gold/30 p-4 font-mono text-micro h-48 overflow-hidden relative">
      <div className="absolute top-0 left-4 bg-black px-2 -translate-y-1/2 text-sbr-gold tracking-widest border border-sbr-gold/30 z-10">
        LIVE_TELEMETRY_STREAM
      </div>
      
      <div className="space-y-1 mt-2 relative z-0">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={`flex items-center space-x-2 animate-in fade-in slide-in-from-left-2 duration-500 ${
              log.isCritical ? 'text-sbr-danger' : 'text-sbr-gold opacity-70'
            }`}
          >
            <span className="opacity-50">[{new Date(log.id).toLocaleTimeString()}]</span>
            <span className="truncate">{log.text}</span>
            {log.isCritical && <span className="animate-pulse">⚠ CRITICAL_ANOMALY</span>}
          </div>
        ))}
      </div>

      {/* Tarama Efekti (CRT Scanline) */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-sbr-gold/5 to-transparent opacity-20 h-full w-full animate-scanline z-20"></div>
    </div>
    </>
  );
};

export default LiveFeedTicker;
