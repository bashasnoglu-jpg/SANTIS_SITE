/**
 * SANTIS CORESTATE STREAM CLIENT
 * Compatibility facade for the canonical SantisApi CoreState SSE client.
 *
 * Canonical stream contract:
 * - URL: /api/v1/core-state/stream
 * - Patch event: SANTIS_CORE_STATE_PATCH
 *
 * Legacy consumers may still listen to:
 * - santis:corestate:patch
 */

export const SantisCoreStateStreamClient = (function() {
  let connected = false;
  let legacyPatchBridgeInstalled = false;

  function installLegacyPatchBridge() {
    if (legacyPatchBridgeInstalled) return;

    window.addEventListener('SANTIS_CORE_STATE_PATCH', (event) => {
      window.dispatchEvent(new CustomEvent('santis:corestate:patch', {
        detail: event.detail
      }));
    });

    legacyPatchBridgeInstalled = true;
  }

  function connect() {
    installLegacyPatchBridge();

    if (!window.SantisApi || typeof window.SantisApi.connectCoreStateStream !== 'function') {
      console.warn('[Santis CoreState Stream] Canonical SantisApi client is unavailable.');
      window.dispatchEvent(new CustomEvent('santis:corestate:error', {
        detail: { reason: 'SANTIS_API_CLIENT_UNAVAILABLE' }
      }));
      return;
    }

    if (connected) {
      console.warn('[Santis CoreState Stream] Already connected via SantisApi.');
      return;
    }

    window.SantisApi.connectCoreStateStream();
    connected = true;

    window.dispatchEvent(new CustomEvent('santis:corestate:connected', {
      detail: { source: 'SantisApi', event: 'SANTIS_CORE_STATE_PATCH' }
    }));
  }

  function disconnect() {
    const source = window.SantisApi && window.SantisApi.coreStateEventSource;

    if (source && typeof source.close === 'function') {
      source.close();
      window.SantisApi.coreStateEventSource = null;
    }

    connected = false;
    console.log('[Santis CoreState Stream] Disconnected canonical SantisApi stream.');
  }

  return {
    connect,
    disconnect
  };
})();
