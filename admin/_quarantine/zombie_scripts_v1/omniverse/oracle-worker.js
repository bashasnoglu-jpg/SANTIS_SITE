/**
 * ========================================================================
 * ORACLE WORKER — Off-Thread Spatial Hash Gravity Simulation
 * ========================================================================
 * Bu dosya Web Worker olarak çalışır. Main Thread'i ASLA bloklamaz.
 * 50.000 botu arka planda simüle eder, sonuçları ana ekrana geri fırlatır.
 * 
 * Protocol:
 *   Main → Worker: { cmd: 'simulate', cards: [...], config: {...} }
 *   Worker → Main: { cmd: 'result', heatmap: [...], stats: {...} }
 *   Worker → Main: { cmd: 'progress', percent: 0-100 }
 */

// ── SPATIAL HASH GRID (O(n) Performance) ──
const CELL_SIZE = 200;
let grid = new Map();

function gridKey(col, row) { return (col << 16) | row; }

function buildGrid(cards) {
    grid = new Map();
    for (const card of cards) {
        const cx = Math.floor(card.x / CELL_SIZE);
        const cy = Math.floor(card.y / CELL_SIZE);
        // Insert into cell and 8 neighbors for seamless lookup
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = gridKey(cx + dx, cy + dy);
                if (!grid.has(key)) grid.set(key, []);
                grid.get(key).push(card);
            }
        }
    }
}

function queryGrid(x, y) {
    const key = gridKey(Math.floor(x / CELL_SIZE), Math.floor(y / CELL_SIZE));
    return grid.get(key) || [];
}

// ── PERSONA DISTRIBUTIONS ──
const PERSONAS = {
    vip:      { massAff: 1.8, speed: [1.5, 3],  entry: 'center',   fatigueMul: 0.3 },
    impulse:  { massAff: 0.8, speed: [3, 6],     entry: 'random',   fatigueMul: 0.8 },
    observer: { massAff: 1.0, speed: [1, 2.5],   entry: 'top-left', fatigueMul: 0.5 },
    bargain:  { massAff: 0.4, speed: [2, 4],     entry: 'top',      fatigueMul: 0.6 }
};

