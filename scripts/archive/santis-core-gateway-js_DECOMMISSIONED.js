import { createServer } from 'http';
import fs from 'node:fs';
process.on('uncaughtException', err => fs.writeFileSync('gateway-crash.log', String(err.stack || err)));
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { ConstitutionalGuard } from './core/adapter.ts';
import { PriceController } from './core/price-controller.ts';
import advisoryStoreModule from './core/advisory-store.js';
import {
    MessageOrigin,
    MessageType,
    SOVEREIGN_SCHEMA_VERSION,
    SovereignSubject,
} from './core/telemetry.ts';
import { URL } from 'node:url';
import { z } from 'zod';
import { buildConciergeSnapshot } from './core/concierge/resolvers/build-concierge-snapshot.ts';
import { getConciergeHealth } from './core/concierge/health/concierge.health.ts';
import { pushToSink } from './core/telemetry/sovereign-bq-sink.ts';

const emptyToUndefined = (v) => (v === '' ? undefined : v);

const SnapshotQuerySchema = z.object({
  tenantId: z.string().min(1),
  locale: z.preprocess(emptyToUndefined, z.string().default('tr')),
  currency: z.preprocess(emptyToUndefined, z.enum(['EUR']).default('EUR')),
  date: z.preprocess(emptyToUndefined, z.string().optional()),
  partySize: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(1)),
  memberTier: z.preprocess(emptyToUndefined, z.enum(['none', 'silver', 'gold', 'black']).optional()),
  source: z.preprocess(emptyToUndefined, z.enum(['direct', 'hotel', 'concierge', 'campaign']).optional()),
});

const PORT = process.env.PORT || 4040;
const server = createServer();
const wss = new WebSocketServer({ server });
const { AdvisoryStore } = advisoryStoreModule;

PriceController.init();

const activeAdmins = new Set();
const activeGhosts = new Map();

// --- RATE LIMITER KURULUMU (Sessiz Lüks Kalkanı) ---
const ipRateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 dakika
const MAX_REQUESTS_PER_WINDOW = 5; // Dakikada maksimum 5 fısıltı

function isRateLimited(ip) {
    if (!ip) return false;
    
    const now = Date.now();
    const record = ipRateLimits.get(ip);

    if (!record) {
        ipRateLimits.set(ip, { count: 1, timestamp: now });
        return false;
    }

    if (now - record.timestamp > RATE_LIMIT_WINDOW_MS) {
        // Zaman penceresi dolduysa sıfırla
        ipRateLimits.set(ip, { count: 1, timestamp: now });
        return false;
    }

    record.count++;
    if (record.count > MAX_REQUESTS_PER_WINDOW) {
        return true; // Kalkan devreye girdi
    }

    return false;
}

// --- RING BUFFER KURULUMU (Cold Boot State) ---
const MAX_BUFFER_SIZE = 50;
let recentAnomalies = []; // Hafızada tutulacak son 50 log

function addAnomalyToBuffer(anomalyData) {
    if (recentAnomalies.length >= MAX_BUFFER_SIZE) {
        recentAnomalies.shift(); 
    }
    recentAnomalies.push(anomalyData);
}

function toOptionalString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
}

function sendPacket(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    }
}

function broadcastEnvelope(envelope) {
    const serialized = JSON.stringify(envelope);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(serialized);
        }
    });
}

