(() => {
  const isFilePreview = window.location.protocol === 'file:';
  const httpBase = window.__SANTIS_HTTP_BASE__ || (isFilePreview ? 'http://localhost:3030' : window.location.origin);
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsBase = window.__SANTIS_WS_BASE__ || (isFilePreview ? 'ws://localhost:3030' : `${wsProtocol}//${window.location.host}`);

  window.SANTIS_CONFIG = {
    API_BASE_URL: httpBase,
    WS_URL: `${wsBase}/ws`,
    HTTP_BASE_URL: httpBase,
    WS_BASE_URL: wsBase,
  };

  // Aliases for legacy system mapping
  window.__API_BASE__ = `${window.SANTIS_CONFIG.API_BASE_URL}/api/v1`;
  window.__HQ_API_BASE__ = window.SANTIS_CONFIG.API_BASE_URL;
})();
