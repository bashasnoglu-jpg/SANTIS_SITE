const redis = require('../db/chaos-engine');
const db = require('../db/titanium');

module.exports = async function (fastify, opts) {
    fastify.post('/ingest', async (request, reply) => {
        const payload = request.body || {};
        
        let score = 40 + Math.min(60, (payload.mouse_moves || 0) * 0.5);
        let intent = 'browsing';
        
        if (payload.hesitation_events && payload.hesitation_events.length > 0) {
            score += 20;
            intent = 'exit-risk';
        } else if (score > 70) {
            intent = 'high-intent';
        }

        const sessionId = payload.client_id || 'UNKNOWN';

        const radarData = {
            session: sessionId,
            page: payload.node_id || '/tr/',
            intent: intent,
            device: 'Desktop', // Can parse User-Agent for this later
            score: Math.floor(score),
            dwell: Math.floor(Math.random() * 60) + 10 // Mock dwell time for now based on telemetry pulses
        };

        // Cache the profile temporarily in Memory (Redis) with 1h TTL
        try {
            await redis.set(`session_data:${sessionId}`, JSON.stringify(radarData), 'EX', 3600);
        } catch (e) {
            fastify.log.error(`[Chaos Engine] Redis cache failed for ${sessionId}`);
        }

        // Broadcast to God Mode immediately via Native WebSocket
        if (fastify.broadcastToGodMode) {
            fastify.broadcastToGodMode(radarData);
        }

        if (intent === 'exit-risk') {
            return {
                success: true, 
                vip_intervention: true, 
                offer: "Sizi kaybetmek istemeyiz. Lüks deneyiminiz için özel bir Concierge indirimi tanımladık.",
                reason: "Hesitation Detected via Tachyonic Bridge"
            };
        }

        return { success: true, status: 'Ingested to Tachyonic Bridge' };
    });

    fastify.post('/beacon', async (request, reply) => {
        const payload = request.body || {};
        const sessionId = payload.client_id || 'UNKNOWN';
        
        // Log basic beacon flushes
        fastify.log.info(`[Neural Beacon] Flushed data for session: ${sessionId}`);

        // We can simply acknowledge the flush to stop the 404 errors.
        return { success: true, status: 'Beacon Received' };
    });

    fastify.post('/aurelia-mock', async (request, reply) => {
        const payload = request.body || {};
        const sessionId = payload.session_id || payload.client_id || 'UNKNOWN';
        const reason = payload.reason || "Hesitation detected via Aurelia";

        // Log the Exit-Intent strike persistently to PostgreSQL
        try {
            await db.query(`
                INSERT INTO aurelia_strikes (session_id, action, reason, revenue_saved_eur) 
                VALUES ($1, $2, $3, $4)
            `, [sessionId, 'VIP_INTERVENTION', reason, 450]);
            fastify.log.info(`[Titanium] Aurelia Strike logged for session: ${sessionId}`);
        } catch (e) {
            fastify.log.error(`[Titanium] Core DB insert failed for Aurelia strike:`, e);
        }

        // Broadcast Aurelia's strike visually to the Radar
        if (fastify.broadcastToGodMode) {
            fastify.broadcastToGodMode({
                type: 'AURELIA_STRIKE',
                payload: {
                    target: sessionId,
                    action: 'VIP_INTERVENTION',
                    message: reason
                }
            });
        }
        
        return { 
            success: true, 
            vip_intervention: true, 
            offer: "Aurelia sensed your hesitation. As a gesture of our commitment to your wellness, we have unlocked a complimentary 15-minute Sovereign Cranial Massage upgrade for any ritual booked today.",
            reason: reason
        };
    });

    // 6. 🐺 AURELIA AI İSTİHBARAT KANALI (Av Raporu - V18 Apex Trap)
    fastify.post('/aurelia/capture', async (request, reply) => {
        const huntData = request.body || {};
        
        fastify.log.info(`\n======================================================`);
        fastify.log.info(`💥 [AURELIA RAPORU] AV DÜŞTÜ!`);
        fastify.log.info(`🎯 ID: ${huntData.huntId} | Çekim Kuvveti: ${huntData.vectorSpeed}`);
        fastify.log.info(`💰 Masadaki Değer: ${huntData.value}€ | Konum: ${huntData.location}`);
        fastify.log.info(`======================================================\n`);
        
        // Log to Data Vault
        try {
            await db.query(`
                INSERT INTO aurelia_strikes (session_id, action, reason, revenue_saved_eur) 
                VALUES ($1, $2, $3, $4)
            `, [huntData.huntId, 'KILL_CONFIRMED', huntData.location, huntData.value]);
        } catch (e) {
            fastify.log.error(`[Titanium] Core DB insert failed for Aurelia capture:`, e);
        }

        // Karargah (God's Eye) arayüzüne WebSocket üzerinden CANLI ŞOK DALGASI gönder
        if (fastify.broadcastToGodMode) {
            fastify.broadcastToGodMode({
                type: 'AURELIA_KILL_CONFIRMED',
                data: huntData
            });
        }

        return { status: 'HUNT_REGISTERED', hq_notified: true };
    });
};
