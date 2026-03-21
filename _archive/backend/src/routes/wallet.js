const passkitService = require('../services/passkit-service');

async function walletRoutes(fastify, options) {
    fastify.post('/pass', async (req, reply) => {
        // Log the incoming Phygital conversion intent
        fastify.log.info(`[Phygital Bridge] Generating Sovereign Pass for guest.`);
        
        const intentData = req.body || { tier: 'APEX', intent: 'Hammam' };
        
        const passBuffer = await passkitService.generateSovereignPass(intentData);
        
        reply.header('Content-Type', 'application/vnd.apple.pkpass');
        reply.header('Content-Disposition', 'attachment; filename="sovereign-pass.pkpass"');
        
        return reply.send(passBuffer);
    });
}

module.exports = walletRoutes;
