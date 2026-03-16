/**
 * SANTIS OMNI-OS - SESSION INTELLIGENCE (v4.1 Mega)
 * Ultra-precise VIP Tracker and WA String Formatter
 */

const SantisSession = {
    sid: null,
    isVIP: false,
    visitCount: 0,
    pageName: "unknown",

    init() {
        // Extract page name cleanly or default to 'index'
        const pathArray = window.location.pathname.split("/");
        let page = pathArray.pop().replace(".html", "") || "index";

        // If it was just a slash (folder), try getting the folder name
        if (page === "index" && pathArray.length > 1) {
            page = pathArray.pop();
        }

        this.pageName = page;

        this.trackVisits();
        this.generateSID();
        console.log(`[Omni-OS Session] Session ID: ${this.sid} | VIP: ${this.isVIP} | Returns: ${this.visitCount}`);
    },

    trackVisits() {
        let visits = localStorage.getItem("santis_visits") || 0;
        visits = parseInt(visits) + 1;
        localStorage.setItem("santis_visits", visits);
        this.visitCount = visits;

        // If visited more than 2 times, or manually flagged
        if (visits > 2 || localStorage.getItem("santis_vip") === "true") {
            this.isVIP = true;
            localStorage.setItem("santis_vip", "true");
        }
    },

    generateSID() {
        let savedSid = sessionStorage.getItem("santis_sid");
        if (!savedSid) {
            savedSid = Math.floor(1000 + Math.random() * 9000); // 4-digit code
            sessionStorage.setItem("santis_sid", savedSid);
        }
        this.sid = savedSid;
    },

    getTimeContext() {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 6) return "NIGHT";
        if (hour >= 6 && hour < 12) return "MORNING";
        return "DAY";
    },

    getWhatsAppPayload(offerCode) {
        const timeCtx = this.getTimeContext();
        const pageClean = this.pageName.toUpperCase();
        let hotelStr = "GLOBAL";

        if (window.SantisOS && window.SantisOS.hotel.id !== "default") {
            hotelStr = window.SantisOS.hotel.name.toUpperCase();
        }

        // Final Output Example: ?text=VIP Offer Deep Tissue %0A SID-8421 %0A PAGE-THAI %0A TIME-NIGHT %0A HOTEL-AKRA
        const textStr = `VIP Offer ${offerCode}\nHOTEL-${hotelStr}\nSID-${this.sid}\nPAGE-${pageClean}\nTIME-${timeCtx}`;

        return `?text=${encodeURIComponent(textStr)}`;
    }
};

document.addEventListener("DOMContentLoaded", () => SantisSession.init());
