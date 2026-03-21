/**
 * ═══════════════════════════════════════════════════════════
 * SANTIS OS - THE ORACLE (Cognitive Worker Phase 46)
 * ═══════════════════════════════════════════════════════════
 * Main Thread'i ağır matematik yükünden kurtaran Kuantum Çekirdeği.
 * İvme (dv/dt), sürtünme (friction) ve Zarafet Puanı (SAI) matematiği 
 * SADECE burada döner.
 */

let lastX = 0, lastY = 0, lastTime = performance.now(), lastVelocity = 0;
let lastScrollY = 0, lastScrollTime = performance.now(), lastScrollVelocity = 0;

let saiScore = 0; // Santis Affinity Index
const OBSIDIAN_THRESHOLD = 1000;
let hasUnlockedObsidian = false;

self.onmessage = function(e) {
    const data = e.data;

    if (data.type === 'INIT') {
        saiScore = data.initialSAI || 0;
        if (saiScore >= OBSIDIAN_THRESHOLD) hasUnlockedObsidian = true;
        console.log(`🌌 [The Oracle] Kuantum Çekirdeği Uzamsal Boyutta Aktif. Başlangıç SAI: ${Math.floor(saiScore)}`);
        // Init timestamp resets
        lastTime = performance.now();
        lastScrollTime = performance.now();
        return;
    }

    if (data.type === 'KINEMATIC_TICK') {
        processKinematics(data.payload);
    }
};

function processKinematics(payload) {
    const { x, y, scrollY, timestamp, isIdleTick } = payload;
    let isStressed = false;
    let stressReason = "";

    // 1. Zarafet (Affinity) Mantığı: Dwell Time
    if (isIdleTick && !hasUnlockedObsidian) {
        saiScore += 2; // Saniyede 2 puan (sakin durduğu için)
    }

    // 2. Scroll Kinematics & Smoothness
    if (scrollY !== undefined) {
        const dtScroll = timestamp - lastScrollTime;
        if (dtScroll > 16) {
            const dyScroll = Math.abs(scrollY - lastScrollY);
            const scrollVelocity = dyScroll / (dtScroll / 1000);
            const scrollAcceleration = (scrollVelocity - lastScrollVelocity) / (dtScroll / 1000);

            // Zarafet Çarpanı: Yavaş ve pürüzsüz kaydırma
            if (dyScroll > 0 && dyScroll < 30 && !hasUnlockedObsidian) {
                saiScore += 0.5; // Smooth scroll bonus
            }

            // Stres/Sürtünme (Friction) Kontrolü
            if (scrollAcceleration > 15000 || scrollVelocity > 4000) {
                isStressed = true;
                stressReason = "Aggressive Scroll Trigger";
            }

            lastScrollY = scrollY;
            lastScrollTime = timestamp;
            lastScrollVelocity = scrollVelocity;
        }
    }

    // 3. Mouse Kinematics (dv/dt)
    if (x !== undefined && y !== undefined) {
        const dt = timestamp - lastTime;
        if (dt > 16) {
            const dx = x - lastX;
            const dy = y - lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const currentVelocity = distance / (dt / 1000); 
            const acceleration = (currentVelocity - lastVelocity) / (dt / 1000);

            if (acceleration > 8000 && currentVelocity > 1500) {
                isStressed = true;
                stressReason = "Aggressive Mouse Trajectory";
            }

            lastX = x;
            lastY = y;
            lastTime = timestamp;
            lastVelocity = currentVelocity;
        }
    }

    // Her izleme döngüsünün (tick) sonunda VIP kontrolü:
    if (saiScore >= OBSIDIAN_THRESHOLD && !hasUnlockedObsidian) {
        hasUnlockedObsidian = true;
        // Altın Bileti Main Thread'e fırlat!
        self.postMessage({ action: 'UNLOCK_OBSIDIAN', sai: saiScore });
    }

    // Stres tesbiti varsa raporla
    if (isStressed) {
        self.postMessage({ type: 'STRESS_ALERT_PREDICTED', reason: stressReason, timestamp: timestamp });
    }
}
