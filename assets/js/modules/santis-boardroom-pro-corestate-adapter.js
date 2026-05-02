/**
 * SANTIS BOARDROOM PRO CORESTATE ADAPTER
 * Consumes live CoreState patches and translates them into Boardroom metrics
 */

export const SantisBoardroomProCoreStateAdapter = (function() {
  const CORESTATE_PATCH_EVENT = 'SANTIS_CORE_STATE_PATCH';
  
  // Local state cache mirroring the remote core state relevant to Boardroom
  const liveState = {
    totalRevenue: 0,
    bookingCount: 0,
    conversionRate: 0,
    vipSegments: [],
    oracleInsights: []
  };

  function init() {
    window.addEventListener(CORESTATE_PATCH_EVENT, handleCoreStatePatch);
    console.log(`[Santis Boardroom Adapter] Initialized and listening for ${CORESTATE_PATCH_EVENT}.`);
  }

  function handleCoreStatePatch(event) {
    const patch = event.detail;
    if (!patch) return;

    // Update Live State using the payload
    if (patch.boardroom) {
      if (patch.boardroom.metrics) {
        if (typeof patch.boardroom.metrics.totalRevenue !== 'undefined') liveState.totalRevenue = patch.boardroom.metrics.totalRevenue;
        if (patch.boardroom.metrics.scp) liveState.scp = patch.boardroom.metrics.scp;
      }
      if (patch.boardroom.pricingFeedback) liveState.pricingFeedback = patch.boardroom.pricingFeedback;
      if (patch.boardroom.pricingRecommendations) liveState.pricingRecommendations = patch.boardroom.pricingRecommendations;
      if (patch.boardroom.pricingRecommendation) liveState.pricingRecommendation = patch.boardroom.pricingRecommendation;
      if (patch.boardroom.pricingOverride) liveState.pricingOverride = patch.boardroom.pricingOverride;
      if (patch.boardroom.shadowPricing) liveState.shadowPricing = patch.boardroom.shadowPricing;
      if (patch.boardroom.calibration) liveState.calibration = patch.boardroom.calibration;
      if (patch.boardroom.oracleIntelligence) liveState.oracleIntelligence = patch.boardroom.oracleIntelligence;
    }

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
