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
const fastifyMultipart = require('@fastify/multipart');

const fastifyJwt = require('@fastify/jwt');
const fastifyRateLimit = require('@fastify/rate-limit');

fastify.register(cors, { origin: '*' });

// Multi-part support for Image Uploads
fastify.register(fastifyMultipart, {
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// -------------------------------
// 🔐 SECURITY LAYER (Sovereign Shield)
// -------------------------------
fastify.register(fastifyJwt, {
  secret: 'SANTIS_SUPREME_SECRET'
});

fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// JWT Middleware
fastify.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized. Sovereign Shield Blocked Request.' });
  }
});

// WebSockets (Must be registered early)
fastify.register(fastifyWebsocket);

// @fastify/static moved to very bottom to prevent intercepting /api/ payload routes

// God Mode connections tracking
const godModeClients = new Set();

fastify.register(async (app) => {
    const handleGodMode = (con, req) => {
        const ws = con.socket || con; // Fastify v5 passes WebSocket directly as 'con'
        if (!ws) return;
        godModeClients.add(ws);
        app.log.info(`[Tachyonic Bridge] Client connected. IP: ${req.ip}`);

        // Heartbeat / Keep-Alive logic
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });

        const heartbeatInterval = setInterval(() => {
            if (ws.isAlive === false) {
                app.log.warn(`[Tachyonic Bridge] Active heartbeat lost. Terminating IP: ${req.ip}`);
                godModeClients.delete(ws);
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        }, 30000);

        ws.send(JSON.stringify({ 
            type: 'SYSTEM_BOOT',
            payload: { 
                status: 'ABSOLUTE_CONTROL',
                message: 'Omniverse Link Established. Welcome to God Mode, Architect.'
            } 
        }));

        ws.on('close', () => {
            clearInterval(heartbeatInterval);
            app.log.info(`[Tachyonic Bridge] Client disconnected. IP: ${req.ip}`);
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
fastify.register(require('./routes/boardroom'), { prefix: '/api/v1/boardroom' });
fastify.register(require('./routes/media'), { prefix: '/api/v1/media' });
fastify.register(require('./routes/analytics'), { prefix: '/api/v1/analytics' });
fastify.register(require('./routes/concierge'), { prefix: '/api/v1/concierge' });
fastify.register(require('./routes/guest'), { prefix: '/api/v1/guests' });
fastify.register(require('./routes/wallet'), { prefix: '/api/v1/wallet' });
fastify.register(require('./routes/omniverse'), { prefix: '/api/v1' });

// Health Check
fastify.get('/api/v1/analytics/god/health', async (request, reply) => {
    return { status: 'SOVEREIGN_GATEWAY_ONLINE', version: 'V18' };
});

// -------------------------------
// 🎙️ AURELIA VOICE INTENT INGESTION
// -------------------------------
let lastIntent = null;
let lastHeardText = null;

fastify.post("/api/v1/aurelia/intent", async (req, reply) => {
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch(e) {
    body = req.body || {};
  }
  
  if (body.intent) {
      lastIntent = body.intent;
      lastHeardText = body.text;
      state.aureliaStatus = "PROCESSING";
  }
  
  return { ok: true };
});

// -------------------------------
// 🧪 TEST API (JWT PROTECTED)
// -------------------------------
fastify.get('/api/v1/secure/ping', {
  preHandler: [fastify.authenticate]
}, async (req, reply) => {
  return { msg: "Secure route OK" };
});

// ─── THE GOD'S EYE (LIVE_PULSE DATACONTRACT V32) ───
// LIVE STATE (tek gerçek kaynak)
let state = {
  activeGuests: 120,
  revenue: 8200,
  revenueForecast: 11000,
  conversionRate: 0.17,
  aureliaStatus: "IDLE",
  systemFriction: 12 // Başlangıç sürtünme skoru
};

// SIMULATION / REAL DATA HOOK (1500ms deterministic pulse)
setInterval(() => {
  // Misafir simülasyonu
  state.activeGuests += Math.floor(Math.random() * 5 - 2);
  if (state.activeGuests < 50) state.activeGuests = 50;
  
  // Gelir simülasyonu
  state.revenue += Math.floor(Math.random() * 200);
  state.revenueForecast = state.revenue * 1.3;

  // 💎 SÜRTÜNME & RAGE CLICK (Friction Engine) Simülasyonu (God's Eye EKG için)
  // Sürtünme aniden fırlayabilir.
  let rageClicks = 0;
  if (Math.random() > 0.8) {
      state.systemFriction += Math.floor(Math.random() * 25);
      if (Math.random() > 0.5) rageClicks = Math.floor(Math.random() * 5) + 3; // 3-7 rage clicks
  } else {
      state.systemFriction = Math.max(0, state.systemFriction - 5); // Decay
  }

  // 💎 OTLP TELEMETRY BUCKET SIMULATION (Dwell Time)
  const averageDwellBucket = state.systemFriction > 50 ? ">60s (Absorbed)" : "15s-60s (Read)";

  const payload = {
    type: "LIVE_PULSE",
    timestamp: Date.now(),
    metrics: {
      activeGuests: state.activeGuests,
      revenue: state.revenue,
      revenueForecast: state.revenueForecast,
      conversionRate: state.conversionRate
    },
    telemetry: {
      systemFriction: state.systemFriction,
      rageClicksDetected: rageClicks > 0 ? rageClicks : 0,
      averageDwellBucket: averageDwellBucket,
      errorRatePct: (state.systemFriction * 0.05).toFixed(2)
    },
    aurelia: {
      status: state.aureliaStatus,
      confidence: 0.92,
      lastIntent: lastIntent,
      lastHeardText: lastHeardText
    }
  };

  const message = JSON.stringify(payload);

  for (const client of godModeClients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(message);
    }
  }

}, 1500);

// MUST BE REGISTERED LAST! Serve frontend static files (Avoids intercepting API routes)
fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../../'),
    prefix: '/', 
});

const start = async () => {
    try {
        const PORT = process.env.PORT || 8080;
        await fastify.listen({ port: PORT, host: '::' });
        console.log(`\n🍷 [OMNIVERSE FASTIFY GATEWAY] Native WS Active on http://localhost:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
