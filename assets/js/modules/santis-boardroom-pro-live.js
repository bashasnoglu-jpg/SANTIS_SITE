/**
 * SANTIS BOARDROOM PRO LIVE ORCHESTRATOR
 * Replaces the local-storage based refresh with Event-Driven Live updates
 */
import { SantisCoreStateStreamClient } from './santis-corestate-stream-client.js';
import { SantisBoardroomProCoreStateAdapter } from './santis-boardroom-pro-corestate-adapter.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Bootstrapping Boardroom PRO Live Nervous System...');

  // Initialize the adapter first so it's ready to catch events
  SantisBoardroomProCoreStateAdapter.init();

  // Connect the SSE client
  SantisCoreStateStreamClient.connect();

  // Listen for mapped live updates from the adapter
  window.addEventListener('santis:boardroom:live:update', (event) => {
    const metrics = event.detail;
    updateCockpitUI(metrics);
  });
});

function updateCockpitUI(metrics) {
  // Map metrics to DOM elements in the Boardroom PRO Cockpit
  const revenueEl = document.getElementById('val-total-revenue');
  const bookingEl = document.getElementById('val-total-leads');
  
  if (revenueEl && metrics.totalRevenue !== undefined) {
    revenueEl.textContent = `€${metrics.totalRevenue.toLocaleString('en-US')}`;
  }
  
  if (bookingEl && metrics.bookingCount !== undefined) {
    bookingEl.textContent = metrics.bookingCount;
  }
  
  // Check if SantisBoardroomLite global render functions are available to update UI
  if (typeof window.SantisBoardroomLite !== 'undefined') {
    if (metrics.vipSegments && metrics.vipSegments.length > 0) {
       window.SantisBoardroomLite.renderVIPSegment(metrics.vipSegments);
    }
    if (metrics.oracleInsights && metrics.oracleInsights.length > 0) {
       window.SantisBoardroomLite.renderOracleInsights(metrics.oracleInsights);
    }
  }
}
