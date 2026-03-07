/**
 * SANTIS INTENT ENGINE (Web Worker)
 * Math is done here, far away from the Main Thread.
 */

// Memory Maps
const urlScores = new Map();
const recentHovers = new Map();
let currentGhostScore = 0;
let currentActiveUrl = "";

// Configuration
const CONFIDENCE_THRESHOLD = 75; // Out of 100
const PREFETCHED_URLS = new Set();
let intentBatchQueue = [];
let batchTimer = null;

// Weights (The Cognitive Equation)
const WEIGHTS = {
    DWELL: 0.35,
    GAZE: 0.20,
    VELOCITY: 0.25,
    GHOST_SCORE: 0.20
};

// Listen to Main Thread
self.onmessage = function (e) {
    const data = e.data;

    switch (data.type) {
        case 'INIT_CONTEXT':
            currentGhostScore = data.score;
            currentActiveUrl = data.currentUrl;
            startEngineLoop();
            break;
        case 'HOVER_START':
            recentHovers.set(data.url, data.ts);
            break;
        case 'HOVER_END':
            if (recentHovers.has(data.url)) {
                const dwellTime = data.ts - recentHovers.get(data.url);
                recentHovers.delete(data.url);
                // Convert to points (Max 100 base) - e.g. 500ms = 25pts, 2000ms = 100pts
                const dwellScore = Math.min(100, (dwellTime / 2000) * 100);
                updateTargetScore(data.url, dwellScore * WEIGHTS.DWELL);
            }
            break;
        case 'GAZE_HIT':
            // Eyeball hit is a flat boost
            updateTargetScore(data.url, 100 * WEIGHTS.GAZE);
            break;
        case 'MOUSE_VECTOR':
            // Phase 2: Vector Math (Simplified placeholder for V1)
            // Advanced implementations calculate angle towards known bounding boxes.
            // For now, we rely heavily on Hover and Gaze.
            break;
    }
};

function updateTargetScore(url, rawPoints) {
    if (url === currentActiveUrl) return; // Don't prefetch current page

    const existing = urlScores.get(url) || 0;

    // Ghost score adds a baseline multiplier to the whole session's intent
    const ghostMultiplier = 1 + ((currentGhostScore / 100) * WEIGHTS.GHOST_SCORE);

    const newScore = Math.min(100, existing + (rawPoints * ghostMultiplier));
    urlScores.set(url, newScore);

    checkConfidence(url, newScore);
}

function checkConfidence(url, score) {
    if (score >= CONFIDENCE_THRESHOLD && !PREFETCHED_URLS.has(url)) {
        PREFETCHED_URLS.add(url);

        // 1. Tell Main Thread to Execute Prefetch
        self.postMessage({
            action: 'PREFETCH_EXECUTE',
            url: url
        });

        // 2. Queue for Admin Pipeline
        queueForAdmin(url, score);
    }
}

// Batching to prevent DDoS on our own Backend
function queueForAdmin(url, score) {
    intentBatchQueue.push({
        target_url: url,
        confidence: Math.round(score),
        ts: Date.now()
    });

    // Send batch every 3 seconds if populated
    if (!batchTimer) {
        batchTimer = setTimeout(() => {
            self.postMessage({
                action: 'BATCH_TELEMETRY',
                batch: [...intentBatchQueue]
            });
            intentBatchQueue = []; // Clear
            batchTimer = null;
        }, 3000);
    }
}

// Cleanup loop to decay unused scores over time
function startEngineLoop() {
    setInterval(() => {
        urlScores.forEach((score, url) => {
            if (score > 0) {
                // Decay by 5 points every 5 seconds
                const newScore = Math.max(0, score - 5);
                urlScores.set(url, newScore);
            }
        });
    }, 5000);
}
