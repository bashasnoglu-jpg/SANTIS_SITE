/**
 * SANTIS CORESTATE STREAM CLIENT
 * Handles Server-Sent Events (SSE) connection to the Ingestion API
 * True Streaming Intelligence Foundation
 */

export const SantisCoreStateStreamClient = (function() {
  let eventSource = null;
  const STREAM_URL = 'http://localhost:3030/api/v1/core-state/stream';

  function connect() {
    if (eventSource) {
      console.warn('[Santis CoreState Stream] Already connected.');
      return;
    }

    console.log(`[Santis CoreState Stream] Connecting to ${STREAM_URL}...`);
    eventSource = new EventSource(STREAM_URL);

    eventSource.onopen = (e) => {
      console.log('[Santis CoreState Stream] Connection established (True Streaming Intelligence active).');
      window.dispatchEvent(new CustomEvent('santis:corestate:connected'));
    };

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('[Santis CoreState Stream] Raw data received:', data);
        
        // Handle systemic events
        if (data.type === 'SYSTEM') {
          console.log('[Santis CoreState Stream] System Message:', data.payload);
          return;
        }

        // Handle specific patch payloads
        if (data.type === 'CORE_STATE_PATCH' && data.patch) {
            // Dispatch the corestate patch so adapters can consume it
            window.dispatchEvent(new CustomEvent('santis:corestate:patch', {
            detail: data.patch
            }));
        } else {
             // Fallback if the patch is sent directly (legacy mode)
             window.dispatchEvent(new CustomEvent('santis:corestate:patch', {
                detail: data
              }));
        }

      } catch (err) {
        console.error('[Santis CoreState Stream] Failed to parse stream data:', err);
      }
    };

    eventSource.onerror = (e) => {
      console.error('[Santis CoreState Stream] Connection error or disconnected. Attempting reconnect...');
      // EventSource automatically attempts to reconnect.
      window.dispatchEvent(new CustomEvent('santis:corestate:error', { detail: e }));
    };
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      console.log('[Santis CoreState Stream] Disconnected manually.');
    }
  }

  return {
    connect,
    disconnect
  };
})();
