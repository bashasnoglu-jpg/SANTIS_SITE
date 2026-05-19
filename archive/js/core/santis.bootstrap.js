/**
 * =======================================================
 * SANTIS OS - V49.0
 * Kök Yükleyici (Cortex DAG Otonom Yükleyicisi)
 * =======================================================
 */
import { Cortex } from './santis-cortex-core.js';
import { AegisShield } from './santis.production-shield.js';

async function boot() {
    // 🛡️ 1. GÜVENLİK (Darwinian Aegis Katmanı)
    if (!AegisShield.init()) return;

    // 🌐 2. OTONOM KAYIT (Modülleri KARIŞIK SIRAYLA kaydetsen bile Cortex doğru sırayı bulur!)
    // NeuralBus (Temel Damar)
    Cortex.register('NeuralBus', [], async () => {
        const { NeuralBus } = await import('./sovereign-bus.js');
        NeuralBus.connect(); // Ağ bağlantısını kur
        return NeuralBus;
    });

    Cortex.register('QuantumRouter', [], async () => {
        const { SovereignRouter } = await import('./santis-quantum-router.js');
        return SovereignRouter;
    });

    // Zaman Bükücü (Chronos) - Hafıza (Bus/DB) olmadan ZAMAN BÜKÜLEMEZ!
    Cortex.register('ChronosEngine', ['NeuralBus'], async (NeuralBus) => {
        const { initChronosEngine } = await import('./santis-chronos-engine.js');
        return initChronosEngine(NeuralBus); 
    });

    // Optik Sinir - Beyin (Chronos) veya Bus uyanmadan AÇILAMAZ!
    Cortex.register('OpticNerve', ['ChronosEngine', 'NeuralBus'], async (Chronos, NeuralBus) => {
        const { initOpticNerve } = await import('./santis-optic-nerve.js');
        return initOpticNerve(NeuralBus);
    });

    // 👁️ Focus Engine - Dikkat manipülasyonu ve Haptic Feedback (AŞAMA 1 & 4)
    Cortex.register('FocusEngine', [], async () => {
        const { SantisFocusEngine } = await import('./santis-focus-engine.js');
        const focus = new SantisFocusEngine();
        focus.init();
        return focus;
    });

    // Risk Profiler (V6.2 Anticipation Engine Sensör Ağı) - Otonom Risk Skoru Üretir
    Cortex.register('RiskProfiler', ['NeuralBus'], async (NeuralBus) => {
        const { RiskProfiler } = await import('./santis-risk-profiler.js');
        return RiskProfiler.init(NeuralBus);
    });

    // Otorite Katmanı (Black Room) - Gözler, Ağ ve Risk İzleyici olmadan uyanamaz.
    Cortex.register('BlackRoomCore', ['OpticNerve', 'FocusEngine', 'QuantumRouter', 'NeuralBus', 'RiskProfiler'], async (Nerve, Focus, Router, NeuralBus, Profiler) => {
        const { initBlackRoomCore } = await import('./santis-blackroom-core.js');
        return initBlackRoomCore(NeuralBus);
    });

    // 🚀 3. KUSURSUZ UYANIŞI (THE BIG BANG) BAŞLAT
    try {
        const { MetaCortex } = await import('./santis-meta-cortex.js');
        const meta = new MetaCortex(Cortex);
        Cortex.meta = meta;

        // Biyolojik Evrim Döngüsü (Meta-Runtime State)
        Cortex.evolveCycle = async function(entryNodes) {
            let cycle = 0;
            while(cycle < 3) { // 3 Biyolojik Evre boyunca kendini optimize et
                await this.ignite(entryNodes);
                if (this.meta) {
                    this.meta.commitEvolution();
                    this.meta.optimize();
                }
                cycle++;
                await new Promise(r => setTimeout(r, 50)); 
            }
        };

        await Cortex.evolveCycle(['BlackRoomCore']);
        
        console.log("%c✅ [SECO ONLINE] Self-Evolving Computational Organism (DCR) Aktif.", "color: #10b981; font-weight: bold; font-size: 14px;");

        // 🔒 FINAL HARDENING (V17.2 — SAFE REALITY LOCK)
        const publicAPI = {
            version: "V17.2",
            ignite: Cortex.ignite.bind(Cortex)
            // Sadece tetikleme ucu dışa açık, geri kalan Graph gizli!
        };

        window.__SANTIS_RUNTIME__ = { 
            Cortex,     // İç referans (yaşıyor)
            NeuralDB: window.NeuralDB || {},
            publicAPI   // Dış erişim noktası
        };

        // 🛡️ PROXY SHIELD (Limit immutability to boundaries)
        function createImmutableProxy(target) {
            return new Proxy(target, {
                set() {
                    console.warn("⛔ [SANTIS SHIELD] Mutation blocked. Runtime is sovereign.");
                    return false;
                },
                deleteProperty() {
                    console.warn("⛔ [SANTIS SHIELD] Delete blocked. Graph is sealed.");
                    return false;
                }
            });
        }

        // 👑 TRUE (SAFE) SIGNATURE LOCK
        window.__SANTIS_RUNTIME__.publicAPI = createImmutableProxy(window.__SANTIS_RUNTIME__.publicAPI);
        console.log("🔒 [V17.2] Safe Reality Lock (Proxy Shield) engaged.");

    } catch (e) {
        AegisShield.triggerKillSwitch(e, 'CortexMetaEvolve');
    }
}

// Güvenli Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
