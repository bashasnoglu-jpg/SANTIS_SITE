// system/santis-optic-throttle.js
// SDCR V61.0 - SOVEREIGN OPTIC THROTTLE (Eco Mode & GPU Protection)

/**
 * OpticThrottle
 * Uses IntersectionObserver to detect when high-cost visual elements (like Echarts or 3D Matrix canvases)
 * enter or leave the "Foveal Vision" (viewport). When they leave, their rendering context is paused
 * to conserve GPU cycles and laptop batteries. This directly addresses the "metabolic brake" requirement.
 */
export const OpticThrottle = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const chartId = entry.target.id;
        
        // __SANTIS_CHARTS__ is the expected global registry for active ECharts or Canvas instances
        const chartInstance = window.__SANTIS_CHARTS__?.[chartId] || entry.target.__chart;
        
        if (!chartInstance) return;

        if (entry.isIntersecting) {
            console.log(`👁️ [OPTIC NERVE] Foveal vizyona girildi. Kan akışı hızlanıyor: ${chartId}`);
            if (typeof chartInstance.resume === 'function') {
                chartInstance.resume(); 
            } else if (typeof chartInstance.resize === 'function') {
                // ECharts specific wake-up (resize often triggers a redraw)
                chartInstance.resize();
            }
        } else {
            console.log(`💤 [ECO MODE] Kör nokta. Canvas uyutuluyor (Batarya Tasarrufu): ${chartId}`);
            if (typeof chartInstance.pause === 'function') {
                chartInstance.pause();
            }
        }
    });
}, { 
    threshold: 0.1 // Activate when at least 10% is visible
});

/**
 * Helper to bind elements to the throttle
 * @param {string|HTMLElement} elementOrSelector 
 */
export function bindOpticThrottle(elementOrSelector) {
    let el;
    if (typeof elementOrSelector === 'string') {
        el = document.querySelector(elementOrSelector);
    } else {
        el = elementOrSelector;
    }
    
    if (el) {
        OpticThrottle.observe(el);
    }
}
