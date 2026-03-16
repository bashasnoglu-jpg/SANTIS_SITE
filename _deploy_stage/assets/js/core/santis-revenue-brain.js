/**
 * PROTOCOL 31: THE REVENUE BRAIN (Cognitive Yield Engine)
 * 
 * Calculates dynamic pricing multipliers (Yield) and Cognitive Upsells 
 * based on the user's intent (Ghost Score) and current system capacity.
 */

if (typeof window.SantisRevenueBrainClass === 'undefined') {
    window.SantisRevenueBrainClass = class {
        constructor() {
            this.baseMultiplier = 1.0;
            this.surgeActive = false;

            // Simulating backend / Oracle capacity stream
            // In reality, this would be fetched via Ghost Thread every few minutes
            this.systemDemand = this.fetchSystemDemand();

            if (this.systemDemand > 0.8) {
                this.surgeActive = true;
                console.log(`📈 [Revenue Brain] Surge Active: ${(this.systemDemand * 100).toFixed(0)}% Capacity`);
            }

            console.log("💰 [Revenue Brain] Protocol 31 Core Booting: Cognitive Yield Engine Online.");
        }

        fetchSystemDemand() {
            // Mocking demand randomly between 0.4 (empty) to 0.95 (fully booked)
            // Usually, this comes from an API
            return 0.6 + (Math.random() * 0.35);
        }

        getGhostScore() {
            try {
                return parseInt(sessionStorage.getItem('santis_ghost_score') || '0', 10);
            } catch (e) {
                return 0;
            }
        }

        /**
         * Calculates the optimized price for the specific guest.
         * @param {number|string} basePrice - The raw price string or number
         * @returns {string} - The dynamically calculated price format (e.g. "149")
         */
        calculateYield(basePriceRaw) {
            if (!basePriceRaw || basePriceRaw === '') return basePriceRaw;

            let basePrice = typeof basePriceRaw === 'string' ? parseFloat(basePriceRaw.replace(/[^0-9.]/g, '')) : basePriceRaw;

            if (isNaN(basePrice)) return basePriceRaw;

            const ghostScore = this.getGhostScore();
            let multiplier = 1.0;

            // 1. Demand Logic (Capacity based)
            if (this.surgeActive) {
                multiplier += 0.05; // Base 5% increase if busy
            } else if (this.systemDemand < 0.5) {
                multiplier -= 0.05; // 5% discount if empty to fill rooms
            }

            // 2. Cognitive Persona Logic (AOV Maximization)
            if (ghostScore >= 80) {
                // "Whale/Sovereign" - High intent, low price sensitivity.
                // Give them a premium "Royal" margin (+10%), but offer exceptional service
                multiplier += 0.10;
            } else if (ghostScore > 40 && ghostScore < 80) {
                // "Engaged" - Standard pricing
                multiplier += 0.00;
            } else if (ghostScore <= 40) {
                // "Explorer/Cold" - Highly price sensitive. Offer a slight discount to convert.
                multiplier -= 0.05;
            }

            let calculatedPrice = basePrice * multiplier;

            // Luxe Rounding (Always ends in 0, 5, or 9 for psychological pricing)
            return this.luxeRound(calculatedPrice);
        }

        luxeRound(val) {
            const rounded = Math.round(val);
            const lastDigit = rounded % 10;

            // Push prices to luxurious anchor points
            if (lastDigit >= 1 && lastDigit <= 3) return rounded - lastDigit; // 152 -> 150
            if (lastDigit == 4 || lastDigit == 6) return rounded - lastDigit + 5; // 154 -> 155
            if (lastDigit >= 7) return rounded - lastDigit + 9; // 158 -> 159

            return rounded;
        }

        /**
         * Cognitive Upsell Bundle Logic
         */
        getCognitiveUpsell(primaryServiceId) {
            // Mocks a brain logic: If they buy A, recommend B dynamically.
            const recommendations = {
                'signature-rituel': { label: 'Aroma Therapy Add-on', priceRaw: 50 },
                'hamam-pasa': { label: 'Gold Mask Finish', priceRaw: 75 },
                'cilt-bakimi': { label: 'Eye Contour Lift', priceRaw: 45 }
            };

            const upsell = recommendations[primaryServiceId];
            if (!upsell) return null;

            // Run the upsell through the Yield Engine too
            return {
                label: upsell.label,
                price: this.calculateYield(upsell.priceRaw)
            };
        }
    }
}

// OS Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!window.santisRevenueBrain && window.SantisRevenueBrainClass) {
        window.santisRevenueBrain = new window.SantisRevenueBrainClass();
    }
});