// 🔥 SOVEREIGN OTONOM SMOKE TEST (V3.8 Rollout Worker)
setInterval(() => {
    const risk = Math.random(); // Risk deltasını simüle ediyoruz
    const payload = {
        isActive: risk <= 0.5,
        percentage: 10,
        riskDelta: risk > 0.5 ? `+${risk.toFixed(2)}` : `+${(risk * 0.4).toFixed(2)}`,
        status: risk > 0.5 ? 'rolling_back' : 'stable',
        timestamp: Date.now()
    };

    // 0. Halka Tampona (Ring Buffer) Ekle (Cold Boot İçin)
    addAnomalyToBuffer(payload);

    // 1. Zero-Latency Sink'e akıt (BigQuery Simülatörü)
    pushToSink(payload);

    // 2. Nöral Köprü'ye (Frontend) zarifçe fırlat
    broadcastEnvelope({
        id: randomUUID(),
        type: MessageType.EVENT,
        payload: {
            subject: 'ROLLOUT_STATUS',
            action: 'STATUS_UPDATE',
            data: payload
        }
    });
}, 3000);

function buildPriceAdjustedEnvelope(commandEnvelope, overrideEntry) {
    return {
        id: randomUUID(),
        type: MessageType.EVENT,
        tracking: {
            correlationId: commandEnvelope.tracking?.correlationId ?? commandEnvelope.id,
            causationId: commandEnvelope.id,
        },
        payload: {
            timestamp: Date.now(),
            version: SOVEREIGN_SCHEMA_VERSION,
            origin: MessageOrigin.NODE_ORCHESTRATOR,
            subject: SovereignSubject.REVENUE,
            action: 'PRICE_ADJUSTED',
            ritualId: overrideEntry.canonicalRitualId,
            requestedRitualId: overrideEntry.requestedRitualId !== overrideEntry.canonicalRitualId
                ? overrideEntry.requestedRitualId
                : undefined,
            affectedRitualIds: overrideEntry.affectedRitualIds,
            ritualTitle: overrideEntry.ritualTitle,
            ritualCategory: overrideEntry.ritualCategory,
            previousPrice: overrideEntry.previousPrice,
            newPrice: overrideEntry.effectivePrice,
            multiplier: overrideEntry.multiplier,
            currency: overrideEntry.currency,
            tenantId: overrideEntry.tenantId,
            metadata: {
                source: overrideEntry.source,
                origin: overrideEntry.origin,
            },
        },
    };
}

function handleAdjustPriceCommand(envelop, ws) {
    const payload = envelop.payload;

    try {
        const overrideEntry = PriceController.applyOverride({
            ritualId: payload.ritualId,
            multiplier: payload.multiplier,
            tenantId: payload.tenantId,
            source: toOptionalString(payload.metadata?.source),
            origin: payload.origin,
            correlationId: envelop.id,
        });

        const eventEnvelope = ConstitutionalGuard.sanitize(
            buildPriceAdjustedEnvelope(envelop, overrideEntry)
        );

        if (!eventEnvelope || eventEnvelope.type !== MessageType.EVENT) {
            throw new Error('PRICE_ADJUSTED_CONSTITUTIONAL_VIOLATION');
        }

        broadcastEnvelope(eventEnvelope);
        AdvisoryStore?.removeByActionId?.(payload.metadata?.actionId);

        console.log(
            `[SOVEREIGN_COMMAND]: Price adjusted for ${overrideEntry.canonicalRitualId} -> €${overrideEntry.effectivePrice}`
        );

        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'UNKNOWN_COMMAND_FAILURE';

        console.error(`[SOVEREIGN_COMMAND]: ADJUST_PRICE rejected. ${message}`);
        sendPacket(ws, {
            type: 'COMMAND_REJECTED',
            payload: {
                action: 'ADJUST_PRICE',
                reason: message,
                ritualId: payload.ritualId,
                timestamp: Date.now(),
            },
        });

        return false;
    }
}

