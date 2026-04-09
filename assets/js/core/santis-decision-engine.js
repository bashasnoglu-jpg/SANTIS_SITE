// /assets/js/core/santis-decision-engine.js

export class SantisDecisionEngine {
    constructor() {
        this.currentState = 'STATE_1_DISCOVERY';
        
        // 1. REVENUE MECHANICS LAYER (Gelir Motoru Ağırlıkları)
        this.scoringWeights = {
            marginWeight: 0.45,
            conversionWeight: 0.25,
            popularityWeight: 0.15,
            upgradeWeight: 0.15
        };

        // Hizmet Veritabanı (Intent -> Hero Mapping)
        this.services = [
            { id: 'hot_stone', intent: 'RELAX', margin: 85, conversion: 60, popularity: 70, upgrade: 50, isPremium: false },
            { id: 'deep_tissue', intent: 'RECOVERY', margin: 75, conversion: 85, popularity: 90, upgrade: 60, isPremium: false },
            { id: 'thai_massage', intent: 'MOBILITY', margin: 80, conversion: 50, popularity: 60, upgrade: 40, isPremium: false },
            { id: 'signature_deluxe', intent: 'SIGNATURE', margin: 95, conversion: 35, popularity: 40, upgrade: 90, isPremium: true }
        ];

        this.initIntelligenceLoop();
    }

    /** 2. EXPERIENCE STATE MACHINE (Akış Kontrolcüsü) */
    transitionTo(newState) {
        console.log(`[SANTIS OS] State Shift: ${this.currentState} -> ${newState}`);
        this.currentState = newState;
        if (window.SantisBus) {
            window.SantisBus.emit('system.state_changed', { state: this.currentState });
        }
    }

    /** 3. REVENUE SCORING (Otonom Gelir Optimizasyonu) */
    calculateSovereignChoice(activeIntent) {
        let scoredServices = this.services.map(service => {
            let score = 
                (service.margin * this.scoringWeights.marginWeight) +
                (service.conversion * this.scoringWeights.conversionWeight) +
                (service.popularity * this.scoringWeights.popularityWeight) +
                (service.upgrade * this.scoringWeights.upgradeWeight);

            // Intent Mapping Bonusu (Kullanıcının niyetine uygun olanı öne it)
            if (service.intent === activeIntent) score += 100;

            return { ...service, finalScore: score };
        });

        // En yüksek skoru alanı "Sovereign Choice" olarak belirle
        scoredServices.sort((a, b) => b.finalScore - a.finalScore);
        
        if (window.SantisBus) {
            window.SantisBus.emit('revenue.choice_calculated', { 
                sovereignChoice: scoredServices[0],
                decoyList: scoredServices.slice(1, 3) 
            });
        }

        return scoredServices[0];
    }

    /** 4. EXPERIENCE INTELLIGENCE LOOP (Davranışsal Zeka) */
    initIntelligenceLoop() {
        // SantisBus üzerinden gelen sensör verilerini dinle
        if (window.SantisBus) {
            window.SantisBus.on('telemetry.hover_intent', (data) => {
                if (data.durationSeconds > 8) {
                    console.warn(`[INTELLIGENCE LOOP] High hesitation detected on ${data.target}. Updating recommendation weights.`);
                    
                    // Kararsızlık anında Premium/Upsell ürünlerin ağırlığını geçici olarak artır
                    this.scoringWeights.upgradeWeight = 0.50; 
                    this.scoringWeights.popularityWeight = 0.05;
                    
                    // Ekranı anlık olarak yeniden render etmesi için UI'ı uyar
                    window.SantisBus.emit('intent.upgraded_by_system');
                }
            });
        } else {
             console.warn("[SANTIS OS] SantisBus is not loaded yet. Intelligence loop waiting...");
        }
    }
}
