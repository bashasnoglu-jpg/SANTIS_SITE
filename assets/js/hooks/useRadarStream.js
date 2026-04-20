/**
 * useRadarStream.js — v3.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Consumer-only hook. Kendi başına WebSocket açmaz.
 * Tek otorite: santis-ws-manager.js (SantisWS.acquire / SantisWS.on)
 *
 * KULLANIM (feature-level — yaşam döngüsü sahipliği YOK):
 *   const { threats, degradations, streams, status } = useRadarStream();
 *
 * NOT: Socket'i kim açar?
 *   App-level owner (GodsEyeApp / CommandCenterShell):
 *     useEffect(() => {
 *       SantisWS.acquire({ role:'watcher', channels:[...] });
 *       return () => SantisWS.release();
 *     }, []);
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import SantisWS from '../core/santis-ws-manager.js';

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const MAX_EVENTS = 100;

const CHANNELS = ['THREAT_PULSE', 'DEGRADATION_WARN', 'ORBITAL_STREAM', 'SYSTEM_HEALTH'];

// ─── Mock modu (geliştirme) ───────────────────────────────────────────────────
const MOCK_POOL = {
  THREAT_PULSE:     { spoofedName: 'malware.pdf', detectedHex: '4d5a9000', action: 'QUARANTINED' },
  DEGRADATION_WARN: { engineState: 'FALLBACK_MAIN_THREAD_CANVAS', riskLevel: 'UI_JANK_EXPECTED' },
  ORBITAL_STREAM:   { fileId: 'upl_mock', percent: 0, speed: '0 MB/s' },
};
function _mockPacket() {
  const keys = Object.keys(MOCK_POOL);
  const type  = keys[Math.floor(Math.random() * keys.length)];
  const p     = { ...MOCK_POOL[type] };
  if (type === 'ORBITAL_STREAM') {
    p.percent = Math.floor(Math.random() * 100);
    p.speed   = `${(Math.random() * 5 + 1).toFixed(1)} MB/s`;
  }
  return { type, payload: p, ts: Date.now() };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useRadarStream({ mock = false } = {}) {
  const [threats,      setThreats]      = useState([]);
  const [degradations, setDegradations] = useState([]);
  const [streams,      setStreams]       = useState({});

  // Bağlantı durumunu manager'dan türet
  const [status, setStatus] = useState(() => SantisWS.state);

  const mountedRef = useRef(false);

  // ── Yardımcı: state güvenli setter ────────────────────────────────────────
  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  // ── Gelen paketi ilgili state'e dağıt ────────────────────────────────────
  const dispatch = useCallback((envelope) => {
    const { type, payload } = envelope;

    switch (type) {
      case 'THREAT_PULSE':
        safeSet(() => setThreats(prev => [{ ...payload, id: envelope.ts }, ...prev].slice(0, MAX_EVENTS)));
        break;
      case 'DEGRADATION_WARN':
        safeSet(() => setDegradations(prev => [{ ...payload, id: envelope.ts }, ...prev].slice(0, MAX_EVENTS)));
        break;
      case 'ORBITAL_STREAM':
        safeSet(() => setStreams(prev => ({
          ...prev,
          [payload?.fileId]: { ...payload, ts: envelope.ts },
        })));
        break;
      default:
        break;
    }
  }, [safeSet]);

  // ── Mock modu ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mock) return;
    setStatus('mock');
    const timer = setInterval(() => dispatch(_mockPacket()), 1500);
    return () => clearInterval(timer);
  }, [mock, dispatch]);

  // ── Live modu ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mock) return;

    mountedRef.current = true;

    // Bu hook bir consumer — socket YAŞAMINı kontrol ETMEZ.
    // Kanalları talep et (manager diff eder, gerekmiyorsa tekrar açmaz).
    SantisWS.acquire({ channels: CHANNELS });

    // Durum sinyallerini dinle
    const offConn = SantisWS.on('CONNECTED',    () => safeSet(() => setStatus('live')));
    const offDisc = SantisWS.on('DISCONNECTED', () => safeSet(() => setStatus('reconnecting')));
    const offErr  = SantisWS.on('ERROR',        () => safeSet(() => setStatus('error')));
    const offDead = SantisWS.on('DEAD',         () => safeSet(() => setStatus('closed')));

    // Sync ile ilk durum
    safeSet(() => setStatus(
      SantisWS.state === 'OPEN' ? 'live' : 'connecting'
    ));

    // Veri olaylarını dinle
    const offThreat = SantisWS.on('THREAT_PULSE',     dispatch);
    const offDegrad = SantisWS.on('DEGRADATION_WARN', dispatch);
    const offStream = SantisWS.on('ORBITAL_STREAM',   dispatch);

    return () => {
      mountedRef.current = false;
      // Sadece listener temizliği — socket'i KAPATMA
      offConn(); offDisc(); offErr(); offDead();
      offThreat(); offDegrad(); offStream();
      // Kanal rezervasyonunu bırak
      SantisWS.release();
    };
  }, [mock, dispatch, safeSet]);

  return {
    threats,
    degradations,
    streams:    Object.values(streams),
    status,
    // Kolaylık: debug snapshot
    wsDebug: typeof window !== 'undefined' ? window.__SANTIS_WS_DEBUG__ : null,
  };
}