// ── SIMULATION CORE ──
function simulate(cards, config) {
    const {
        botCount = 10000,
        canvasWidth = 1200,
        canvasHeight = 800,
        distribution = { vip: 0.15, impulse: 0.25, observer: 0.40, bargain: 0.20 },
        fatigueThreshold = 150,
        G = 80,
        friction = 0.94,
        maxTicks = 600  // ~10 seconds at 60fps
    } = config;

    buildGrid(cards);

    // Initialize bots (SoA for cache efficiency)
    const bx = new Float32Array(botCount);
    const by = new Float32Array(botCount);
    const bvx = new Float32Array(botCount);
    const bvy = new Float32Array(botCount);
    const bfatigue = new Float32Array(botCount);
    const btype = new Uint8Array(botCount);   // 0=vip, 1=impulse, 2=observer, 3=bargain
    const bactive = new Uint8Array(botCount); // 1=active, 0=dead
    const bcapturedBy = new Int16Array(botCount).fill(-1);

    const types = Object.entries(distribution);
    
    for (let i = 0; i < botCount; i++) {
        // Pick persona
        let rand = Math.random();
        let pKey = 'observer', pIdx = 2;
        const typeKeys = ['vip', 'impulse', 'observer', 'bargain'];
        for (let t = 0; t < types.length; t++) {
            rand -= types[t][1];
            if (rand <= 0) { pKey = types[t][0]; pIdx = typeKeys.indexOf(pKey); break; }
        }
        const p = PERSONAS[pKey];

        // Entry position
        switch (p.entry) {
            case 'center':   bx[i] = canvasWidth*0.3 + Math.random()*canvasWidth*0.4; break;
            case 'top-left': bx[i] = Math.random()*canvasWidth*0.3; break;
            case 'random':   bx[i] = Math.random()*canvasWidth; break;
            default:         bx[i] = Math.random()*canvasWidth;
        }
        by[i] = Math.random() * -canvasHeight * 2;
        bvy[i] = p.speed[0] + Math.random() * (p.speed[1] - p.speed[0]);
        btype[i] = pIdx;
        bactive[i] = 1;
    }

    // Per-card heatmap accumulators
    const cardHits = new Float32Array(cards.length);
    const cardConversions = new Uint32Array(cards.length);
    let totalConverted = 0, totalBounced = 0, totalEnergy = 0;

    const massAffinities = [1.8, 0.8, 1.0, 0.4]; // vip, impulse, observer, bargain
    const fatigueMuls = [0.3, 0.8, 0.5, 0.6];

    // ── TICK LOOP ──
    for (let tick = 0; tick < maxTicks; tick++) {
        for (let i = 0; i < botCount; i++) {
            if (!bactive[i]) continue;

            // Off-screen = bounced
            if (by[i] > canvasHeight + 100 || bx[i] < -200 || bx[i] > canvasWidth + 200) {
                bactive[i] = 0;
                totalBounced++;
                continue;
            }

            // Fatigue check
            if (bfatigue[i] > fatigueThreshold) {
                bactive[i] = 0;
                totalBounced++;
                continue;
            }

            // Query nearby cards via spatial hash
            const nearby = queryGrid(bx[i], by[i]);
            let bestPull = 0, tdx = 0, tdy = 0, captureIdx = -1;
            const mAff = massAffinities[btype[i]];
            const fMul = fatigueMuls[btype[i]];

            for (let j = 0; j < nearby.length; j++) {
                const c = nearby[j];
                const dx = c.x - bx[i];
                const dy = c.y - by[i];
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq) || 10;

                // Event horizon capture
                const eventHorizon = (c.mass || 50) * 0.4;
                if (dist < eventHorizon) {
                    captureIdx = c._idx;
                    break;
                }

                // Gravity pull
                const pull = (G * (c.mass || 50) * mAff) / (distSq + 100);
                
                // Fatigue: being near but not converting costs energy
                if (distSq < 40000 && distSq > 2000) {
                    bfatigue[i] += fMul;
                    totalEnergy += fMul;
                }

                // Heatmap proximity tracking
                if (distSq < 60000) {
                    cardHits[c._idx] += 0.01;
                }

                if (pull > bestPull) {
                    bestPull = pull;
                    tdx = dx; tdy = dy;
                }
            }

            if (captureIdx >= 0) {
                bactive[i] = 0;
                bcapturedBy[i] = captureIdx;
                cardConversions[captureIdx]++;
                totalConverted++;
                continue;
            }

            // Apply gravity
            if (bestPull > 0) {
                const dist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
                bvx[i] += (tdx / dist) * bestPull;
                bvy[i] += (tdy / dist) * bestPull;
            }

            // Observer F-Pattern drift
            if (btype[i] === 2) bvx[i] += 0.05;

            // Friction
            bvx[i] *= friction;
            bvy[i] *= friction;
            bx[i] += bvx[i];
            by[i] += bvy[i];
        }

        // Progress reporting every 60 ticks
        if (tick % 60 === 0) {
            self.postMessage({ cmd: 'progress', percent: Math.round((tick / maxTicks) * 100) });
        }
    }

    // ── BUILD RESULTS ──
    const heatmap = cards.map((c, idx) => ({
        cardId: c.id || idx,
        name: c.name || `Card ${idx}`,
        x: c.x, y: c.y,
        mass: c.mass,
        conversions: cardConversions[idx],
        heatIntensity: Math.min(cardHits[idx] / (botCount * 0.01), 1),
        cvr: botCount > 0 ? ((cardConversions[idx] / botCount) * 100).toFixed(2) : '0.00',
        revenue: cardConversions[idx] * (c.price || 0)
    }));

    const totalCVR = botCount > 0 ? ((totalConverted / botCount) * 100).toFixed(2) : '0.00';
    const totalRevenue = heatmap.reduce((s, h) => s + h.revenue, 0);

    return {
        heatmap,
        stats: {
            botCount,
            converted: totalConverted,
            bounced: totalBounced,
            cvr: totalCVR,
            totalRevenue,
            totalEnergyCost: Math.round(totalEnergy),
            ticksSimulated: maxTicks
        }
    };
}

// ── MESSAGE HANDLER ──
self.onmessage = function(e) {
    const { cmd, cards, config } = e.data;

    if (cmd === 'simulate') {
        // Tag cards with internal index
        const taggedCards = cards.map((c, i) => ({ ...c, _idx: i }));
        
        self.postMessage({ cmd: 'progress', percent: 0 });
        
        const result = simulate(taggedCards, config || {});
        
        self.postMessage({ cmd: 'result', ...result });
    }

    if (cmd === 'ping') {
        self.postMessage({ cmd: 'pong', version: 'oracle-worker-v3.0' });
    }
};
