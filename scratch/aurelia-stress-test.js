/**
 * 🧪 SANTIS OS — AURELIA STRESS TEST (PHASE I2)
 * Purpose: Simulates an event storm to verify VisualScheduler composure.
 * Usage: Run in browser console after importing the event bridge.
 */

(function runAureliaStressTest() {
    console.log("🧪 [Stress Test] Starting Aurelia Event Storm...");
    
    const EVENT_TYPES = [
        'santis:experience.intent.visualize',
        'santis:experience.dataset.ready',
        'santis:experience.error.visualize'
    ];

    let count = 0;
    const TOTAL_EVENTS = 100;
    const INTERVAL = 10; // 10ms (Higher frequency than the 120ms refractory period)

    const timer = setInterval(() => {
        const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
        
        const event = new CustomEvent(type, {
            detail: { timestamp: performance.now(), storm: true }
        });
        
        document.dispatchEvent(event);
        count++;

        if (count >= TOTAL_EVENTS) {
            clearInterval(timer);
            console.log(`✅ [Stress Test] Storm completed. ${TOTAL_EVENTS} events dispatched.`);
            console.log("📊 [Stress Test] Check window.__AURELIA_METRICS__ for results.");
        }
    }, INTERVAL);
})();
