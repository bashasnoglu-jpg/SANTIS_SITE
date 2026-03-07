/**
 * Phase 61: Santis Brain Worker (Score Engine Offload)
 * Zero-Overhead Score Matrix Computation
 */

const MATRIX = {
    time_15s: 10,
    hover_deep: 15,
    scroll_25: 5,
    scroll_50: 10,
    scroll_75: 15,
    scroll_90: 20,
    card_view: 5,
    cta_click: 20,
    modal_open: 30,
    gallery_open: 15,
    hover_long: 8,
};

const RESCUE_THRESHOLD = 85;
const SURGE_THRESHOLD = 95;
const MAX_SAFE_SCORE = 100;

let state = {
    score: 0,
    rescueFired: false,
    surgeFired: false,
    persona: 'default'
};

onmessage = function (e) {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            state.score = payload.initialScore || 0;
            state.persona = payload.persona || 'default';
            // Sync initial state if it's already above thresholds
            if (state.score >= RESCUE_THRESHOLD) state.rescueFired = true;
            if (state.score >= SURGE_THRESHOLD) state.surgeFired = true;
            break;

        case 'ADD_SCORE':
            processScore(payload.eventKey, payload.extraPayload);
            break;

        case 'EXIT_INTENT':
            // Proxy exit intent evaluations
            if (state.score >= 85) {
                postMessage({ type: 'AURELIA_WAKEUP', score: state.score, trigger: 'exit_intent' });
            } else if (state.score >= RESCUE_THRESHOLD) {
                postMessage({ type: 'RESCUE_TRIGGER', score: state.score, trigger: 'exit_intent', persona: state.persona });
            }
            break;

        case 'CHECKOUT_INITIATED':
            console.log(`🧠 [SANTIS NEURO-WORKER] Vault Opened for Ritual: ${payload.ritualId}`);
            syncTelemetry('/api/v1/telemetry/checkout-start', payload);
            break;

        case 'SLOT_SELECTED':
            console.log(`🧠 [SANTIS NEURO-WORKER] Slot Locked: ${payload.time}`);
            syncTelemetry('/api/v1/telemetry/slot-selected', payload);
            break;

        case 'ORDER_FINALIZED':
            console.log(`🧠 [SANTIS NEURO-WORKER] Seal Forged. Session: ${payload.sessionId}`);
            syncTelemetry('/api/v1/telemetry/order-finalized', payload);
            break;

        case 'RESET':
            state.score = 0;
            state.rescueFired = false;
            state.surgeFired = false;
            postMessage({ type: 'SCORE_UPDATE', score: 0, delta: 0, action: 'reset', prev: 0, extraPayload: {} });
            break;
    }
};

// Arka planda sessizce beacon veya fetch ile veriyi gönder
async function syncTelemetry(endpoint, data) {
    try {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, blob);
        } else {
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true
            });
        }
    } catch (error) {
        console.error('[Worker Telemetry Error]', error);
    }
}

function processScore(eventKey, extraPayload) {
    const delta = MATRIX[eventKey];
    if (delta === undefined) return;

    const prev = state.score;
    state.score = Math.max(0, Math.min(MAX_SAFE_SCORE, state.score + delta));

    // Broadcast computed score update
    postMessage({
        type: 'SCORE_UPDATE',
        score: state.score,
        delta: delta,
        action: eventKey,
        prev: prev,
        extraPayload: extraPayload || {}
    });

    // Threshold Analysis
    if (!state.rescueFired && state.score >= RESCUE_THRESHOLD) {
        state.rescueFired = true;
        postMessage({ type: 'RESCUE_HIT', score: state.score });
    }

    if (!state.surgeFired && state.score >= SURGE_THRESHOLD) {
        state.surgeFired = true;
        postMessage({ type: 'SURGE_HIT', score: state.score, multiplier: 1.15 });
    }
}
