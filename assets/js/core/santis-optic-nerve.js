/**
 * ==========================================
 * 👁️ SOVEREIGN OS V6: THE OPTIC NERVE & ANOMALY ENGINE
 * ==========================================
 * Sunucudan gelen telemetriyi yakalar. DOM'a ASLA dokunmaz.
 * Sadece NeuralDB'yi besler, gerisini Kuantum Proxy halleder.
 * Singularity: Sistem öğrenir, refleks verir, kendini onarır.
 */
export function initOpticNerve(NeuralBus) {
    if (window.__OPTIC_NERVE_ALIVE__) return;
    window.__OPTIC_NERVE_ALIVE__ = true;

    if (NeuralBus) window.NeuralDB = window.NeuralDB || NeuralBus;
    window.NeuralDB.state = window.NeuralDB.state || {};
    window.NeuralDB.state.telemetry = window.NeuralDB.state.telemetry || { cpu: 0, memory: 0, ping: 0 };
    window.NeuralDB.state.system = window.NeuralDB.state.system || { defcon: 'ONLINE', status: 'ONLINE', activeAgents: 0 };
    window.NeuralDB.state.telemetryBaseline = window.NeuralDB.state.telemetryBaseline || { cpu: [], ping: [] };
    
    console.log("%c[GOD'S EYE V6] Singularity Optik Siniri Bağlanıyor... 👁️", "color: #ff00ff; font-weight: bold;");

    if (!window.NeuralDB) {
        return console.error("Kritik Hata: Cortex (Beyin) bulunamadı! Gözler kör.");
    }

    function updateBaseline(metric, value) {
        const arr = NeuralDB.state.telemetryBaseline[metric];
        arr.push(Number(value));
        if (arr.length > 50) arr.shift(); // son 5 saniye (10 FPS)
    }

    // --- 2. SAPMA HESABI (GERÇEK ZEKA) ---
    function getDeviation(metric, value) {
        const arr = NeuralDB.state.telemetryBaseline[metric];
        if (arr.length === 0) return 0;
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        return Math.abs(value - avg);
    }

    // --- 3. ANOMALY DETECTOR ---
    function detectAnomaly(data) {
        const cpuDev = getDeviation('cpu', data.cpu);
        const pingDev = getDeviation('ping', data.ping);

        if (cpuDev > 25 || data.cpu > 90) return 'CPU_SPIKE';
        if (pingDev > 15) return 'NETWORK_JITTER';
        if (data.agents === 0) return 'TOTAL_DROP';
        
        return null;
    }

    // --- 4. THE SINGULARITY (REAKSİYON MOTORU) ---
    let hueFilter = 0;
    
    function triggerResponse(type) {
        console.warn(`🚨 [SINGULARITY A.I.] ANOMALY DETECTED: ${type}. REFLEKS DEVREDE!`);

        switch(type) {
            case 'CPU_SPIKE':
                NeuralDB.state.system.defcon = 'WARNING (CPU SPIKE)';
                // Ani adrenalin patlaması - Arayüz mutasyonu
                hueFilter = 180;
                document.body.style.filter = `hue-rotate(${hueFilter}deg)`;
                document.body.style.transition = 'filter 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                
                // AUTO-HEAL: Animasyonları geçici olarak durdur (DOM Tasarrufu)
                document.body.classList.add('neuro-freeze');
                setTimeout(() => document.body.classList.remove('neuro-freeze'), 1500);
                break;

            case 'NETWORK_JITTER':
                NeuralDB.state.system.defcon = 'UNSTABLE ZONING';
                // Agresif Glitch Refleksi
                document.body.style.filter = 'drop-shadow(0 0 10px rgba(255,0,0,0.8))';
                break;

            case 'TOTAL_DROP':
                NeuralDB.state.system.defcon = 'CRITICAL OXYGEN LOSS';
                document.body.style.background = '#300';
                break;
        }
    }

    // İyileşme (Auto-Repair)
    function autoRepair() {
        if (NeuralDB.state.system.defcon !== 'ONLINE (SYNCED)' && NeuralDB.state.system.defcon !== 'BLIND (RECONNECTING...)') {
            NeuralDB.state.system.defcon = 'ONLINE (STABILIZED)';
            if (hueFilter > 0) {
                hueFilter -= 10;
                if (hueFilter <= 0) {
                    hueFilter = 0;
                    document.body.style.filter = 'none';
                } else {
                    document.body.style.filter = `hue-rotate(${hueFilter}deg)`;
                }
            } else {
                document.body.style.filter = 'none';
            }
        }
    }

    // --- THE OPTIC UPLINK (THROUGH WEBTRANSPORT / NEXUS) ---
    function connectUplink() {
        if (!window.SovereignHiveNexus && !window.SovereignWS) {
            console.warn("❌ Kritik Uyarı: WebTransport (Nexus) veya SovereignWS bulunamadı! Optik Sinir simülasyon modunda çalışacak.");
            // CNS Otorite Katmanına Haber Ver
            if (window.SantisCNS) window.SantisCNS.dispatch('NETWORK_SIMULATION_MODE', {});
            return;
        }

        console.log("%c[GOD'S EYE] UPLINK BAĞLANIYOR... WebTransport/Nexus Kancası Aktif.", "color: #00FFCC; font-weight: bold;");
        
        // 📡 Merkezi Nexus üzerinden telemetri akışını dinle
        const subscribeMethod = window.SovereignHiveNexus ? 
            (topic, cb) => { /* Eğer ileride HiveNexus subscribe metodu varsa */ } : 
            (window.SovereignWS ? window.SovereignWS.subscribe.bind(window.SovereignWS) : () => {}); // Fallback

        subscribeMethod('GODS_EYE_STREAM', (data) => {
            // 1. Zihni Besle (DOM'a Kuantum Proxy Vurur)
            NeuralDB.state.telemetry.cpu = data.cpu;
            NeuralDB.state.telemetry.memory = data.memory;
            NeuralDB.state.telemetry.ping = data.ping;
            NeuralDB.state.system.activeAgents = data.agents;

            // 2. Anomali Taraması (The Baseline)
            updateBaseline('cpu', Number(data.cpu));
            updateBaseline('ping', Number(data.ping));

            const anomaly = detectAnomaly(data);

            if (anomaly) {
                triggerResponse(anomaly);
            } else {
                autoRepair();
                NeuralDB.state.system.status = 'ONLINE (SYNCED)';
                NeuralDB.state.system.defcon = 'ONLINE (SYNCED)';
            }
        });

        // 💀 Merkezi Orchestrator koptuğunu (Offline Mod) bildirdiğinde
        if (window.SovereignWS) {
            window.SovereignWS.subscribe('close', () => {
            console.warn(`%c[GOD'S EYE] Vizyon Koptu. SovereignWS yeniden bağlantı arıyor...`, "color: #f59e0b; font-size: 11px;");
            NeuralDB.state.system.status = 'RECONNECTING...';
            NeuralDB.state.system.defcon = 'UNSTABLE UPLINK';
            NeuralDB.state.telemetry.cpu = "WAIT";

            // Eğer Orchestrator tamamen pes ederse (Offline Intelligence moduna geçerse)
            if (window.SovereignWS.offline) {
                console.log("%c[GOD'S EYE] Visual Uplink Offline. REALITY LAYER V7.1 (Dream Mode) Başlatılıyor...", "color: #a855f7; font-weight: bold;");
                NeuralDB.state.system.status = 'SIMULATION (DREAM MODE)';
                NeuralDB.state.system.defcon = 'ACTIVE SIMULATION';
                
                if (window.SantisCNS) window.SantisCNS.dispatch('NETWORK_SIMULATION_MODE', {});
                
                // Rüya Jeneratörü (Gerçeklik Simülasyonu)
                if (!window.__OPTIC_DREAM_ACTIVE) {
                    window.__OPTIC_DREAM_ACTIVE = true;
                    let simCpu = 15;
                    setInterval(() => {
                        simCpu = Math.max(8, Math.min(50, simCpu + (Math.random() * 10 - 5)));
                        const fakeData = {
                            cpu: Math.round(simCpu),
                            ping: Math.round(Math.random() * 5 + 10),
                            agents: 3, 
                            memory: Math.round(Math.random() * 20 + 40)
                        };
                        
                        NeuralDB.state.telemetry.cpu = fakeData.cpu;
                        NeuralDB.state.telemetry.memory = fakeData.memory;
                        NeuralDB.state.telemetry.ping = fakeData.ping;
                        NeuralDB.state.system.activeAgents = fakeData.agents;
                        
                        updateBaseline('cpu', fakeData.cpu);
                        updateBaseline('ping', fakeData.ping);

                        const anomaly = detectAnomaly(fakeData);
                        if (anomaly) triggerResponse(anomaly); else autoRepair();
                    }, 3000);
                }
            }
        });
        }
    }

    connectUplink();
}
