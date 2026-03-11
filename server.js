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

// ── WebSocket (Minimal, RFC 6455) ──────────────────────────
const wsClients = new Set();

function handleUpgrade(req, socket) {
    const key = req.headers['sec-websocket-key'];
    if (!key) { socket.destroy(); return; }

    const accept = crypto.createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-5AB5DC11E65B')
        .digest('base64');

    socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
    );

    wsClients.add(socket);
    console.log(`📡 [WS] Client connected. Total: ${wsClients.size}`);

    // Welcome message
    wsSend(socket, { type: 'welcome', message: 'Sovereign Bus Online', timestamp: Date.now() });

    socket.on('data', (buf) => {
        try {
            const msg = wsDecodeFrame(buf);
            if (msg) {
                // Broadcast to all clients
                wsClients.forEach(c => { if (c !== socket && !c.destroyed) wsSend(c, { type: 'broadcast', data: msg }); });
            }
        } catch (e) {}
    });

    socket.on('close', () => { wsClients.delete(socket); console.log(`📡 [WS] Client disconnected. Total: ${wsClients.size}`); });
    socket.on('error', () => { wsClients.delete(socket); });
}

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

// Heartbeat: her 10 saniyede mock telemetry
setInterval(() => {
    const event = {
        type: 'telemetry',
        visitors: Math.floor(Math.random() * 5),
        page: ['/tr/','/tr/masajlar/','/tr/hamam/','/tr/cilt-bakimi/'][Math.floor(Math.random() * 4)],
        timestamp: Date.now()
    };
    wsClients.forEach(c => { if (!c.destroyed) wsSend(c, event); });
}, 10000);

// ── HTTP Server ────────────────────────────────────────────
const server = http.createServer((req, res) => {
    // API routes first
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
