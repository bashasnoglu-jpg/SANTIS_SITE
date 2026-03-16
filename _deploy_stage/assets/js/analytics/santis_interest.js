/**
 * SANTIS OMNI-OS - SMART RITUAL TRACKER (v4.5)
 * Silently records user interest across Hammam, Massage, and Skincare.
 */

const SantisInterest = {
    profile: {
        hammam: false,
        massage: false,
        skincare: false
    },

    init() {
        this.loadProfile();
        this.bindEvents();
        console.log("[Omni-OS Ritual] Active Profile:", this.profile);
    },

    loadProfile() {
        const saved = localStorage.getItem("santis_ritual_profile");
        if (saved) {
            this.profile = JSON.parse(saved);
        }
    },

    saveProfile() {
        localStorage.setItem("santis_ritual_profile", JSON.stringify(this.profile));
        console.log("[Omni-OS Ritual] Profile Updated:", this.profile);
    },

    registerInterest(category) {
        if (this.profile[category] === false) {
            this.profile[category] = true;
            this.saveProfile();
        }
    },

    bindEvents() {
        // Find all links or buttons that might indicate a service interest
        // Use standard data-service attributes or rely on href parsing
        document.addEventListener("click", (e) => {
            const el = e.target.closest("a, button, .bento-card");
            if (!el) return;

            const href = el.getAttribute("href") || el.dataset.href || "";
            const serviceData = el.dataset.service; // Direct tagging if available

            let clickedCat = null;

            if (serviceData) {
                clickedCat = serviceData;
            } else if (href) {
                if (href.includes("hamam") || href.includes("hammam")) clickedCat = "hammam";
                else if (href.includes("masaj") || href.includes("massage")) clickedCat = "massage";
                else if (href.includes("cilt") || href.includes("skin") || href.includes("sothys")) clickedCat = "skincare";
            }

            if (clickedCat) {
                this.registerInterest(clickedCat);
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", () => SantisInterest.init());
