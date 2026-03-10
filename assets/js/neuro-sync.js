/**
 * 🐝 SOVEREIGN OS v6.0 — NEURO-SYNC (HIVE MIND)
 * The Absolute Aegis | Doomsday Edition
 *
 * FEATURES:
 *   - Multi-Tab Alpha Failover: navigator.locks → Lider seçimi
 *     Alfa sekme kapanırsa Omega anında Alfa olur (lock auto-drop)
 *   - BroadcastChannel Pub/Sub: Sekmeler arası 0 gecikmeli telepatik sync
 *   - Echo Loop Prevention: Kendi mesajımıza kör oluruz
 *   - Ghost Mode Propagate: Incognito → tüm sync sessizce bypass
 *   - SWR (Stale-While-Revalidate): Lider sekme veriyi çekip kanalda yayar
 *
 * CONTRACTS:
 *   - window.__SOVEREIGN_GHOST === true ise init() anında return.
 *   - AbortController signal ile tüm listener ve lock zinciri temizlenir.
 */

import { ShadowDB } from '/assets/js/neuro-db.js';

const LOCK_NAME = 'sovereign_alpha';
const CHANNEL_NAME = 'sovereign_hive';
const SWR_INTERVAL = 30_000; // 30sn'de bir SWR döngüsü

// =========================================================
// 1. GHOST GATE
// =========================================================
function isGhost() {
    return window.__SOVEREIGN_GHOST === true;
}

// =========================================================
// 2. SWR — STALE-WHILE-REVALIDATE
//    Sadece Alfa sekme çalıştırır. Sonucu kanala yayar.
// =========================================================
async function revalidate(channel, signal) {
    if (signal.aborted || isGhost()) return;

    try {
        // Prerender kontrolü: Sayfa arka planda mı? (enerji tasarrufu)
        if (document.prerendering) {
            await new Promise(r => document.addEventListener('prerenderingchange', r, { once: true }));
        }

        const page = document.body?.dataset?.page;
        const dataKey = { hamam: 'NV_HAMMAM', massage: 'NV_MASSAGES', skincare: 'NV_SKINCARE', rituals: 'NV_JOURNEYS', index: 'NV_HAMMAM' }[page];
        if (!dataKey) return;

        const endpoint = `/api/v1/services`;
        const res = await fetch(endpoint, { signal });
        if (!res.ok) return;

        const allServices = await res.json();
        let fresh = [];

        // Kategoriye göre filtrele (data-bridge.js ile aynı mantık)
        allServices.forEach(item => {
            const c = (item.categoryId || item.category || '').toLowerCase();
            if (dataKey === 'NV_JOURNEYS' && (c === 'wellness' || c.includes('journey'))) fresh.push(item);
            else if (dataKey === 'NV_MASSAGES' && (c.startsWith('massage') || c === 'massage' || c === 'classicmassages' || c === 'asianmassages' || c === 'sportstherapy')) fresh.push(item);
            else if (dataKey === 'NV_HAMMAM' && (c.includes('hammam') || c.startsWith('ritual-hammam') || c === 'hamam')) fresh.push(item);
            else if (dataKey === 'NV_SKINCARE' && (c.startsWith('skincare') || c.startsWith('sothys') || c === 'facesothys')) fresh.push(item);
        });


        // Kanaldan diğer sekmelere yay
        channel.postMessage({ type: 'SWR_UPDATE', page, dataKey, payload: fresh, from: navigator.userAgentData?.brands?.[0]?.brand || 'alpha' });

        // Kendi penceresinde de güncelle
        window[dataKey] = fresh;
        window.dispatchEvent(new CustomEvent('sovereign:swr-fresh', { detail: { page, dataKey } }));

        console.log(`[Neuro-Sync] 📡 SWR yayını tamamlandı: ${dataKey} (${fresh.length || '?'} item)`);

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.warn('[Neuro-Sync] SWR başarısız (sessiz):', err.message);
        }
    }
}

// =========================================================
// 3. ALPHA LOOP — SWR Döngüsü (Sadece Alfa çalıştırır)
// =========================================================
async function runAlphaLoop(channel, signal) {
    console.log('[Neuro-Sync] 👑 Alfa kilidi alındı. SWR liderliği devralındı.');
    window.__IS_ALPHA = true;
    channel.postMessage({ type: 'ALPHA_ONLINE' });

    // İlk SWR hemen
    await revalidate(channel, signal);

    // Sonraki döngüler belirli aralıklarla
    while (!signal.aborted) {
        await new Promise(r => setTimeout(r, SWR_INTERVAL));
        if (signal.aborted) break;
        await revalidate(channel, signal);
    }
}