wss.on('connection', (ws, req) => {
    // 1. IP İstihbaratı
    const ip = req.socket.remoteAddress;
    console.log(`[GATEWAY] Yeni Sinyal Yakalandı: ${ip}`);

    ws.isAlive = true;
    ws.role = 'UNKNOWN';

    // Ham 'message' olayını anayasal süzgece (Constitutional Guard) sarmalıyoruz
    ConstitutionalGuard.wrapEmitter(ws, 'message', (envelop) => {
        /**
         * Buraya ulaşıldıysa veri %100 VALIDATED demektir.
         * Mühür: SovereignEnvelope
         */
        const { subject, action } = envelop.payload;
        const origin = envelop.payload.origin;

        console.log(`[CONSTITUTIONAL_FLOW]: Accepted ${action} from ${origin} on Subject ${subject}`);

        // 1. İşlem: Veriyi çekirdek mantığına (Core Logic) yönlendir
        handleSovereignAction(envelop, ws, ip, activeAdmins, activeGhosts);
    });

    ws.on('close', () => {
        // Sprint C: Onurlu Ölüm (Graceful Teardown) mekanizması buraya gelecek
        if (ws.role === 'ADMIN') activeAdmins.delete(ws);
        if (ws.role === 'GHOST') activeGhosts.delete(ws.visitorId);
        console.log(`[GATEWAY]: Node disconnected gracefully. Role: ${ws.role} (${ip})`);
    });
});

/**
 * Bu fonksiyon artık sadece mühürlü veri (Envelope) kabul eder.
 * Mimarinin dış katmanlarından tamamen izole edilmiştir.
 * @param {import('./core/telemetry.ts').SovereignEnvelope} envelop 
 */
function handleSovereignAction(envelop, ws, ip, activeAdmins, activeGhosts) {
    const payload = envelop.payload;

    if (
        envelop.type === MessageType.COMMAND &&
        payload.subject === SovereignSubject.REVENUE &&
        payload.action === 'ADJUST_PRICE'
    ) {
        handleAdjustPriceCommand(envelop, ws);
        return;
    }
    
    switch (payload.subject) {
        case "SYSTEM_INTEGRITY":
            console.log("[GATEWAY_LOGIC]: Processing System Integrity envelope.");
            // Örnek: Eskiden AUTH ile yapılan rol atamaları artık bu tip altında ele alınabilir.
            break;
        case "QUANTUM_UI":
            // UI senkronizasyon mantığı
            console.log("[GATEWAY_LOGIC]: Dispatching quantum UI state.");
            break;
        case "AUTONOMOUS_CONTROL":
            // Python'dan gelen emirler (Command)
            console.log("[GATEWAY_LOGIC]: Processing autonomous command.");
            break;
        default:
            console.warn(`[GATEWAY_LOGIC]: Unhandled Subject [${payload.subject}] but Envelope is mathematically VALID.`);
    }

    // 2. İşlem: Mühürlü verinin (Envelope) diğer güvenilir node'lara (God's Eye vb.) yayılması
    // Eğer Ghost hücresiysek, raporlarımızı Admin Network'e zerk ediyoruz.
    if (ws.role === 'GHOST') {
        const validatedPulse = JSON.stringify(envelop);
        activeAdmins.forEach(admin => {
            if (admin.readyState === WebSocket.OPEN) { 
                admin.send(validatedPulse);
            }
        });
    }
}

/**
 * CONSTITUTIONAL BOUNDARY
 * This gateway may:
 * - route requests
 * - parse input
 * - set headers
 * - log output
 *
 * This gateway may NOT:
 * - rank services
 * - apply pricing policy
 * - map provider payloads
 * - implement commercial business rules
 */
