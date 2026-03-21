/**
 * SANTIS OMNIVERSE: Media Authority API Route
 * Handles visual slots, UI prompts, asset mapping, and God Mode SSE.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Live God Mode Pulse Connections
const pulseClients = new Set();

async function routes(fastify, options) {
    fastify.get('/slot-routes', async (request, reply) => {
        return [
            { id: 1, name: "Sovereign Hero Component", location: "index.html", slot: "hero_main", active: true },
            { id: 2, name: "Aurelia Facial Feature", location: "cilt-bakimi/index.html", slot: "feature_1", active: true },
            { id: 3, name: "Sultan Ritual Grid", location: "rituals/sultan.html", slot: "gallery", active: true }
        ];
    });

    fastify.get('/filters', async (request, reply) => {
        return {
            categories: ["hamam", "masaj", "cilt", "diger"],
            slots: ["hero_main", "feature_1", "gallery"]
        };
    });

    fastify.get('/assets', async (request, reply) => {
        // Return blank or mock for Matrix Engine test
        return { assets: [] };
    });

    fastify.get('/pulse', (request, reply) => {
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const heartbeat = setInterval(() => {
            reply.raw.write(': heartbeat\n\n');
        }, 15000);

        pulseClients.add(reply.raw);

        request.raw.on('close', () => {
            clearInterval(heartbeat);
            pulseClients.delete(reply.raw);
        });

        // Hijack the fastify lifecycle so it does not auto-close the stream
        reply.hijack();
    });

    fastify.post('/upload', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) return reply.code(400).send({ detail: 'No file provided' });

            const asset_id = crypto.randomBytes(16).toString('hex');
            
            // Read stream into memory to avoid Hanging Streams warning
            await data.toBuffer();

            // Fire and forget: Simulate Neural Tagging & DNA Extraction
            setTimeout(() => {
                const payload = JSON.stringify({
                    id: asset_id,
                    sas_score: (0.8 + Math.random() * 0.18).toFixed(2), // Sovereign Aesthetic Score
                    category: 'diger',
                    status: 'active'
                });
                for (const client of pulseClients) {
                    client.write(`event: DNA_EXTRACTED\ndata: ${payload}\n\n`);
                }
            }, 3000);

            return reply.send({ 
                status: "SCANNING", 
                asset_id: asset_id, 
                file_url: `/assets/uploads/${data.filename}` 
            });
        } catch (e) {
            fastify.log.error(e);
            return reply.code(500).send({ detail: e.message });
        }
    });
}

module.exports = routes;