// =========================================================
// 4. OMEGA (DİNLEYİCİ) — Alfa'nın yayınlarını dinler
// =========================================================
function becomeOmega(channel, signal) {
    console.log('[Neuro-Sync] 🔄 Omega modunda bekliyorum (Alfa yayınları dinleniyor)...');
    window.__IS_ALPHA = false;

    channel.addEventListener('message', (e) => {
        if (signal.aborted) return;

        const { type, dataKey, payload, page } = e.data;

        // ECHO LOOP KORUMASI — Kendi mesajımıza kör ol
        if (e.data.from === (navigator.userAgentData?.brands?.[0]?.brand || 'alpha') && type !== 'ALPHA_ONLINE') return;

        if (type === 'ALPHA_ONLINE') {
            console.log('[Neuro-Sync] Alfa aktif. Omega dinlemede.');
        }

        if (type === 'SWR_UPDATE' && dataKey && payload) {
            // Kendi penceresini güncelle
            window[dataKey] = payload;
            window.dispatchEvent(new CustomEvent('sovereign:swr-fresh', { detail: { page, dataKey } }));
            console.log(`[Neuro-Sync] ⚡ Alfa'dan veri alındı: ${dataKey}`);
        }
    });
}

// =========================================================
// 5. SWR DUYURU DİNLEYİCİSİ — Her orkestratör dinler
//    Orkestratörler bu event'i yakalayıp DOM'u günceller.
// =========================================================
// (Event: 'sovereign:swr-fresh', detail: { page, dataKey })
// Orkestratörler bunu kendisi subscribe eder — buraya dokunma.

// =========================================================
// 6. PUBLIC INIT
// =========================================================
export function init(signal) {
    if (isGhost()) return;
    if (!('locks' in navigator)) {
        console.warn('[Neuro-Sync] navigator.locks desteklenmiyor. Hive Mind kapalı.');
        return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);

    // Signal abort edilince channel'i kapat
    signal?.addEventListener('abort', () => {
        window.__IS_ALPHA = false;
        channel.close();
        console.log('[Neuro-Sync] Signal abort → BroadcastChannel kapatıldı.');
    }, { once: true });

    // navigator.locks Rekabetçi Kilit (Multi-Tab Alpha Failover)
    // Alfa sekme kapanınca lock otomatik düşer → bekleyen Omega Alfa olur.
    navigator.locks.request(
        LOCK_NAME,
        { mode: 'exclusive', signal: signal },
        async (lock) => {
            if (!lock) return; // Signal abort ettiyse lock null gelir
            await runAlphaLoop(channel, signal);
            // runAlphaLoop signal abort edilince döner, kilit serbest kalır
            // → kapıda bekleyen ilk Omega anında bu bloka girer.
        }
    ).catch(err => {
        if (err.name === 'AbortError') return; // Normal: signal ile iptal
        console.warn('[Neuro-Sync] Lock hatası:', err.message);
    });

    // Bu sekme kilidi beklerken Omega olarak dinlemeye başlar
    becomeOmega(channel, signal);
}

// =========================================================
// 7. SSE KUANTUM DİNLEYİCİSİ (Sovereign OS v10)
//    Store import ile çalışır. Hive Mind sistemayle paralel.
//    Polling YASAK — Sunucu sinyal fırlatınca bu uyanır.
// =========================================================
import { Store } from './santis-store.js';

let _sseClient = null;
let _reconnectAttempts = 0;
const SSE_MAX_DELAY = 30_000;
const SSE_ENDPOINT = 'http://127.0.0.1:8000/api/v1/stream?tenant_id=santis_hq';

export function initNeuroSync() {
    if (window.__NEURO_SYNC_KILLED__) return;
    if (_sseClient) return; // Singleton: ikinci bağlantıyı engelle

    console.log('📡 [Neuro-Sync WS] Kuantum Köprüsü kuruluyor...');

    const connectQuantumSocket = () => {
        try {
            // Sizin sunucunuzun loglarda tam olarak beklediği "guest" (müşteri) kapısı!
            _sseClient = new WebSocket('ws://127.0.0.1:8000/ws?client_type=guest');

            _sseClient.onopen = () => {
                console.log("🟢 [Neuro-Sync WS] Bağlantı aktif.");
                _reconnectAttempts = 0;
            };

            _sseClient.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log(`⚡ [Neuro-Sync WS] Admin sinyali: ${data.action}`, data.payload?.id);

                    const store = window.__SANTIS_STORE__;
                    if (!store) return;

                    if (data.action === 'ADD') store.addService(data.payload);
                    else if (data.action === 'UPDATE') store.updateService(data.payload);
                    else if (data.action === 'DELETE') store.deleteService(data.payload.id, data.payload.category);
                } catch (err) {
                    console.error('🚨 [Neuro-Sync WS] Sinyal çözümlenemedi:', err);
                }
            };

            _sseClient.onerror = (err) => {
                console.error("🚨 [Neuro-Sync WS] Soket Hatası:", err);
            };

            _sseClient.onclose = () => {
                _sseClient = null;

                // Her kopuşta bekleme süresini 2x artır (max 30sn) — ağ yığılmasını önler
                const delay = Math.min(1_000 * (2 ** _reconnectAttempts), SSE_MAX_DELAY);
                _reconnectAttempts++;

                console.warn(`⚠️ [Neuro-Sync WS] Koptu. ${delay / 1000}sn sonra yeniden bağlanılacak.`);
                setTimeout(connectQuantumSocket, delay);
            };

        } catch (e) {
            console.error('🛑 [Neuro-Sync WS] Başlatılamadı:', e);
        }
    };

    connectQuantumSocket();
}

