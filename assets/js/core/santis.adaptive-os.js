/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V44.0
 * Modül: ADAPTIVE INTELLIGENCE & CAUSAL INTEGRITY (Synaptic Core)
 * "Sistem artık tahmin etmiyor. Öğreniyor, yargılıyor ve adapte oluyor."
 * =======================================================
 */

// ==========================================
// 🧬 1. BEHAVIORAL ORACLE (Kullanıcı Kas Hafızası Profili)
// ==========================================
export class BehavioralOracle {
    constructor() {
        this.profile = {
            aggression: 0.5,    // 0.0 (Sakin) - 1.0 (Vahşi/Agresif kaydırma)
            rhythmError: 0,     // Kullanıcının ritmini ne kadar yanlış tahmin ettik?
            confidence: 1.0     // Phantom Confidence Score
        };
        this.history = [];
    }

    // Her etkileşimde kullanıcının DNA'sını çıkar ve öğren
    learn(actualVelocity, predictedVelocity) {
        const error = Math.abs(actualVelocity - predictedVelocity);
        const acceleration = Math.abs(actualVelocity - (this.history[0] || 0));

        this.history.unshift(actualVelocity);
        if (this.history.length > 10) this.history.pop();

        // Üstel Hareketli Ortalama (EMA) ile kullanıcının Agresifliğini öğren
        this.profile.aggression = (this.profile.aggression * 0.9) + (Math.min(acceleration, 10) / 10 * 0.1);
        
        // Hata payını öğren (Kullanıcı aniden duruyorsa rhythmError fırlar)
        this.profile.rhythmError = (this.profile.rhythmError * 0.8) + (error * 0.2);

        // Kâhin (Oracle) Kararı: Kullanıcı çok dengesizse, Tahmin Güvenini (Confidence) düşür!
        this.profile.confidence = Math.max(0.1, 1.0 - (this.profile.rhythmError / 50) - (this.profile.aggression * 0.3));
        
        // UI'a anlık güveni fısılda (Görsel degrade işlemleri için)
        document.documentElement.style.setProperty('--sdcr-confidence', this.profile.confidence.toFixed(2));
    }

    // Otonom olarak tahmin çarpanını belirle 
    getPredictiveMultiplier() {
        return 1.0 + (0.25 * this.profile.aggression * this.profile.confidence);
    }
}

// ==========================================
// 🌐 2. MESH REPUTATION SYSTEM (Darwinian Trust Matrix)
// ==========================================
export class MeshReputationSystem {
    constructor() {
        this.peers = new Map(); // peerId -> Trust Score (0.0 - 1.0)
    }

    // Ağdan gelen her durumu, mutlak gerçekle kıyasla ve Puanla
    evaluatePeer(peerId, peerState, localTruth, latencyMs) {
        let trust = this.peers.get(peerId) || 1.0;
        const driftContribution = Math.abs(peerState - localTruth);

        // Ceza Mekanizması: Yüksek sapma (Yalan) veya Yüksek Ping (Gecikme) güveni anında kırar
        if (driftContribution > 0.5 || latencyMs > 200) {
            trust *= 0.85; // %15 Güven kaybı
        } else {
            trust = Math.min(1.0, trust + 0.05); // Dürüstlük ödüllendirilir (+%5 Recovery)
        }

        this.peers.set(peerId, trust);

        // 🚨 İHRAÇ PROTOKOLÜ (Quarantine): Güven %30'un altına düşerse Node sessize alınır!
        if (trust < 0.3) {
            console.warn(`☣️ [MESH DARWINISM] Peer [${peerId}] izole edildi! (Trust: ${(trust*100).toFixed(0)}%). Ağ gerçekliğini yozlaştırıyor.`);
        }
    }

    getConsensusWeight(peerId) {
        const trust = this.peers.get(peerId) || 0;
        return trust > 0.3 ? trust : 0; 
    }
}

// ==========================================
// 🔗 3. EVENT CAUSALITY CHAIN (Nedensellik Ağı)
// ==========================================
export class CausalityTracker {
    constructor() {
        this.lineage = new Map();
    }

    track(eventId, source, payload, parentEventId = null) {
        this.lineage.set(eventId, {
            id: eventId,
            parentId: parentEventId,
            source: source,
            timestamp: performance.now(),
            depth: parentEventId ? (this.lineage.get(parentEventId)?.depth || 0) + 1 : 0
        });

        if (this.lineage.size > 500) {
            this.lineage.delete(this.lineage.keys().next().value); 
        }
    }

    traceOrigin(eventId) {
        const trace = [];
        let current = this.lineage.get(eventId);
        while (current) {
            trace.push(current);
            current = this.lineage.get(current.parentId);
        }
        return trace;
    }
}

// ==========================================
// 🧯 4. AUTO-DEGRADE GOVERNOR (Otonom Çöküş Koruması)
// ==========================================
export class AutoDegradeGovernor {
    constructor(errorBudget) {
        this.errorBudget = errorBudget;
        this.SYSTEM_MODE = 'ILLUSION_ACTIVE'; 
    }

    evaluateHealth(driftAccumulator, confidenceScore) {
        const exhaustion = driftAccumulator / this.errorBudget;

        // Bütçe %80'i aştıysa VEYA Kâhin güveni %20'nin altına indiyse: SAFE_MODE
        if (exhaustion > 0.8 || confidenceScore < 0.2) {
            if (this.SYSTEM_MODE !== 'SAFE_MODE') {
                console.error(`🛡️ [AUTO-DEGRADE] İllüzyon Çöktü (Confidence: ${(confidenceScore*100).toFixed(0)}%). SAFE_MODE aktif!`);
                this.SYSTEM_MODE = 'SAFE_MODE';
                this._triggerSafeMode();
            }
        } 
        // Bütçe yarılandıysa: DEGRADED MOD
        else if (exhaustion > 0.5 || confidenceScore < 0.6) {
            if (this.SYSTEM_MODE !== 'DEGRADED') {
                console.warn(`⚠️ [AUTO-DEGRADE] Güven Düşük. İllüzyon zayıflatılıyor (DEGRADED)...`);
                this.SYSTEM_MODE = 'DEGRADED';
                this._triggerDegradedMode();
            }
        } 
        // Sistem Stabilse: ILLUSION_ACTIVE
        else {
            if (this.SYSTEM_MODE !== 'ILLUSION_ACTIVE') {
                console.log(`🌱 [AUTO-RECOVERY] Güven Onarıldı. İllüzyon Motoru tam güçte (ILLUSION_ACTIVE).`);
                this.SYSTEM_MODE = 'ILLUSION_ACTIVE';
                this._restoreIllusion();
            }
        }
        return this.SYSTEM_MODE;
    }

    _triggerSafeMode() {
        window.__SDCR_CHRONOS_LERP = 1.0; 
        document.documentElement.setAttribute('data-sdcr-mode', 'SAFE');
    }

    _triggerDegradedMode() {
        window.__SDCR_CHRONOS_LERP = 0.5; 
        document.documentElement.setAttribute('data-sdcr-mode', 'DEGRADED');
    }

    _restoreIllusion() {
        window.__SDCR_CHRONOS_LERP = 0.15; 
        document.documentElement.setAttribute('data-sdcr-mode', 'ILLUSION');
    }
}
