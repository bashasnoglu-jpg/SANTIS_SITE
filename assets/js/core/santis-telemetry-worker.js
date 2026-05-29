/**
 * ═══════════════════════════════════════════════════════════════
 * SANTIS SOVEREIGN TELEMETRY WORKER 📡 (Phase W)
 * ═══════════════════════════════════════════════════════════════
 * @description Off-Main-Thread Performance Monitor.
 * Observes raw data pulses from the UI thread, calculates severities,
 * applies Load Shedding logic, and returns formatted HTML blocks.
 */

let totalLongTasks = 0;
let lastPulseTime = Date.now();
let isLoadShedding = false;

self.onmessage = function(e) {
    const data = e.data;
    if (data.type === 'TELEMETRY_PULSE') {
        const now = Date.now();
        const deltaTime = now - lastPulseTime;
        lastPulseTime = now;

        // 🚀 V36.5 Patch: Ana thread doğrudan FPS'yi hesaplayıp gönderiyor (Race condition fix)
        const fps = data.fps || 60;
        
        // Accumulate Long Tasks
        totalLongTasks += (data.newLongTasks || 0);

        // Memory Conversion (MB)
        const memoryMB = (data.memory || 0) / 1024 / 1024;
        
        const tti = data.tti || 0;
        const wsLatency = data.wsLatency || 0;

        // 🚨 LOAD SHEDDING (CPU / RAM Kalkanı)
        // Eğer bellek aşırı yüksekse veya FPS 15'in altındaysa ana thread can çekişiyor demektir.
        if (memoryMB > 500 || (fps < 15 && fps > 0)) {
            isLoadShedding = true;
        } else if (memoryMB < 300 && fps >= 30) {
            isLoadShedding = false; // Sistem rahatladı
        }

        if (isLoadShedding && Math.random() > 0.2) {
            // Yük Boşaltma Aktif: Ana thread'i yormamak için her 5 pulse'dan 4'ünü sessizce atla.
            self.postMessage({ loadShedding: true });
            return;
        }

        // --- HUD RENDER GENERATION (Worker Thread) ---
        let statusColor = tti > 300 ? '#ef4444' : fps < 45 ? '#f59e0b' : '#10b981';
        
        const html = `
            <div class="flex" style="justify-content:space-between; margin-bottom: 2px;">
                <span style="color:#6b7280">BOOT</span> <strong style="color:${tti > 300 ? '#ef4444' : '#10b981'}">${tti.toFixed(1)}ms</strong>
            </div>
            <div class="flex" style="justify-content:space-between; margin-bottom: 2px;">
                <span style="color:#6b7280">FPS / RAM</span> 
                <span>
                    <strong style="color:${fps < 45 ? '#ef4444' : '#10b981'}">${fps}</strong> 
                    <span style="color:#374151">|</span> 
                    <strong class="text-lux-gold">${memoryMB.toFixed(1)}MB</strong>
                </span>
            </div>
            <div class="flex" style="justify-content:space-between;">
                <span style="color:#6b7280">WS PING / LK</span> 
                <span>
                    <strong style="color:${wsLatency > 100 ? '#ef4444' : wsLatency > 0 ? '#10b981' : '#6b7280'}">${wsLatency > 0 ? wsLatency + 'ms' : 'N/A'}</strong> 
                    <span style="color:#374151">|</span> 
                    <strong style="color:${totalLongTasks > 0 ? '#ef4444' : '#10b981'}">${totalLongTasks}</strong>
                </span>
            </div>
            ${isLoadShedding ? '<div class="text-center" style="color:#ef4444; font-size:9px; margin-top:4px; padding-top:2px; border-top:1px dashed #ef4444;">SHEDDING ACTIVE</div>' : ''}
        `;

        self.postMessage({
            type: 'HUD_UPDATE',
            html: html,
            color: statusColor,
            loadShedding: isLoadShedding,
            metrics: { fps, memoryMB, tti, wsLatency, totalLongTasks }
        });
    }
};
