/**
 * SANTIS OS - Central Runtime Configuration Resolver
 * Defines dynamic API endpoints based on global config or local dev fallbacks.
 */
(function() {
    const isDevHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    
    const devFallbackUrl = isDevHost ? "http://127.0.0.1:3030" : "";
    const devFallbackWs = isDevHost ? "ws://127.0.0.1:3030" : "";
  
    window.getRuntimeConfig = function() {
        const cfg = window.SANTIS_RUNTIME_CONFIG || {};
        const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  
        return {
            apiBaseUrl: cfg.apiBaseUrl || (devFallbackUrl ? `${devFallbackUrl}/api/v1` : "/api/v1"),
            ingestionBaseUrl: cfg.ingestionBaseUrl || (devFallbackUrl ? `${devFallbackUrl}/ingestion` : "/ingestion"),
            coreStateUrl: cfg.coreStateUrl || (devFallbackUrl ? `${devFallbackUrl}/api/v1/core-state` : "/api/v1/core-state"),
            coreStateStreamUrl: cfg.coreStateStreamUrl || (devFallbackUrl ? `${devFallbackUrl}/api/v1/core-state/stream` : "/api/v1/core-state/stream"),
            wsUrl: cfg.wsUrl || (devFallbackWs ? `${devFallbackWs}/ws` : `${wsProtocol}://${window.location.host}/ws`),
            eventsWsUrl: cfg.eventsWsUrl || (devFallbackWs ? `${devFallbackWs}/events` : `${wsProtocol}://${window.location.host}/events`),
            physicalCommandUrl: cfg.physicalCommandUrl || (devFallbackUrl ? `${devFallbackUrl}/api/physical-command` : "/api/physical-command"),
            streamGodUrl: cfg.streamGodUrl || (devFallbackUrl ? `${devFallbackUrl}/api/v1/streams/god` : "/api/v1/streams/god")
        };
    };
})();
