/**
 * ═══════════════════════════════════════════════════════════════
 * SANTIS SOVEREIGN OS — useLiveRadar Hook 🦅
 * ═══════════════════════════════════════════════════════════════
 *
 * @version V1.0_SOVEREIGN_LIVE
 * @description  useMockRadar'ın birebir drop-in yedeği.
 *               Aynı state shape'ini (threats, degradations, streams)
 *               döndürür — GodsEyeDashboard.jsx sıfır değişiklikle çalışır.
 *
 * State anatomy (useMockRadar ile birebir uyumlu):
 *   threats[]     → { id, client: { visitorId, ip }, payload: { spoofedName, detectedHex, action } }
 *   degradations[]→ { id, client: { visitorId, userAgent }, payload: { engineState } }
 *   streams[]     → { fileId, percent, speed, visitorId }
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Konfigürasyon ──────────────────────────────────────────────────────────────
const WS_GATEWAY   = 'ws://localhost:8080';
const WS_TOKEN     = 'SANTIS-CORE-TX99';
const WS_ROLE      = 'watcher';
const MAX_THREATS  = 5;   // useMockRadar ile aynı limit
const MAX_DEGS     = 5;   // useMockRadar ile aynı limit
const RECONNECT_MS = 3000; // Bağlantı koptuğunda kaç ms sonra yeniden dene

export function useLiveRadar() {
    // ── State (useMockRadar ile bire bir eşleşen shape) ────────────────────────
    const [threats,      setThreats]      = useState([]);
    const [degradations, setDegradations] = useState([]);
    const [streams,      setStreams]       = useState({}); // fileId → obje (mock ile aynı)

    // ── Bağlantı durumu (dashboard header'da kullanılabilir) ───────────────────
    const [connectionStatus, setConnectionStatus] = useState('OFFLINE'); // 'OFFLINE' | 'CONNECTING' | 'ONLINE' | 'RECONNECTING'

    // Ref'ler: closure'ların eskimiş state tutmasını önler
    const wsRef            = useRef(null);
    const reconnectTimerRef = useRef(null);
    const mountedRef       = useRef(true);

    // ── Paket işleyicileri (handler'lar) ──────────────────────────────────────

    /**
     * THREAT_PULSE → threats[]
     * Gateway'den gelen raw packet'ı useMockRadar'ın ürettiği
     * shape'e normalize eder.
     */
    const handleThreatPulse = useCallback((packet) => {
        const normalized = {
            id:      packet.timestamp || Date.now(),
            client:  packet.client   || { visitorId: 'UNKNOWN', ip: '0.0.0.0' },
            payload: packet.payload  || { spoofedName: '?', detectedHex: '?', action: 'QUARANTINED' }
        };
        setThreats(prev => [normalized, ...prev].slice(0, MAX_THREATS));
    }, []);

    /**
     * DEGRADATION_WARN → degradations[]
     */
    const handleDegradationWarn = useCallback((packet) => {
        const normalized = {
            id:      packet.timestamp || Date.now(),
            client:  packet.client   || { visitorId: 'UNKNOWN', userAgent: 'Unknown Agent' },
            payload: packet.payload  || { engineState: 'FALLBACK_UNKNOWN' }
        };
        setDegradations(prev => [normalized, ...prev].slice(0, MAX_DEGS));
    }, []);

    /**
     * ORBITAL_STREAM → streams{}  (fileId anahtarıyla)
     * useMockRadar setStreams ile aynı mantık: obje içinde tutup
     * dışarıya Object.values() ile dizi olarak veriyoruz.
     */
    const handleOrbitalStream = useCallback((packet) => {
        const p = packet.payload || {};
        if (!p.fileId) return;

        setStreams(prev => ({
            ...prev,
            [p.fileId]: {
                fileId:    p.fileId,
                percent:   p.percent  ?? prev[p.fileId]?.percent ?? 0,
                speed:     p.speed    || '–',
                visitorId: packet.client?.visitorId || 'ANON'
            }
        }));
    }, []);

    // ── WebSocket bağlantı döngüsü ─────────────────────────────────────────────
    const connect = useCallback(() => {
        if (!mountedRef.current) return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

        setConnectionStatus('CONNECTING');

        const url = `${WS_GATEWAY}/?role=${WS_ROLE}&token=${WS_TOKEN}`;
        const ws  = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!mountedRef.current) { ws.close(); return; }
            setConnectionStatus('ONLINE');
            console.log('%c🦅 [Live Radar] Gateway bağlantısı kuruldu. Zero-Trust Watcher devrede.', 'color: #10b981; font-weight: bold;');
        };

        ws.onmessage = (event) => {
            if (!mountedRef.current) return;
            try {
                const packet = JSON.parse(event.data);

                switch (packet.type) {
                    case 'THREAT_PULSE':     handleThreatPulse(packet);     break;
                    case 'DEGRADATION_WARN': handleDegradationWarn(packet); break;
                    case 'ORBITAL_STREAM':   handleOrbitalStream(packet);   break;
                    default:
                        console.debug('[Live Radar] Bilinmeyen paket tipi:', packet.type);
                }
            } catch (err) {
                console.error('[Live Radar] Paket parse hatası:', err);
            }
        };

        ws.onerror = (err) => {
            // onclose her halükarda tetikleneceği için burada sadece log'layoruz
            console.warn('[Live Radar] WS Hatası — otomatik yeniden bağlanma başlıyor...', err);
        };

        ws.onclose = (ev) => {
            if (!mountedRef.current) return;
            setConnectionStatus('RECONNECTING');
            console.warn(`[Live Radar] Bağlantı koptu (code: ${ev.code}). ${RECONNECT_MS / 1000}s sonra yeniden deneniyor...`);

            // Otomatik yeniden bağlanma (exponential backoff yerine sabit — basit tutuyoruz)
            reconnectTimerRef.current = setTimeout(connect, RECONNECT_MS);
        };
    }, [handleThreatPulse, handleDegradationWarn, handleOrbitalStream]);

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    useEffect(() => {
        mountedRef.current = true;
        connect();

        // Cleanup: bileşen unmount olunca WS'i temizle
        return () => {
            mountedRef.current = false;
            clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null; // Reconnect loop'u durdur
                wsRef.current.close(1000, 'Component unmounted');
                wsRef.current = null;
            }
        };
    }, [connect]); // connect useCallback ile memoize edildi, stable referans

    // ── Return (useMockRadar ile %100 uyumlu API) ─────────────────────────────
    return {
        threats,
        degradations,
        streams: Object.values(streams),   // obje → dizi (mock ile aynı)
        connectionStatus                    // bonus: dashboard status badge için
    };
}
