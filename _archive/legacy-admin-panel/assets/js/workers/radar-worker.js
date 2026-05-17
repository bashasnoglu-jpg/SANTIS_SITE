/**
 * SANTIS WORKER FABRIC: Legacy Radar Port (Phase 7)
 */

let simulationInterval = null;
const particleCount = 1500; // Legacy used 1500 points
let particles = new Float32Array(particleCount * 3); // x, y, size
let activeTargets = [];

for (let i = 0; i < particleCount; i++) {
    particles[i * 3]     = Math.random() * 800; // x
    particles[i * 3 + 1] = Math.random() * 800; // y
    particles[i * 3 + 2] = Math.random() * 2 + 1; // size
}

self.onmessage = function(e) {
    if (e.data.type === "START") {
        if (!simulationInterval) {
            console.log("🟢 [Radar Worker] Booting Thread...");
            simulationInterval = setInterval(runSimulation, 33); // Strict 30FPS ~33ms
        }
    } else if (e.data.type === "STOP") {
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
            console.log("🔴 [Radar Worker] Thread Killed.");
        }
    }
};

function runSimulation() {
    activeTargets = [];
    
    // Math loop on worker instead of UI thread!
    for (let i = 0; i < particleCount; i++) {
        // Orbit shift
        particles[i * 3] += (Math.random() - 0.5) * 4;
        particles[i * 3 + 1] += (Math.random() - 0.5) * 4;
        
        // Boundaries
        if(particles[i * 3] > 800) particles[i * 3] = 0;
        if(particles[i * 3] < 0) particles[i * 3] = 800;
        if(particles[i * 3 + 1] > 800) particles[i * 3 + 1] = 0;
        if(particles[i * 3 + 1] < 0) particles[i * 3 + 1] = 800;

        // Spot target logic
        if (Math.random() > 0.998) {
            activeTargets.push({ id: 'NODE_' + i });
        }
    }
    
    // Max 10 display targets
    if (activeTargets.length > 10) {
        activeTargets = activeTargets.slice(0, 10);
    }
    
    const clonedBuffer = particles.slice().buffer;
    
    self.postMessage({
        type: "RADAR_TICK",
        particles: clonedBuffer,
        targets: activeTargets
    }, [clonedBuffer]); // Zero-copy transfer
}
