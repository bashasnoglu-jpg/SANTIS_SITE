/**
 * SANTIS OMNI-OS - OFFER ENGINE (v4.5 Smart Ritual Mega)
 * Frequency control, Cross-Sell logic, and Combo Offers.
 */

const SantisOffer = {
    trafficMode: "balanced",

    combos: {
        GRAND: {
            title: "Santis Royal Ritual",
            subtitle: "Traditional Hammam • Signature Massage • Skin Therapy. Size özel %10 ayrıcalıkla.",
            code: "GrandRitual"
        },
        RECOVERY: {
            title: "Recovery Ritual",
            subtitle: "Hammam • Deep Tissue Massage. Tüm stresinizden arının.",
            code: "ComboHM"
        },
        GLOW: {
            title: "Glow Ritual",
            subtitle: "Relax Massage • Luxury Facial. Cildinize ışıltı katacak dokunuşlar.",
            code: "ComboMS"
        },
        HAMMAM_GLOW: {
            title: "Cleansing Ritual",
            subtitle: "Geleneksel Hamam ritüeli ve ardından Lüks Cilt Bakımı.",
            code: "ComboHS"
        }
    },

    singles: {
        EVENING: {
            title: "VIP Evening Ritual",
            subtitle: "Sadece bu akşama özel ayrıcalık sunmak isteriz.",
            code: "EveningVIP"
        },
        UPGRADE: {
            title: "Private Privilege",
            subtitle: "Deneyiminizde ücretsiz VIP Oda ve Çay Seremonisi.",
            code: "RoomUp"
        }
    },

    evaluate(score) {
        // Frequency Control (Cooldown: 24 Hours)
        const lastShown = localStorage.getItem("santis_offer_timestamp");
        if (lastShown) {
            const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
            if (hoursSince < 24) {
                console.log(`[Offer Engine] Blocked by 24h Frequency Cooldown. (${hoursSince.toFixed(1)}h ago)`);
                return;
            }
        }

        let threshold = 45;
        if (score < threshold) return;

        let selectedOffer = null;

        // Smart Ritual Logic: Check Hotel Type first (Guest Segmentation V5)
        if (window.SantisOS && window.SantisOS.isReady) {
            const hType = window.SantisOS.hotel.type;
            if (hType === 'family') {
                selectedOffer = { title: "Mom & Kids Relax Ritual", subtitle: "Ailelere özel indirimli bakım paketi.", code: "FamilyRelax" };
            } else if (hType === 'adult') {
                selectedOffer = { title: "Couple Romance Ritual", subtitle: "Baş başa geçireceğiniz romantik bir SPA deneyimi.", code: "RomanceRitual" };
            }
        }

        // Smart Ritual Logic: Check interests if still undetermined
        if (!selectedOffer && window.SantisInterest) {
            const prof = SantisInterest.profile;

            // PRIORITY 1: 3-Way Combo
            if (prof.hammam && prof.massage && prof.skincare) {
                selectedOffer = this.combos.GRAND;
            }
            // PRIORITY 2: Hammam + Massage
            else if (prof.hammam && prof.massage) {
                selectedOffer = this.combos.RECOVERY;
            }
            // PRIORITY 3: Massage + Skincare
            else if (prof.massage && prof.skincare) {
                selectedOffer = this.combos.GLOW;
            }
            // PRIORITY 4: Hammam + Skincare
            else if (prof.hammam && prof.skincare) {
                selectedOffer = this.combos.HAMMAM_GLOW;
            }
        }

        // PRIORITY 5: Single / A-B Test
        if (!selectedOffer) {
            const rand = Math.random();
            selectedOffer = rand > 0.5 ? this.singles.EVENING : this.singles.UPGRADE;
        }

        // Fire UI
        if (window.FloatingConcierge) {
            localStorage.setItem("santis_offer_timestamp", Date.now().toString());
            console.log(`[Offer Engine] Firing Floating Concierge with Offer: ${selectedOffer.code}`);
            FloatingConcierge.show(selectedOffer);
        } else {
            console.warn("[Offer Engine] Floating Concierge UI module missing.");
        }
    }
};
