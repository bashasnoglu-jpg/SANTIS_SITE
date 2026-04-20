/**
 * SANTIS Sovereign OS - Runtime Integrity Manager
 * Handles disconnects and injects 'Failure Physics'.
 */
export const IntegrityManager = {
    reconnectInterval: 1000,
    maxInterval: 30000,

    handleDisconnect() {
        console.warn("[INTEGRITY]: Decision Core unreachable. Entering 'Dream State'...");
        
        // 1. Görsel Geri Bildirim: Canvas'ı "Dream Mode"a al (Düşük FPS, yüksek blur)
        if (window.SantisGodCanvas && typeof window.SantisGodCanvas.setMood === 'function') {
            window.SantisGodCanvas.setMood('dream'); 
        } else {
            // Fallback physics for missing canvas integration
            const canvas = document.getElementById('santis-god-canvas');
            if (canvas) canvas.style.filter = "blur(10px) contrast(1.2)";
        }

        // 2. UI Koruması: Etkileşimli butonları 'bekleme' moduna al
        document.body.classList.add('santis-state--syncing');

        this.attemptReconnect();
    },

    attemptReconnect() {
        setTimeout(() => {
            console.log("[INTEGRITY]: Attempting to restore Sovereign Link...");
            
            // Fallback simulation for reconnecting without full WebSockets
            fetch('/manifest.json', { method: 'HEAD', cache: 'no-store' })
                .then(() => {
                    console.log("[INTEGRITY]: Link Restored. Awakening from Dream State.");
                    document.body.classList.remove('santis-state--syncing');
                    
                    if (window.SantisGodCanvas && typeof window.SantisGodCanvas.setMood === 'function') {
                        window.SantisGodCanvas.setMood('awake');
                    } else {
                        const canvas = document.getElementById('santis-god-canvas');
                        if (canvas) canvas.style.filter = "none";
                    }
                    this.reconnectInterval = 1000;
                })
                .catch(() => {
                    this.reconnectInterval = Math.min(this.reconnectInterval * 2, this.maxInterval);
                    this.attemptReconnect();
                });
            
        }, this.reconnectInterval);
    }
};

window.addEventListener('offline', () => IntegrityManager.handleDisconnect());
window.addEventListener('online', () => {
    console.log("[INTEGRITY]: Physical Connection restored.");
    IntegrityManager.reconnectInterval = 1000;
});
