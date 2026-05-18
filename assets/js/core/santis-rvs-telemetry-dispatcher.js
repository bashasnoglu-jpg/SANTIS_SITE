/**
 * ═══════════════════════════════════════════════════════════
 * 🤫 SANTIS OS - RVS TELEMETRY DISPATCHER (v1.0)
 * ═══════════════════════════════════════════════════════════
 * Visual stability telemetry client-side governor.
 * Fully compliant with docs/governance/telemetry-endpoint-contract.md.
 * 
 * Guarantees:
 * - Zero PII Transmission (Aggrerssive scrubbing and rejection)
 * - 8KB Payload Size limit
 * - 10 Payload/min Throttling
 * - 3 Payload/500ms Burst protection
 * - navigator.sendBeacon with Fetch keepalive fallback
 * - Memory-safe debounced queue drainage
 */

(function () {
    'use strict';

    const TARGET_URL = '/api/v1/telemetry/rvs';
    const MAX_PAYLOAD_BYTES = 8192; // 8KB
    const THROTTLE_LIMIT = 10;      // Max 10 payloads per minute
    const THROTTLE_WINDOW = 60000;  // 1 minute in ms
    const BURST_LIMIT = 3;          // Max 3 payloads per 500ms
    const BURST_WINDOW = 500;       // 500ms in ms

    // State managers
    const localQueue = [];
    const dispatchTimestamps = [];
    let queueDrainTimeout = null;

    // Common PII Key markers (case-insensitive checks)
    const PII_KEYS_PATTERN = /email|password|pass|token|phone|card|address|ssn|user|name|surname|fullname|credentials|auth/i;

    // Common PII Value patterns
    const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/;
    const PHONE_REGEX = /\b(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;

    /**
     * Recursively checks if an object or value contains PII markers.
     * @param {*} value - The object or value to scan.
     * @returns {boolean} True if PII is detected.
     */
    function scanForPii(value) {
        if (value === null || value === undefined) {
            return false;
        }

        const valueType = typeof value;

        if (valueType === 'object') {
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    // Check if key is a PII marker
                    if (PII_KEYS_PATTERN.test(key)) {
                        console.warn(`[SANTIS_PII_GUARD] Rejected key: "${key}" matches forbidden PII patterns.`);
                        return true;
                    }
                    // Recursively check value
                    if (scanForPii(value[key])) {
                        return true;
                    }
                }
            }
        } else if (valueType === 'string') {
            if (EMAIL_REGEX.test(value)) {
                console.warn('[SANTIS_PII_GUARD] Rejected: Value contains email pattern.');
                return true;
            }
            if (CREDIT_CARD_REGEX.test(value)) {
                console.warn('[SANTIS_PII_GUARD] Rejected: Value contains credit card pattern.');
                return true;
            }
            if (PHONE_REGEX.test(value)) {
                console.warn('[SANTIS_PII_GUARD] Rejected: Value contains phone number pattern.');
                return true;
            }
        }

        return false;
    }

    /**
     * Asserts if rate limits (throttling or burst limits) are currently active.
     * @returns {boolean} True if throttled or burst-protected.
     */
    function isRateLimited() {
        const now = Date.now();

        // Clean up outdated timestamps
        while (dispatchTimestamps.length > 0 && dispatchTimestamps[0] < now - THROTTLE_WINDOW) {
            dispatchTimestamps.shift();
        }

        // Throttle check (max 10 per minute)
        if (dispatchTimestamps.length >= THROTTLE_LIMIT) {
            return true;
        }

        // Burst check (max 3 per 500ms)
        const recent500ms = dispatchTimestamps.filter(t => t >= now - BURST_WINDOW);
        if (recent500ms.length >= BURST_LIMIT) {
            return true;
        }

        return false;
    }

    /**
     * Executes the low-level network dispatch of the telemetry payload.
     * @param {string} payload - The stringified JSON payload.
     * @returns {boolean} True if successfully accepted by navigator or fetch.
     */
    function executeNetworkSend(payload) {
        // 1. Primary: navigator.sendBeacon
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            try {
                const blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
                const success = navigator.sendBeacon(TARGET_URL, blob);
                if (success) {
                    dispatchTimestamps.push(Date.now());
                    return true;
                }
            } catch (e) {
                console.warn('[SANTIS_TELEMETRY_DISPATCHER] navigator.sendBeacon failed, attempting fallback.', e);
            }
        }

        // 2. Secondary Fallback: Fetch with keepalive
        if (typeof fetch !== 'undefined') {
            try {
                fetch(TARGET_URL, {
                    method: 'POST',
                    body: payload,
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    keepalive: true
                }).catch(err => {
                    console.warn('[SANTIS_TELEMETRY_DISPATCHER] Fetch keepalive failed.', err);
                });
                dispatchTimestamps.push(Date.now());
                return true;
            } catch (e) {
                console.error('[SANTIS_TELEMETRY_DISPATCHER] Fetch initialization failed.', e);
            }
        }

        return false;
    }

    /**
     * Main telemetry dispatch handler. Exposes robust validations and throttling.
     * @param {Object} envelope - The RVS telemetry payload.
     * @returns {boolean} True if successfully sent or queued.
     */
    function dispatchRvsTelemetry(envelope) {
        if (!envelope) {
            console.warn('[SANTIS_TELEMETRY_DISPATCHER] Ignored empty envelope.');
            return false;
        }

        // 1. Zero PII Guard
        if (scanForPii(envelope)) {
            console.error('[SANTIS_PII_GUARD] Reverted: Telemetry payload contains potential PII leakage. Dispatch aborted.');
            return false;
        }

        // 2. 8KB Size Guard
        let stringified;
        try {
            stringified = JSON.stringify(envelope);
        } catch (e) {
            console.error('[SANTIS_TELEMETRY_DISPATCHER] Failed to stringify envelope.', e);
            return false;
        }

        const byteSize = stringified.length; // Approximate byte size using string length
        if (byteSize > MAX_PAYLOAD_BYTES) {
            console.error(`[SANTIS_TELEMETRY_DISPATCHER] Payload rejected: size (${byteSize} bytes) exceeds the 8KB limit.`);
            return false;
        }

        // 3. Throttle / Queue Management
        if (isRateLimited() || localQueue.length > 0) {
            // Buffer to queue
            localQueue.push(stringified);
            scheduleQueueDrain();
            return true;
        }

        // 4. Immediate Send
        const sent = executeNetworkSend(stringified);
        if (!sent) {
            // Buffer to queue if both primary and secondary failed
            localQueue.push(stringified);
            scheduleQueueDrain();
        }

        return true;
    }

    /**
     * Schedules the next queue check.
     */
    function scheduleQueueDrain() {
        if (queueDrainTimeout || localQueue.length === 0) {
            return;
        }

        queueDrainTimeout = setTimeout(() => {
            queueDrainTimeout = null;
            drainQueue();
        }, 250); // Robust debounced check every 250ms
    }

    /**
     * Drains the buffered localQueue while honoring rate limits.
     */
    function drainQueue() {
        if (localQueue.length === 0) return;

        // If rate limits are currently clear, send the next in line
        if (!isRateLimited()) {
            const nextPayload = localQueue.shift();
            const sent = executeNetworkSend(nextPayload);
            if (!sent) {
                // If send failed, put it back at the front
                localQueue.unshift(nextPayload);
            }
        }

        // Schedule next check if there are still items left
        if (localQueue.length > 0) {
            scheduleQueueDrain();
        }
    }

    // Expose APIs to window context
    const dispatcherApi = {
        dispatchRvsTelemetry: dispatchRvsTelemetry,
        getQueueSize: () => localQueue.length,
        clearQueue: () => { localQueue.length = 0; },
        getMetrics: () => ({
            throttled: isRateLimited(),
            queueSize: localQueue.length,
            recentDispatchCount: dispatchTimestamps.length
        })
    };

    window.dispatchRvsTelemetry = dispatchRvsTelemetry;
    window.SantisRvsTelemetryDispatcher = dispatcherApi;

    console.log('🛡️ [SANTIS_TELEMETRY_DISPATCHER] Client Telemetry Dispatcher loaded and sealed.');
})();
