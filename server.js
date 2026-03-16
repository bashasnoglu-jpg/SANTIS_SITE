/**
 * ═══════════════════════════════════════════════════════════
 * SANTIS SOVEREIGN SERVER v1.0
 * ═══════════════════════════════════════════════════════════
 * Tek dosya: Statik dosyalar + API + WebSocket
 * Node.js — sıfır bağımlılık (zero npm install)
 *
 * Kullanım:
 *   node server.js
 *   → http://localhost:8080
 *
 * Sağladığı endpoint'ler:
 *   GET  /api/v1/analytics/metrics
 *   GET  /api/v1/analytics/god/health
 *   POST /api/v1/analytics/simulate
 *   GET  /api/v1/media/assets
 *   GET  /api/v1/media/filters
 *   GET  /api/v1/media/slots/health
 *   PATCH /api/v1/services/update
 *   POST /api/v1/telemetry/beacon
 *   POST /api/v1/telemetry/aurelia-mock
 *   GET  /api/v1/admin/bookings
 *   WS   /ws
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8080;
const ROOT = __dirname;

// ── MIME Types ─────────────────────────────────────────────
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.webp': 'image/webp',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.mp3':  'audio/mpeg',
    '.mp4':  'video/mp4',
    '.webm': 'video/webm',
    '.pdf':  'application/pdf',
    '.csv':  'text/csv',
    '.bat':  'text/plain',
};

// ── Mock Data ──────────────────────────────────────────────
const mockMetrics = () => ({
    visitors:    1280 + Math.floor(Math.random() * 200),
    pageviews:   4850 + Math.floor(Math.random() * 500),
    cvr:         (14 + Math.random() * 8).toFixed(1),
    revenue:     12400 + Math.floor(Math.random() * 3000),
    bounceRate:  (22 + Math.random() * 10).toFixed(1),
    avgSession:  '4m 12s',
    topPage:     '/tr/masajlar/',
    timestamp:   new Date().toISOString()
});

const mockBookings = () => Array.from({ length: 8 }, (_, i) => ({
    id: `BK-${1000 + i}`,
    guest: `Misafir ${i + 1}`,
    service: ['Sultan Hamamı','Bali Masajı','Deep Tissue','Sothys Cilt','Ayurveda'][i % 5],
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    time: `${10 + i}:00`,
    status: i < 5 ? 'confirmed' : 'pending',
    price_eur: [180, 120, 140, 95, 200][i % 5]
}));

const mockFilters = () => ({
    categories: ['ritual-hammam','massage-relaxation','massage-premium','skincare','ritual'],
    languages: ['tr','en'],
    slots: ['hero','card','gallery','detail']
});

const mockAssets = () => ({
    items: Array.from({ length: 12 }, (_, i) => ({
        id: `asset-${i}`,
        filename: `card-${i + 1}.jpg`,
        path: `/assets/img/cards/card-${i + 1}.jpg`,
        category: ['hamam','massage','skincare','ritual'][i % 4],
        slot: ['hero','card','gallery'][i % 3],
        lang: 'tr'
    })),
    total: 12
});

// ── API Router ─────────────────────────────────────────────
function handleAPI(req, res) {
    const url = req.url.split('?')[0];
    const method = req.method;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (method === 'OPTIONS') { res.writeHead(204); res.end(); return true; }

    const json = (data, code = 200) => {
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // ── Analytics ──
    if (url === '/api/v1/analytics/metrics' && method === 'GET') {
        json(mockMetrics()); return true;
    }
    if (url === '/api/v1/analytics/god/health' && method === 'GET') {
        json({ status: 'online', mode: 'sovereign', uptime: '4h 22m', activeSessions: 3 }); return true;
    }
    if (url === '/api/v1/analytics/simulate' && method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            const input = body ? JSON.parse(body) : {};
            const surge = input.surge_multiplier || 1.0;
            json({
                success: true,
                predicted_mrr: Math.round(24500 * surge),
                predicted_bookings: Math.round(180 * surge),
                predicted_occupancy_pct: Math.min(99, Math.round(72 * surge)),
                dynamic_price: `€${(150 * surge).toFixed(0)}`,
                message: 'Sandbox simulation completed.'
            });
        });
        return true;
    }

    // ── Media ──
    if (url === '/api/v1/media/assets' && method === 'GET') {
        json(mockAssets()); return true;
    }
    if (url === '/api/v1/media/filters' && method === 'GET') {
        json(mockFilters()); return true;
    }
    if (url === '/api/v1/media/slots/health' && method === 'GET') {
        json({ 
            status: 'online', 
            total_slots: 48, 
            critical_count: 1,
            empty_count: 1,
            filled: 46,
            slots: [
                { slot: 'hero_home', status: 'optimal', sas_score: 9.94, filename: 'hero_home_video.mp4' },
                { slot: 'card_hamam_1', status: 'optimal', sas_score: 9.88, filename: 'hammam_ritual.webp' },
                { slot: 'card_masaj_1', status: 'optimal', sas_score: 9.75, filename: 'massage_therapy.webp' },
                { slot: 'card_cilt_1', status: 'at_risk', sas_score: 8.42, filename: 'skincare_basic.webp' },
                { slot: 'highlight_home', status: 'empty', sas_score: 0.0, filename: null },
                { slot: 'hero_hamam', status: 'critical', sas_score: 1.20, filename: 'old_hamam_distorted.jpg' }
            ]
        }); 
        return true;
    }
    if (url === '/api/v1/media/upload' && method === 'POST') {
        // Mock upload endpoint matching integrated_hub.js expectations
        json({ status: 'SCANNING', success: true, message: 'Media successfully ingested.', asset_id: 'asset-' + Date.now() });
        return true;
    }
    
    // ── Simulation Engine ──
    if (url.startsWith('/api/v1/analytics/simulate_move') && method === 'GET') {
        json({
            status: 'ok',
            simulation: {
                target_persona: 'Luxury Explorer',
                resonance: (Math.random() * (99.0 - 85.0) + 85.0).toFixed(1),
                projected_mrr_lift: Math.floor(Math.random() * 5000) - 1000
            }
        });
        return true;
    }

    // ── Services ──
    if (url === '/api/v1/services/update' && method === 'PATCH') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                json({ success: true, message: `"${payload.title || payload.id}" başarıyla güncellendi.`, updated: payload });
            } catch (e) { json({ error: 'Geçersiz JSON' }, 400); }
        });
        return true;
    }

    // ── Telemetry & Sentience ──
    if (url === '/api/v1/telemetry/beacon' && method === 'POST') {
        json({ received: true, timestamp: new Date().toISOString() }); return true;
    }
    if (url === '/api/v1/telemetry/ingest' && method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => json({ status: 'INGESTED', timestamp: new Date().toISOString() }));
        return true;
    }
    if (url === '/api/v1/telemetry/aurelia-mock' && method === 'POST') {
        json({ deployed: true, agent: 'aurelia', message: 'Rescue mission initiated.' }); return true;
    }
    if (url === '/api/v1/analytics/engage_sentience' && method === 'POST') {
        // Return a mock optimization opportunity to trigger the modal
        json({
            status: 'OPPORTUNITY',
            message: 'Sovereign Intelligence: Kesişim Uyumsuzluğu Tespit Edildi.',
            recommendation: {
                projected_mrr_lift: 1250,
                agent_id: '8XF-9021-NEURO',
                agent_sas: 'Aurelia Alpha',
                target_slot: 'hero_home',
                old_resonance: '74%',
                new_resonance: '92%'
            }
        }); 
        return true;
    }

    // ── Bookings ──
    if (url === '/api/v1/admin/bookings' && method === 'GET') {
        json({ bookings: mockBookings(), total: 8 }); return true;
    }

    // ── Hotels ──
    if (url === '/api/v1/admin/hotels' && method === 'GET') {
        json({ status: 'success', hotels: [
            { id: 1, name: 'Santis Club HQ', location: 'Antalya, TR', status: 'Online', guests: 24, revenue: 14500, ai_conv: '18%' },
            { id: 2, name: 'The Vendôme Spa', location: 'Paris, FR', status: 'Online', guests: 8, revenue: 8200, ai_conv: '12%' },
            { id: 3, name: 'Zenith Retreat', location: 'Tokyo, JP', status: 'Offline', guests: 0, revenue: 0, ai_conv: '--' }
        ]}); return true;
    }
    if (url === '/api/v1/admin/hotels' && method === 'POST') {
        let body = ''; req.on('data', c => body += c);
        req.on('end', () => json({ status: 'success', message: 'Hotel node deployed.' }));
        return true;
    }

    // ── Health / Panel Audit (God Mode) ──
    if (url === '/api/v1/health/panel-audit' && method === 'GET') {
        json({ status: 'healthy', panels: [
            { name: 'Command Center', status: 'online', lastPing: Date.now() },
            { name: 'God Mode', status: 'online', lastPing: Date.now() },
            { name: 'Revenue', status: 'online', lastPing: Date.now() }
        ], quarantine: [] }); return true;
    }

    // ── God Mode Stream (SSE stub) ──
    if (url === '/api/v1/god-mode/stream' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        res.write('data: {"type":"heartbeat","status":"sovereign","timestamp":' + Date.now() + '}\n\n');
        const interval = setInterval(() => {
            if (res.destroyed) { clearInterval(interval); return; }
            res.write('data: {"type":"pulse","visitors":' + Math.floor(Math.random()*5) + ',"timestamp":' + Date.now() + '}\n\n');
        }, 5000);
        req.on('close', () => clearInterval(interval));
        return true;
    }

    // ── Yield Status ──
    if (url === '/api/v1/admin/yield-status' && method === 'GET') {
        json({ yield_score: 87, trend: 'up', daily_target: 18000, current: 14500, pct: 80.6 }); return true;
    }

    // ── Services Live ──
    if (url === '/api/v1/services-live' && method === 'GET') {
        json({ services: 24, active: 18, paused: 6, top: 'Sultan Hamamı' }); return true;
    }

    // ── Guest Clusters ──
    if (url === '/api/v1/guests/clusters' && method === 'GET') {
        json({ clusters: [
            { name: 'Recovery Seeker', count: 12, pct: 40 },
            { name: 'Sovereign Guest', count: 8, pct: 27 },
            { name: 'Luxury Explorer', count: 10, pct: 33 }
        ]}); return true;
    }

    // ── VIP Roster ──
    if (url === '/api/v1/admin/vip-roster' && method === 'GET') {
        json({ vips: [
            { name: 'VIP Guest 1', score: 94, ltv: 4200, lastVisit: '2026-03-10' },
            { name: 'VIP Guest 2', score: 88, ltv: 3100, lastVisit: '2026-03-09' },
            { name: 'VIP Guest 3', score: 76, ltv: 1800, lastVisit: '2026-03-05' }
        ]}); return true;
    }

    // ── CRM AI Insights ──
    if (url === '/api/v1/admin/ai-insights' && method === 'GET') {
        json({ 
            success: true, 
            insights: [
                { id: 'ai_1', type: 'churn_risk', title: 'High Churn Risk: VIP Guest 2', detail: 'No bookings in the last 45 days. Recommendation: Send targeted recovery offer.', action: 'Deploy Rescue Campaign' },
                { id: 'ai_2', type: 'upsell', title: 'Upsell Opportunity: VIP Guest 1', detail: 'Frequent massage bookings. Propensity to buy luxury skincare > 80%.', action: 'Offer Skincare Upgrade' },
                { id: 'ai_3', type: 'anomaly', title: 'Booking Anomaly: Friday 18:00', detail: 'Lower than expected bookings for upcoming Friday evening. Recommend yield override.', action: 'Review Yield Pricing' }
            ]
        }); return true;
    }

    // ── Black Room APIs ──
    if (url === '/api/v1/billing/plans' && method === 'GET') {
        json({ success: true, plans: [
            { id: 'starter', name: 'Sovereign Core', price: 99 },
            { id: 'pro', name: 'Quantum Yield', price: 299 },
            { id: 'enterprise', name: 'Omniverse Node', price: 999 }
        ]}); return true;
    }
    
    if (url === '/api/v1/admin/system/health' && method === 'GET') {
        // More comprehensive health endpoint for Black Room
        json({ 
            status: 'operational',
            cpu_load: '12%',
            memory: '48%',
            network: 'stable',
            active_nodes: 18,
            encryption: 'AES-GCM-256'
        }); return true;
    }
    
    if (url === '/api/v1/admin/tenant-branding' && method === 'GET') {
        json({ 
            success: true,
            theme: 'dark-gold',
            logo: '/assets/img/logo.svg',
            fonts: ['Inter', 'Space Grotesk']
        }); return true;
    }

    if (url === '/api/v1/admin/neural-action' && method === 'POST') {
        json({ success: true, status: 'EXECUTED', message: 'Neural command deployed successfully.' });
        return true;
    }

    if (url === '/api/v1/admin/yield-override' && method === 'POST') {
        json({ success: true, status: 'OVERRIDDEN', message: 'Yield pricing rules bypassed.' });
        return true;
    }

    // ── Revenue Forecast & LTV ──
    if (url === '/api/v1/revenue/forecast' && method === 'GET') {
        json({ today: 14500, forecast_tomorrow: 16200, weekly: 98000, monthly_target: 420000, monthly_actual: 312000 }); return true;
    }
    if (url === '/api/v1/revenue/ltv-churn' && method === 'GET') {
        json({ avg_ltv: 1850, churn_rate: 4.2, retention_90d: 78, cohort_growth: 12.5 }); return true;
    }
    if (url === '/api/v1/revenue/admin/revenue' && method === 'GET') {
        const period = (req.url.split('period=')[1] || 'today').split('&')[0];
        const data = {
            today:   { revenue: 14500, bookings: 42, avg_ticket: 345, top_service: 'Sultan Hamamı' },
            week:    { revenue: 98000, bookings: 280, avg_ticket: 350, top_service: 'Deep Tissue' },
            month:   { revenue: 312000, bookings: 920, avg_ticket: 339, top_service: 'Sultan Hamamı' },
            quarter: { revenue: 890000, bookings: 2650, avg_ticket: 336, top_service: 'Aromaterapi' }
        };
        json({ status: 'success', period, ...(data[period] || data.today) }); return true;
    }

    return false; // Not an API route
}

// ── Static File Server ─────────────────────────────────────
function serveStatic(req, res) {
    let urlPath = req.url.split('?')[0];
    if (urlPath.endsWith('/')) urlPath += 'index.html';

    const filePath = path.join(ROOT, decodeURIComponent(urlPath));
    const ext = path.extname(filePath).toLowerCase();

    // Güvenlik: root dışına çıkma engeli
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found: ' + urlPath);
            return;
        }
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

// ═══════════════════════════════════════════════════════════
// 🛡️ SOVEREIGN WEBSOCKET SHIELD v2.0 (Production-Grade)
// ═══════════════════════════════════════════════════════════
// 7-Layer Defense: Origin · IP Limit · Rate Limit · Heartbeat
//                  Zombie Cleanup · Payload Limit · Multiplex Router
// ═══════════════════════════════════════════════════════════

const wsClients = new Set();
const wsRateMap = new Map();        // IP → { count, resetTime } (connection rate)
const ipConnections = new Map();    // IP → active connection count (concurrent)

// ── CONFIG ─────────────────────────────────────────────────
const WS_CONFIG = {
    // 🛡️ Origin Whitelist (CSWSH Koruması)
    ALLOWED_ORIGINS: new Set([
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'https://santisclub.com',
        'https://www.santisclub.com',
        'https://admin.santisclub.com',
    ]),
    ALLOW_NULL_ORIGIN: true,           // file:// ve yerel geliştirme için

    // 🚫 Limits
    MAX_CONNECTIONS_PER_IP: 5,         // Eş zamanlı bağlantı limiti
    MAX_CONNECT_RATE_PER_MIN: 120,      // Dakikada max yeni bağlantı (local dev: 120)
    MAX_MESSAGES_PER_MIN: 100,         // Bağlantı başına mesaj hız limiti
    MAX_PAYLOAD_BYTES: 32 * 1024,      // 32 KB max mesaj boyutu

    // ❤️ Heartbeat
    HEARTBEAT_INTERVAL_MS: 30000,      // 30 saniye ping/pong
    TELEMETRY_INTERVAL_MS: 10000,      // 10 saniye mock telemetry
};

// ── 1️⃣ ORIGIN SHIELD (CSWSH Koruması) ─────────────────────
function verifyOrigin(origin) {
    if (origin === null || origin === undefined) {
        return WS_CONFIG.ALLOW_NULL_ORIGIN;
    }
    return WS_CONFIG.ALLOWED_ORIGINS.has(origin);
}

// ── 2️⃣ IP CONNECTION LIMIT ────────────────────────────────
function canConnect(ip) {
    const count = ipConnections.get(ip) || 0;
    if (count >= WS_CONFIG.MAX_CONNECTIONS_PER_IP) return false;
    ipConnections.set(ip, count + 1);
    return true;
}

function releaseConnection(ip) {
    const count = ipConnections.get(ip) || 1;
    if (count <= 1) {
        ipConnections.delete(ip);
    } else {
        ipConnections.set(ip, count - 1);
    }
}

// ── 3️⃣ CONNECTION RATE LIMIT ──────────────────────────────
function checkConnectionRate(ip) {
    const now = Date.now();
    let entry = wsRateMap.get(ip);
    if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime: now + 60000 };
        wsRateMap.set(ip, entry);
    }
    entry.count++;
    return entry.count <= WS_CONFIG.MAX_CONNECT_RATE_PER_MIN;
}

// Rate map temizliği — her 5 dakikada eski kayıtları sil
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of wsRateMap) {
        if (now > entry.resetTime) wsRateMap.delete(ip);
    }
}, 300000);

// ── FULL VERIFY CLIENT ─────────────────────────────────────
function verifyClient(req, socket) {
    const origin = req.headers.origin || null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;

    // 1. ORIGIN KONTROLÜ
    if (!verifyOrigin(origin)) {
        console.warn(`🚫 [WS SHIELD] Origin reddedildi: ${origin} | IP: ${ip}`);
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return null;
    }

    // 2. CONNECTION RATE LIMIT
    if (!checkConnectionRate(ip)) {
        console.warn(`🚫 [WS SHIELD] Bağlantı hız limiti aşıldı: ${ip}`);
        socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
        socket.destroy();
        return null;
    }

    // 3. CONCURRENT CONNECTION LIMIT
    if (!canConnect(ip)) {
        console.warn(`🚫 [WS SHIELD] Eş zamanlı bağlantı limiti aşıldı: ${ip} (max ${WS_CONFIG.MAX_CONNECTIONS_PER_IP})`);
        socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
        socket.destroy();
        return null;
    }

    return ip; // Doğrulanmış IP döndür
}

// ── 8️⃣ SOVEREIGN MULTIPLEX ROUTER ─────────────────────────
function routeMessage(socket, parsed) {
    const channel = parsed.channel || parsed.type || 'unknown';

    switch (channel) {
        case 'telemetry':
            // Telemetri verisi — logla ve admin client'lara forward et
            console.log(`📊 [WS Router] Telemetry: ${JSON.stringify(parsed.payload || {}).substring(0, 80)}`);
            // 🧬 Darwinian + Ghost telemetriyi admin radar'a ilet
            wsClients.forEach(c => {
                if (c !== socket && !c.destroyed && c._wsClientType === 'admin') {
                    wsSend(c, { type: 'TELEMETRY_BEACON', payload: parsed.payload });
                }
            });
            break;

        case 'data':
            // Veri güncelleme — Store'a yönlendir
            wsClients.forEach(c => {
                if (c !== socket && !c.destroyed) {
                    wsSend(c, { type: 'data_update', payload: parsed.payload });
                }
            });
            break;

        case 'system':
            // Sistem komutları — admin panelden gelen emirler
            console.log(`⚙️ [WS Router] System: ${parsed.action || 'unknown'}`);

            // 🧬 APEX LOCK: Admin en başarılı varyantı tüm kullanıcılara kilitler
            if (parsed.action === 'apex_lock' && socket._wsClientType === 'admin') {
                console.log(`👑 [APEX LOCK] Varyant kilitlendi: ${parsed.payload?.variantHash}`);
                wsClients.forEach(c => {
                    if (!c.destroyed && c._wsClientType !== 'admin') {
                        wsSend(c, { type: 'APEX_LOCK', payload: parsed.payload });
                    }
                });
                // Admin'e onay
                wsSend(socket, { type: 'APEX_LOCK_CONFIRMED', payload: parsed.payload });
            }
            // 🔓 APEX UNLOCK: Otonom evrime geri dön
            else if (parsed.action === 'apex_unlock' && socket._wsClientType === 'admin') {
                console.log(`🔓 [APEX UNLOCK] Otonom evrim yeniden aktif`);
                wsClients.forEach(c => {
                    if (!c.destroyed && c._wsClientType !== 'admin') {
                        wsSend(c, { type: 'APEX_UNLOCK' });
                    }
                });
                wsSend(socket, { type: 'APEX_UNLOCK_CONFIRMED' });
            }
            break;

        case 'ping':
            // Uygulama seviyesi ping/pong
            wsSend(socket, { type: 'pong', t: Date.now() });
            break;

        default:
            // Bilinmeyen kanal — broadcast et (geriye uyumluluk)
            wsClients.forEach(c => {
                if (c !== socket && !c.destroyed) {
                    wsSend(c, { type: 'broadcast', data: parsed });
                }
            });
            break;
    }
}

// ── UPGRADE HANDLER ────────────────────────────────────────
function handleUpgrade(req, socket) {
    // 🛡️ ZERO TRUST: Handshake öncesi 3 katmanlı doğrulama
    const ip = verifyClient(req, socket);
    if (!ip) return;

    const key = req.headers['sec-websocket-key'];
    if (!key) { releaseConnection(ip); socket.destroy(); return; }

    const accept = crypto.createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-5AB5DC11E65B')
        .digest('base64');

    socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
    );

    // ── Connection State ──
    socket._wsIp = ip;
    socket._wsAlive = true;
    socket._wsMsgCount = 0;
    socket._wsConnectedAt = Date.now();

    // 🏷️ Client Sınıflandırma: admin paneli mi, frontend mi?
    const urlParams = new URL(req.url, 'http://dummy').searchParams;
    socket._wsClientType = urlParams.get('client_type') || 'frontend';

    wsClients.add(socket);
    console.log(`📡 [WS] Bağlantı kabul edildi. Type: ${socket._wsClientType} | Origin: ${req.headers.origin || 'N/A'} | IP: ${ip} | Aktif: ${wsClients.size}`);

    // Welcome message
    wsSend(socket, { type: 'SYSTEM_BOOT', payload: { message: 'Sovereign Bus Online', version: '2.0', timestamp: Date.now() } });

    // ── 4️⃣ DATA HANDLER + 5️⃣ MESSAGE RATE LIMIT ──
    socket.on('data', (buf) => {
        try {
            // Protocol-level pong cevabı (opcode 0xA)
            if (buf.length >= 2 && (buf[0] & 0x0F) === 0x0A) {
                socket._wsAlive = true;
                return;
            }

            const msg = wsDecodeFrame(buf);
            if (!msg) return;

            // 🚫 Payload boyut kontrolü
            if (Buffer.byteLength(msg, 'utf8') > WS_CONFIG.MAX_PAYLOAD_BYTES) {
                console.warn(`🚫 [WS SHIELD] Payload aşırı büyük — bağlantı kapatılıyor: ${ip}`);
                socket.destroy();
                return;
            }

            // 🚫 Message rate limit
            socket._wsMsgCount++;
            if (socket._wsMsgCount > WS_CONFIG.MAX_MESSAGES_PER_MIN) {
                console.warn(`🚫 [WS SHIELD] Mesaj hız limiti aşıldı: ${ip} (${socket._wsMsgCount}/${WS_CONFIG.MAX_MESSAGES_PER_MIN}/dk)`);
                wsSend(socket, { type: 'error', code: 1008, message: 'Rate limit exceeded' });
                socket.destroy();
                return;
            }

            // Parse & route
            try {
                const parsed = JSON.parse(msg);
                routeMessage(socket, parsed);
            } catch (e) {
                // JSON olmayan mesaj — sessizce yoksay
            }
        } catch (e) {}
    });

    // ── 7️⃣ CONNECTION CLEANUP ──
    socket.on('close', () => {
        wsClients.delete(socket);
        releaseConnection(ip);
        console.log(`📡 [WS] Bağlantı kapandı. IP: ${ip} | Aktif: ${wsClients.size}`);
    });
    socket.on('error', () => {
        wsClients.delete(socket);
        releaseConnection(ip);
    });
}

// ── 5️⃣ MESSAGE RATE RESET (60 saniyelik döngü) ───────────
setInterval(() => {
    wsClients.forEach(socket => {
        if (!socket.destroyed) socket._wsMsgCount = 0;
    });
}, 60000);

// ── 6️⃣ HEARTBEAT — ZOMBIE CONNECTION KILLER ───────────────
// Protocol-level Ping (opcode 0x9) — RFC 6455 uyumlu
function wsPing(socket) {
    try {
        if (!socket.destroyed) {
            const pingFrame = Buffer.from([0x89, 0x00]); // opcode 0x9 (ping), 0 byte payload
            socket.write(pingFrame);
        }
    } catch (e) {}
}

setInterval(() => {
    let zombieCount = 0;
    wsClients.forEach(socket => {
        if (!socket._wsAlive) {
            // ☠️ Zombi tespit edildi — öldür
            zombieCount++;
            console.warn(`☠️ [HEARTBEAT] Zombi bağlantı temizlendi: ${socket._wsIp}`);
            socket.destroy();
            wsClients.delete(socket);
            releaseConnection(socket._wsIp);
            return;
        }
        // Canlılık bayrağını indir ve ping at
        socket._wsAlive = false;
        wsPing(socket);
    });
    if (zombieCount > 0) {
        console.log(`🧹 [HEARTBEAT] ${zombieCount} zombi temizlendi. Aktif: ${wsClients.size}`);
    }
}, WS_CONFIG.HEARTBEAT_INTERVAL_MS);

// ── WS ENCODING / DECODING ─────────────────────────────────
function wsSend(socket, obj) {
    try {
        const str = JSON.stringify(obj);
        const buf = Buffer.from(str, 'utf8');
        const frame = Buffer.alloc(2 + (buf.length > 125 ? 2 : 0) + buf.length);
        frame[0] = 0x81; // text frame
        if (buf.length > 125) {
            frame[1] = 126;
            frame.writeUInt16BE(buf.length, 2);
            buf.copy(frame, 4);
        } else {
            frame[1] = buf.length;
            buf.copy(frame, 2);
        }
        if (!socket.destroyed) socket.write(frame);
    } catch (e) {}
}

function wsDecodeFrame(buf) {
    if (buf.length < 2) return null;
    const opcode = buf[0] & 0x0F;
    // Close frame (0x8) — bağlantıyı kapat
    if (opcode === 0x08) return null;
    // Ping frame (0x9) — protokol seviyesi, routeMessage'a geçme
    if (opcode === 0x09) return null;
    // Pong frame (0xA) — zaten data handler'da yakalanıyor
    if (opcode === 0x0A) return null;

    const masked = (buf[1] & 0x80) !== 0;
    let len = buf[1] & 0x7f;
    let offset = 2;
    if (len === 126) { len = buf.readUInt16BE(2); offset = 4; }
    if (masked) {
        const mask = buf.slice(offset, offset + 4); offset += 4;
        const data = buf.slice(offset, offset + len);
        for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
        return data.toString('utf8');
    }
    return buf.slice(offset, offset + len).toString('utf8');
}

// ── TELEMETRY BROADCAST (Mock — 10 saniyelik döngü) ────────
setInterval(() => {
    const event = {
        type: 'LIVE_PULSE',
        data: {
            activeGuests: Math.floor(Math.random() * 8) + 1,
            revenueForecast: 14500 + Math.floor(Math.random() * 3000),
        },
        timestamp: Date.now()
    };
    wsClients.forEach(c => { if (!c.destroyed) wsSend(c, event); });
}, WS_CONFIG.TELEMETRY_INTERVAL_MS);

// ── HTTP Server ────────────────────────────────────────────
const server = http.createServer((req, res) => {
    // 🏥 ROOT HEALTH ENDPOINT — JSON sağlık raporu
    if (req.url === '/health' || req.url === '/health/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            server: 'Santis Sovereign Server v1.0',
            uptime_seconds: Math.round(process.uptime()),
            uptime_human: formatUptime(process.uptime()),
            memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
            ws_clients: wsClients.size,
            node_version: process.version,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // API routes
    if (req.url.startsWith('/api/')) {
        if (!handleAPI(req, res)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unknown API endpoint', path: req.url }));
        }
        return;
    }
    // Admin sidebar redirects
    const redirects = {
        '/hq-dashboard': '/admin/index.html',
        '/tenant-dashboard': '/admin/hotels.html',
        '/guest-zen': '/tr/index.html'
    };
    const cleanUrl = req.url.split('?')[0];
    if (redirects[cleanUrl]) {
        res.writeHead(302, { 'Location': redirects[cleanUrl] });
        res.end(); return;
    }
    // Static files
    serveStatic(req, res);
});

// 🛡️ Uptime Formatter
function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

// 🛡️ CRASH SHIELD: Sunucu hiçbir hatada çökmez
process.on('uncaughtException', (err) => {
    console.error('🚨 [CRASH SHIELD] Uncaught Exception yakalandı (sunucu ayakta):', err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('🚨 [CRASH SHIELD] Unhandled Rejection yakalandı (sunucu ayakta):', reason);
});

// WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/ws')) {
        handleUpgrade(req, socket);
    } else {
        socket.destroy();
    }
});

server.listen(PORT, () => {
    console.log('');
    console.log('  ╔═══════════════════════════════════════════════════╗');
    console.log('  ║  👑 SANTIS SOVEREIGN SERVER v1.0                  ║');
    console.log('  ║  Static + API + WebSocket — Zero Dependencies     ║');
    console.log('  ╠═══════════════════════════════════════════════════╣');
    console.log(`  ║  🌐 http://localhost:${PORT}                        ║`);
    console.log(`  ║  📡 ws://localhost:${PORT}/ws                       ║`);
    console.log('  ║  📊 /api/v1/analytics/metrics                     ║');
    console.log('  ║  🛡️  /api/v1/analytics/god/health                  ║');
    console.log('  ║  🎯 /api/v1/analytics/simulate                    ║');
    console.log('  ║  🖼️  /api/v1/media/assets                         ║');
    console.log('  ║  🔍 /api/v1/media/filters                        ║');
    console.log('  ║  📡 /api/v1/media/slots/health                    ║');
    console.log('  ║  💾 /api/v1/services/update (PATCH)               ║');
    console.log('  ║  📊 /api/v1/telemetry/beacon (POST)               ║');
    console.log('  ║  📅 /api/v1/admin/bookings                       ║');
    console.log('  ╚═══════════════════════════════════════════════════╝');
    console.log('');
});
