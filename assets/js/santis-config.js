(() => {
  const config = window.getRuntimeConfig ? window.getRuntimeConfig() : {};
  const httpBase = config.apiBaseUrl ? config.apiBaseUrl.replace('/api/v1', '') : window.location.origin;
  const wsBase = config.wsUrl ? config.wsUrl.replace('/ws', '') : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

  window.SANTIS_CONFIG = {
    API_BASE_URL: httpBase,
    WS_URL: config.wsUrl || `${wsBase}/ws`,
    HTTP_BASE_URL: httpBase,
    WS_BASE_URL: wsBase,
  };

  // Aliases for legacy system mapping
  window.__API_BASE__ = config.apiBaseUrl || `${window.SANTIS_CONFIG.API_BASE_URL}/api/v1`;
  window.__HQ_API_BASE__ = window.SANTIS_CONFIG.API_BASE_URL;
})();
