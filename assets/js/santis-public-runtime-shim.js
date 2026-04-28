(function santisPublicRuntimeShim() {
  if (!window.SantisApi) {
    window.SantisApi = {
      async getCoreState() {
        console.warn('[Santis Public Shim] SantisApi.getCoreState fallback active.');
        return {
          ok: true,
          mode: 'public-static',
          coreState: {
            health: 'degraded',
            runtime: 'static',
            booking: null,
            telemetry: null
          }
        };
      }
    };
  }

  window.__SANTIS_PUBLIC_RUNTIME_SHIM__ = true;
})();
