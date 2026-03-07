/**
 * 🧠 SANTIS AI WORKER (V24 ASYNC CORE)
 * Executes heavy neural fetch operations off the main thread.
 * Ensures DOM rendering stays at 120 FPS.
 */

self.onmessage = async function (e) {
    const { action, payload, apiBase } = e.data;

    if (action === 'FETCH_AI_RESPONSE') {
        try {
            const res = await fetch(`${apiBase}/ai/concierge-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            // Return back to main thread
            self.postMessage({ status: 'success', data: data });
        } catch (error) {
            self.postMessage({ status: 'error', error: error.message });
        }
    }
};
