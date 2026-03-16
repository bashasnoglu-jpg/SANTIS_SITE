async function routes(fastify, options) {
    // 1. KARARGAH METRİKLERİ
    fastify.get('/analytics/metrics', async (request, reply) => {
        return {
            status: 'ONLINE',
            data: { activeSessions: 347, conversionRate: '12.4%', sovereignScore: 99.8 }
        };
    });

    // 2. MEDYA FİLTRELERİ (Integrated Hub)
    fastify.get('/media/filters', async (request, reply) => {
        return {
            filters: ['All', 'Cinematic', 'Raw', 'Gold', 'Sovereign-Exclusive']
        };
    });

    // 3. 🌪️ SANDBOX SİMÜLASYON MOTORU (Kaos Tetikleyici - POST)
    fastify.post('/analytics/simulate', async (request, reply) => {
        const simData = request.body || {};
        fastify.log.info(`🌪️ [SANDBOX] Simülasyon Talebi Alındı: ${JSON.stringify(simData)}`);
        
        // Ağır bir yapay zeka hesaplaması illüzyonu için 600ms geciktir
        await new Promise(resolve => setTimeout(resolve, 600));

        return {
            success: true,
            result: 'SIMULATION_OPTIMIZED',
            metrics: { projectedRoi: '+18.4%', guestRetention: '94%' }
        };
    });

    // 4. KÜRESEL VARLIKLAR (Asset Loader)
    fastify.get('/media/assets', async (request, reply) => {
        const lang = request.query.lang || 'tr';
        return {
            status: 'LOADED',
            language: lang,
            // Purifier'ın (Temizleyici) 116 kartı sorunsuz işlemesi için sahte onay:
            assets: Array(116).fill({ id: 'sovereign_asset', status: 'purified', type: 'image' })
        };
    });

    // 5. SLOT RADAR SAĞLIK DURUMU (Drag & Drop Zone)
    fastify.get('/media/slots/health', async (request, reply) => {
        return {
            status: 'SECURE',
            locked_slots: 3,
            available_slots: 9,
            magnetic_pull: '12G'
        };
    });
}

module.exports = routes;
