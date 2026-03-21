/**
 * SANTIS OMNIVERSE: Analytics Authority API Route
 * Handles intent velocity tracking and system yield mapping.
 */

// Global Intent Memory (Memory-Mühürleme)
global.SANTIS_INTENT_MEMORY = global.SANTIS_INTENT_MEMORY || {};

async function routes(fastify, options) {
    fastify.post('/intent', async (request, reply) => {
        const payload = request.body || {};
        const sessionId = request.ip || 'guest_v1';
        
        // Mühürle
        if (!global.SANTIS_INTENT_MEMORY[sessionId]) {
            global.SANTIS_INTENT_MEMORY[sessionId] = { scores: {}, lastPath: null };
        }
        
        let memory = global.SANTIS_INTENT_MEMORY[sessionId];
        
        if (payload.path) memory.lastPath = payload.path;
        if (payload.intentType) {
            memory.scores[payload.intentType] = (memory.scores[payload.intentType] || 0) + (payload.duration || 1);
        }

        fastify.log.info(`[INTENT RADAR] Signal captured for ${sessionId} -> Type: ${payload.intentType}`);
        
        return { 
            status: "success", 
            action: "LOGGED",
            feedback_loop: {
                velocity_score: memory.scores[payload.intentType] || 0,
                memory_state: memory
            }
        };
    });
}

module.exports = routes;
