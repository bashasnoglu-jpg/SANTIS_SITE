/**
 * SANTIS OMNIVERSE: Boardroom API Route
 * Suppresses frontend 404 errors by returning Sovereign mock data directly.
 */

async function routes(fastify, options) {
    // 1. /api/v1/boardroom/god-mode (Used by boardroom.html)
    fastify.get('/god-mode', async (request, reply) => {
        return [
            { id: 1, region: "Dubai", label: "Sovereign VIP", status: "SURGE", value: "€9,450", latency: "12ms", nodes: ["AE-DXB1"], trend: "UP" },
            { id: 2, region: "London", label: "Elite Tier", status: "STABLE", value: "€4,200", latency: "24ms", nodes: ["UK-LHR", "UK-CW"], trend: "STABLE" },
            { id: 3, region: "New York", label: "Apex Wellness", status: "WARNING", value: "€1,850", latency: "42ms", nodes: ["US-JFK"], trend: "DOWN" },
            { id: 4, region: "Monaco", label: "Royal Signature", status: "SURGE", value: "€12,500", latency: "8ms", nodes: ["MC-MON"], trend: "UP" },
            { id: 5, region: "Paris", label: "Aurelia Facial", status: "STABLE", value: "€3,100", latency: "18ms", nodes: ["FR-CDG"], trend: "UP" },
            { id: 6, region: "Istanbul", label: "Global Launch", status: "TEST", value: "€800", latency: "5ms", nodes: ["TR-IST1", "TR-IST2"], trend: "STABLE" },
            { id: 7, region: "Tokyo", label: "Zen Retreat", status: "SURGE", value: "€6,200", latency: "85ms", nodes: ["JP-HND"], trend: "UP" }
        ];
    });

    // 2. /api/v1/boardroom/data (Used by boardroom.js)
    fastify.get('/data', async (request, reply) => {
        return [
            { id: 1042, name: 'Premium SPA Reservation', price: 1250 },
            { id: 1043, name: 'Aurelia Skincare Package', price: 890 },
            { id: 1044, name: 'Gods Eye Subscription', price: 5000 },
            { id: 1045, name: 'Sovereign Wellness Retreat', price: 12000 }
        ];
    });
}

module.exports = routes;
