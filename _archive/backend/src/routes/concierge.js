/**
 * SANTIS OMNIVERSE: Concierge Authority API Route
 * Handles Sovereign Concierge automated merchant engine logic and intelligence routing.
 */

async function routes(fastify, options) {
    fastify.get('/suggestions', async (request, reply) => {
        const sessionId = request.ip || 'guest_v1';
        const memory = global.SANTIS_INTENT_MEMORY && global.SANTIS_INTENT_MEMORY[sessionId] 
                       ? global.SANTIS_INTENT_MEMORY[sessionId] 
                       : { scores: {}, lastPath: null };
        
        // Default Lüks Öneri
        let recommendations = [
            { 
                id: "santis_rec_default", 
                title: "Sultan Ritüeli", 
                description: "Hamam ve Masajın kusursuz birleşimi ile arının.", 
                image: "/assets/img/cards/santis_card_hammam_lux.webp", 
                price: "120 €",
                url: "/tr/rituals/sultan-ritueli-paketi.html" 
            }
        ];

        // Niyet Analizine Göre AI Tahmini
        const topIntent = Object.keys(memory.scores).sort((a,b) => memory.scores[b] - memory.scores[a])[0];

        if (topIntent === 'masaj') {
            recommendations = [{
                id: "santis_rec_masaj_upgrade", 
                title: "Okyanus Mineralli Cilt Bakımı", 
                description: "Masaj sonrası cildinize parlaklık katacak Sothys özel kürü.", 
                image: "/assets/img/cards/santis_card_skincare_v1.webp", 
                price: "60 €",
                url: "/tr/cilt-bakimi/index.html"
            }];
        } else if (topIntent === 'hamam') {
            recommendations = [{
                id: "santis_rec_hamam_upgrade", 
                title: "Aroma Terapi Masajı", 
                description: "Hamamda açılan gözeneklerinizden emilen organik yağlarla derin gevşeme.", 
                image: "/assets/img/cards/santis_card_massage_v2.webp", 
                price: "70 €",
                url: "/tr/masajlar/bali-aroma-masaji.html"
            }];
        }

        return {
            status: "active",
            source: topIntent ? "AI_INTENT_MATCH" : "COLD_START",
            recommendations: recommendations
        };
    });
    
    fastify.post('/suggestions', async (request, reply) => {
        const userContext = request.body || {};
        return {
            status: "success",
            action: "SUGGESTION_TAILORED",
            context: userContext
        };
    });
}

module.exports = routes;
