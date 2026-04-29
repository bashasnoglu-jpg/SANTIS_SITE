/**
 * SANTIS BOARDROOM PRO CORESTATE ADAPTER
 * Consumes live CoreState patches and translates them into Boardroom metrics
 */

export const SantisBoardroomProCoreStateAdapter = (function() {
  
  // Local state cache mirroring the remote core state relevant to Boardroom
  const liveState = {
    totalRevenue: 0,
    bookingCount: 0,
    conversionRate: 0,
    vipSegments: [],
    oracleInsights: []
  };

  function init() {
    window.addEventListener('santis:corestate:patch', handleCoreStatePatch);
    console.log('[Santis Boardroom Adapter] Initialized and listening for live patches.');
  }

  function handleCoreStatePatch(event) {
    const patch = event.detail;
    if (!patch) return;

    // Update Live State using the payload
    if (typeof patch.totalRevenue !== 'undefined') liveState.totalRevenue = patch.totalRevenue;
    if (typeof patch.bookingCount !== 'undefined') liveState.bookingCount = patch.bookingCount;
    if (typeof patch.conversionRate !== 'undefined') liveState.conversionRate = patch.conversionRate;
    
    if (patch.vipSegments) liveState.vipSegments = patch.vipSegments;
    if (patch.oracleInsights) liveState.oracleInsights = patch.oracleInsights;

    // Trigger Boardroom PRO UI update
    window.dispatchEvent(new CustomEvent('santis:boardroom:live:update', {
      detail: getLiveMetrics()
    }));
  }

  function getLiveMetrics() {
    return { ...liveState };
  }

  return {
    init,
    getLiveMetrics
  };
})();