server.on('request', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-santis-request-id');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;

    if (pathname === '/health' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, service: 'santis-core-gateway', now: new Date().toISOString() }));
        return;
    }

    if (pathname === '/api/v1/telemetry/recent' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        const reversedAnomalies = [...recentAnomalies].reverse();
        res.end(JSON.stringify({
            success: true,
            data: reversedAnomalies
        }));
        return;
    }

    if (pathname === '/api/concierge/health' && req.method === 'GET') {
        const rawHealth = getConciergeHealth();
        const health = {
            ok: rawHealth.ok,
            liveness: 'up',
            readiness: rawHealth.resolverLoaded ? 'ready' : 'degraded',
            checks: {
                resolverLoaded: rawHealth.resolverLoaded,
                serviceCatalogAdapter: rawHealth.adaptersLoaded.serviceCatalog,
                pricingAdapter: rawHealth.adaptersLoaded.pricing,
                availabilityAdapter: rawHealth.adaptersLoaded.availability
            },
            ...rawHealth
        };
        const payload = JSON.stringify(health);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(payload);
        return;
    }

    if (pathname === '/api/concierge/snapshot' && req.method === 'GET') {
        const requestStartedAt = Date.now();
        const fallbackRequestId = `concierge_${randomUUID()}`;
        let input;

        try {
            const queryObj = Object.fromEntries(reqUrl.searchParams.entries());
            input = SnapshotQuerySchema.parse(queryObj);
        } catch (error) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('x-santis-request-id', fallbackRequestId);
            res.setHeader('x-santis-degraded', '1');
            res.writeHead(400);

            const payload = JSON.stringify({
                error: 'BAD_CONCIERGE_SNAPSHOT_REQUEST',
                requestId: fallbackRequestId,
                message: error instanceof Error ? error.message : 'Invalid query parameters'
            });
            res.end(payload);
            return;
        }

        try {
            const snapshot = await buildConciergeSnapshot(input);
            const isDegraded = snapshot.warnings.length > 0 ? '1' : '0';
            const finalRequestId = snapshot.requestId || fallbackRequestId;
            
            // Explicit assertion of single request ID
            snapshot.requestId = finalRequestId;

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('x-santis-request-id', finalRequestId);
            res.setHeader('x-santis-degraded', isDegraded);
            res.writeHead(200);
            
            const payload = JSON.stringify(snapshot);
            res.end(payload);

            console.log('[concierge.snapshot]', {
                requestId: finalRequestId,
                tenantId: input.tenantId,
                partySize: input.partySize,
                degraded: isDegraded,
                warningCodes: snapshot.warnings.map(w => w.code),
                statusCode: 200,
                responseTimeMs: Date.now() - requestStartedAt,
            });
        } catch (error) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('x-santis-request-id', fallbackRequestId);
            res.setHeader('x-santis-degraded', '1');
            res.writeHead(500);

            const message = error instanceof Error ? error.message : 'Internal Server Error';
            const payload = JSON.stringify({
                error: 'CONCIERGE_SNAPSHOT_FAILURE',
                requestId: fallbackRequestId,
                message
            });
            res.end(payload);

            console.error('[concierge.snapshot] failed', {
                requestId: fallbackRequestId,
                error: message,
            });
        }
        return;
    }

    if (pathname === '/api/v1/telemetry/lead' && req.method === 'POST') {
        const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'];
        
        // Sessiz Kalkan Devrede: Bot saldırısı varsa hissettirmeden 204 dön
        if (isRateLimited(clientIp)) {
            console.warn(`[SOVEREIGN SHIELD] Sessiz Kalkan devrede. Aşırı fısıltı yutuldu (IP: ${clientIp}).`);
            res.writeHead(204);
            res.end();
            return;
        }

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                const payload = {
                    isActive: true,
                    percentage: 100,
                    riskDelta: "+0.00",
                    status: data.type === "VIP_LEAD" ? "vip_lead" : "lead",
                    message: data.message,
                    cartSize: data.cartSize,
                    timestamp: Date.now()
                };

                addAnomalyToBuffer(payload);
                pushToSink(payload);

                broadcastEnvelope({
                    id: randomUUID(),
                    type: MessageType.EVENT,
                    payload: {
                        subject: 'LEAD_CONVERSION',
                        action: 'NEW_LEAD',
                        data: payload
                    }
                });

                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: "BAD_REQUEST" }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log(`[SOVEREIGN CORE] Telemetry Gateway Port ${PORT} Üzerinde Dinleniyor. Savaş Odası Hazır.`);
});
