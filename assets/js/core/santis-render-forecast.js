/**
 * ═══════════════════════════════════════════════════════════════
 * 👑 SANTIS RENDER FORECAST ENGINE (120 FPS Guarantee)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Bu modül, Layout Thrashing (DOM Okuma/Yazma çarpışması) sorununu
 * tamamen çözer. Tüm okuma işlemleri (get computed vb.) gruplanır,
 * ardından tüm yazma işlemleri (appendChild vb.) gruplanır.
 * 
 * SantisKernel'in VISIBLE kuyruğu tarafından domine edilir.
 */

export const SantisRender = (() => {
    let reads = [];
    let writes = [];
    let scheduled = false;

    function flush() {
        const currentReads = reads;
        const currentWrites = writes;
        
        reads = [];
        writes = [];
        scheduled = false;

        // 🟢 1. SADECE OKUMALAR (DOM Layout Hesaplamaları)
        for (let i = 0; i < currentReads.length; i++) {
            try { currentReads[i](); } 
            catch (e) { console.error('🚨 [Render Forecast] Read Error:', e); }
        }

        // 🔴 2. SADECE YAZMALAR (DOM Manipülasyonları)
        for (let i = 0; i < currentWrites.length; i++) {
            try { currentWrites[i](); } 
            catch (e) { console.error('🚨 [Render Forecast] Write Error:', e); }
        }

        // Eğere flush sırasında yeni iş geldiyse hemen schedule et
        if (reads.length > 0 || writes.length > 0) {
            schedule();
        }
    }

    function schedule() {
        if (!scheduled) {
            scheduled = true;
            if (window.SantisKernel) {
                // 1 = Priority.HIGH (VISIBLE queue in Kernel)
                window.SantisKernel.enqueue(flush, 1, 'RenderForecastFlush');
            } else {
                requestAnimationFrame(flush);
            }
        }
    }

    return {
        read(task) {
            reads.push(task);
            schedule();
        },
        write(task) {
            writes.push(task);
            schedule();
        },
        clear() {
            reads = [];
            writes = [];
            scheduled = false;
            console.log('🧹 [Render Forecast] Queue Cleared.');
        }
    };
})();

if (!window.SantisRender) {
    window.SantisRender = SantisRender;
}
