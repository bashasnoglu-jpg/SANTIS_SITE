/**
 * santis-telemetry-test.js
 * Gateway'i uçtan uca test etmek için CLI test motoru.
 * 
 * Kullanım:
 *   1. node santis-ws-gateway.js      (ayrı terminalde)
 *   2. node tools/santis-telemetry-test.js
 */

const WebSocket = require('ws');

const GATEWAY = 'ws://localhost:8080';
const TOKEN = 'SANTIS-CORE-TX99';

// ─── WATCHER (God's Eye tarafı) ───────────────────────────────────────────────
const watcher = new WebSocket(`${GATEWAY}/?role=watcher&token=${TOKEN}`);

watcher.on('open', () => console.log('[WATCHER] 👁️  God\'s Eye bağlandı. Sinyal bekleniyor...\n'));
watcher.on('message', (raw) => {
    const p = JSON.parse(raw);
    const icons = { THREAT_PULSE: '🔴', DEGRADATION_WARN: '🟡', ORBITAL_STREAM: '🟢' };
    console.log(`${icons[p.type] || '⚪'} [RADAR] ${p.type}`, JSON.stringify(p.payload));
});
watcher.on('close', () => console.log('[WATCHER] Bağlantı kapandı.'));
watcher.on('error', (err) => console.error('[WATCHER ERROR] Gateway çalışıyor mu?', err.message));

// ─── EMITTER (Ghost Cell tarafı) ─────────────────────────────────────────────
const emitter = new WebSocket(`${GATEWAY}/?role=emitter&token=${TOKEN}`);

emitter.on('open', () => {
    console.log('[EMITTER] 📡 Ghost Cell bağlandı. Test paketi sırası başlıyor...\n');

    const packets = [
        {
            type: 'THREAT_PULSE',
            client: { visitorId: 'V19-TEST', ip: '10.0.0.1' },
            payload: {
                spoofedName: 'rezervasyon.pdf',
                detectedHex: '4d5a9000',
                signature: 'EXECUTABLE',
                action: 'QUARANTINED'
            },
            timestamp: Date.now()
        },
        {
            type: 'DEGRADATION_WARN',
            client: { visitorId: 'V20-TEST', userAgent: 'Instagram/WebView iOS 15' },
            payload: { engineState: 'FALLBACK_MAIN_THREAD_CANVAS', riskLevel: 'UI_JANK_EXPECTED' },
            timestamp: Date.now()
        },
        {
            type: 'ORBITAL_STREAM',
            client: { visitorId: 'V21-TEST' },
            payload: { fileId: 'upl_cli_test', percent: 68, speed: '3.2 MB/s' },
            timestamp: Date.now()
        }
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i >= packets.length) {
            clearInterval(interval);
            console.log('\n[EMITTER] ✅ Tüm test paketleri gönderildi. 3 saniye sonra kapanıyor...');
            setTimeout(() => { emitter.close(); watcher.close(); }, 3000);
            return;
        }
        const packet = packets[i++];
        console.log(`[EMITTER] → Gönderiliyor: ${packet.type}`);
        emitter.send(JSON.stringify(packet));
    }, 1000);
});

emitter.on('close', () => console.log('[EMITTER] Bağlantı kapandı. Test tamamlandı.'));
emitter.on('error', (err) => console.error('[EMITTER ERROR]', err.message));
