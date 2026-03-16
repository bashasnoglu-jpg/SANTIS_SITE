/**
 * 👑 SOVEREIGN OMNIVERSE GATEWAY - V18 APEX
 * Node.js + Fastify + Native WebSocket + Redis
 */
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const fastifyWebsocket = require('@fastify/websocket');
const path = require('path');

const titanium = require('./db/titanium');
const chaosEngine = require('./db/chaos-engine');

fastify.register(cors, { origin: '*' });

// WebSockets (Must be registered early)
fastify.register(fastifyWebsocket);

// Serve frontend static files
fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../../'),
    prefix: '/', 
});

// God Mode connections tracking
const godModeClients = new Set();

fastify.register(async (app) => {
    const handleGodMode = (con, req) => {
        const ws = con.socket || con; // Fastify v5 passes WebSocket directly as 'con'
        if (!ws) return;
        godModeClients.add(ws);
        app.log.info(`[Tachyonic Bridge] Architect entered God Mode/Boardroom. IP: ${req.ip}`);

        ws.send(JSON.stringify({ 
            type: 'SYSTEM_BOOT',
            payload: { 
                status: 'ABSOLUTE_CONTROL',
                message: 'Omniverse Link Established. Welcome to God Mode, Architect.'
            } 
        }));

        ws.on('close', () => {
            app.log.info(`[Tachyonic Bridge] Architect disconnected.`);
            godModeClients.delete(ws);
        });
    };

    app.get('/ws/god-mode', { websocket: true }, handleGodMode);
    app.get('/ws/global/hq', { websocket: true }, handleGodMode);
    app.get('/ws', { websocket: true }, handleGodMode);
});

// Broadcast Helper Method attached to fastify instance
fastify.decorate('broadcastToGodMode', (data) => {
    const payload = JSON.stringify(data);
    for (const client of godModeClients) {
        if (client.readyState === 1 /* OPEN */) {
            client.send(payload);
        }
    }
});

// Register routes
fastify.register(require('./routes/telemetry'), { prefix: '/api/v1/telemetry' });
fastify.register(require('./routes/services'), { prefix: '/api/v1/services' });
fastify.register(require('./routes/admin'), { prefix: '/api/v1/admin' });
fastify.register(require('./routes/revenue'), { prefix: '/api/v1/revenue' });
fastify.register(require('./routes/billing'), { prefix: '/api/v1/billing' });
fastify.register(require('./routes/omniverse'), { prefix: '/api/v1' });

// Health Check
fastify.get('/api/v1/analytics/god/health', async (request, reply) => {
    return { status: 'SOVEREIGN_GATEWAY_ONLINE', version: 'V18' };
});

// Chaos Pulse
let globalPulse = 347;
let revenueForecast = 128500;
setInterval(() => {
    globalPulse += Math.floor((Math.random() - 0.4) * 5);
    revenueForecast += Math.floor((Math.random() - 0.2) * 600);
    fastify.broadcastToGodMode({
        type: 'LIVE_PULSE',
        data: {
            activeGuests: globalPulse,
            revenueForecast: revenueForecast,
            aureliaStatus: 'HUNTING',
            timestamp: Date.now()
        }
    });
}, 1500);

const start = async () => {
    try {
        const PORT = process.env.PORT || 8080;
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`\n🍷 [OMNIVERSE FASTIFY GATEWAY] Native WS Active on http://localhost:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
