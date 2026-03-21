async function routes(fastify, options) {
    fastify.get('/forecast', async (request, reply) => {
        // Mocking sophisticated Revenue Oracle AI data (14 Days)
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        const today = new Date().getDay();
        
        const histLabels = [];
        const histData = [];
        for (let i = 6; i >= 0; i--) {
            histLabels.push(days[(today - i + 7) % 7]);
            histData.push(Math.floor(Math.random() * 2000) + 1200);
        }

        const foreLabels = [];
        const foreData = [];
        for (let i = 1; i <= 7; i++) {
            foreLabels.push(days[(today + i) % 7]);
            foreData.push(Math.floor(Math.random() * 3000) + 1500);
        }

        return {
            historical: { labels: histLabels, data: histData },
            forecast: { labels: foreLabels, data: foreData },
            insight: "Ghost Concierge %21.3 dönüşüm oranına ulaştı. Cuma ve Cumartesi günleri SPA kapasitesi dolmak üzere. x1.4 Surge fiyatlandırması (Scarcity) öneriliyor."
        };
    });
}

module.exports = routes;
