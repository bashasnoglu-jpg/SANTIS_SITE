/**
 * SANTIS BOOKING MODULE
 * Extracted from app.js for modularity.
 * Handles Booking Modal, Form Submission, and WhatsApp logic.
 */

// Global Utils embedded for module references (if not already global)
// Assuming variables like 'state', 't', 'CONTENT', 'getHotels' are available globally from app.js or core logic.
// We must ensure they are accessible.
// 'state' is defined in app.js. 
// If this script loads BEFORE app.js, 'state' might not be defined during parsing if top-level code runs.
// But these are FUNCTIONS. They run only when called. 
// By the time they are called (e.g. openBookingModal), app.js should have initialized 'state'.

function openBookingModal() {
    const modal = document.getElementById("bookingModal");
    if (!modal) return;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    // Reset/Hide alerts
    if (typeof hideAlert === "function") {
        hideAlert("bookingAlert");
        hideAlert("formAlert");
    }

    const successBox = document.getElementById("successBox");
    if (successBox) {
        successBox.classList.remove("show");
        successBox.textContent = "";
    }

    const waBtn = document.getElementById("shareWhatsappBtn");
    if (waBtn) waBtn.style.display = "none";

    renderBookingUI();
    updateWhatsappPreview();

    setTimeout(() => {
        const h = document.getElementById("bookHotel");
        if (h) h.focus();
    }, 50);

    window.addEventListener("keydown", escCloseOnce);
}

function closeBookingModal() {
    const modal = document.getElementById("bookingModal");
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    window.removeEventListener("keydown", escCloseOnce);
}

function escCloseOnce(e) {
    if (e.key === "Escape") closeBookingModal();
}

function renderBookingUI() {
    // Titles
    const titleEl = document.getElementById("bookingModalTitle");
    if (titleEl) titleEl.textContent = t("booking.title");

    const selectedHotel = getSelectedHotel();
    const hotelName = selectedHotel ? (selectedHotel.translations?.[state.lang]?.name || selectedHotel.translations?.tr?.name) : "Santis Club";

    const subEl = document.getElementById("bookingModalSub");
    if (subEl) subEl.textContent = hotelName;

    const waPanel = document.getElementById("waPanelTitle");
    if (waPanel) waPanel.textContent = t("booking.buttons.whatsapp");

    const formPanel = document.getElementById("formPanelTitle");
    if (formPanel) formPanel.textContent = t("booking.title");

    // Labels
    const labels = {
        lblBookHotel: "booking.fields.hotel",
        lblBookService: "booking.fields.service",
        lblBookDate: "booking.fields.date",
        lblBookTime: "booking.fields.time",
        lblBookPeople: "booking.fields.guests",
        lblBookRoom: "booking.fields.room",
        lblBookNotes: "booking.fields.notes",
        lblFullName: "booking.fields.name",
        lblPhone: "booking.fields.phone",
        lblFormNotes: "booking.fields.notes"
    };

    for (const [id, key] of Object.entries(labels)) {
        const el = document.getElementById(id);
        if (el) el.textContent = t(key);
    }

    const privacy = document.getElementById("txtConsentPrivacy");
    if (privacy) privacy.textContent = t("booking.fields.agree_privacy");

    const terms = document.getElementById("txtConsentTerms");
    if (terms) terms.textContent = t("booking.fields.agree_cancel");

    // Buttons
    const waBtn = document.getElementById("whatsappBtn");
    if (waBtn) waBtn.textContent = t("booking.buttons.whatsapp");

    const subBtn = document.getElementById("submitFormBtn");
    if (subBtn) subBtn.textContent = t("booking.buttons.submit");

    // Hotel Select
    const bookHotel = document.getElementById("bookHotel");
    if (bookHotel) {
        bookHotel.innerHTML = "";
        const opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = "—";
        bookHotel.appendChild(opt0);

        for (const h of getHotels()) {
            const opt = document.createElement("option");
            opt.value = h.slug;
            opt.textContent = h.translations?.[state.lang]?.name || h.translations?.tr?.name || h.slug;
            bookHotel.appendChild(opt);
        }

        bookHotel.value = state.hotel || "";
        bookHotel.onchange = () => {
            renderServiceSelectInModal();
            updateWhatsappPreview();
        };
    }

    renderServiceSelectInModal();
    updateWhatsappPreview();

    // Wire inputs
    const watchIds = ["bookDate", "bookTime", "bookPeople", "bookRoom", "bookNotes"];
    watchIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", updateWhatsappPreview);
    });

    const copyBtn = document.getElementById("copyMsgBtn");
    if (copyBtn) {
        copyBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(document.getElementById("waPreview").value || "");
                alert(t("ui.copied") || "Copied");
            } catch (e) { console.error(e); }
        };
    }

    if (subBtn) subBtn.onclick = submitOnlineForm;
}

function renderServiceSelectInModal() {
    const bookService = document.getElementById("bookService");
    const bookHotel = document.getElementById("bookHotel");

    if (!bookService || !bookHotel) return;

    const hotelSlug = bookHotel.value;
    const hotelObj = getHotels().find(h => h.slug === hotelSlug);

    bookService.innerHTML = "";

    if (!hotelSlug) {
        bookService.disabled = true;
        const opt = document.createElement("option");
        opt.textContent = "—";
        bookService.appendChild(opt);
        return;
    }

    bookService.disabled = false;

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "—";
    bookService.appendChild(opt0);

    const services = CONTENT?.global?.services || {};
    const featured = hotelObj?.featuredServices || [];

    // Featured Group
    if (featured.length) {
        const g1 = document.createElement("optgroup");
        g1.label = t("sections.topPicks") || "Top Picks";
        featured.forEach(sid => {
            if (services[sid]) {
                const opt = document.createElement("option");
                opt.value = sid;
                opt.textContent = services[sid].name?.[state.lang] || services[sid].name?.tr;
                g1.appendChild(opt);
            }
        });
        bookService.appendChild(g1);
    }

    // All Group
    const g2 = document.createElement("optgroup");
    g2.label = t("booking.serviceGroups.otherServices") || "Others";
    Object.keys(services).forEach(sid => {
        if (!featured.includes(sid)) {
            const opt = document.createElement("option");
            opt.value = sid;
            opt.textContent = services[sid].name?.[state.lang] || services[sid].name?.tr;
            g2.appendChild(opt);
        }
    });
    bookService.appendChild(g2);

    if (state.selectedServiceId) bookService.value = state.selectedServiceId;
    bookService.onchange = updateWhatsappPreview;
}

function getBookingVars() {
    const hotelSlug = document.getElementById("bookHotel").value;
    const serviceId = document.getElementById("bookService").value;

    const hotelObj = getHotels().find(h => h.slug === hotelSlug);
    const hotelName = hotelObj ? (hotelObj.translations?.[state.lang]?.name || hotelObj.translations?.tr?.name) : "";

    const serviceObj = (CONTENT?.global?.services || {})[serviceId];
    const serviceName = serviceObj ? (serviceObj.name?.[state.lang] || serviceObj.name?.tr) : "";

    return {
        hotelSlug,
        serviceId,
        hotelName,
        serviceName,
        date: document.getElementById("bookDate").value || "",
        time: document.getElementById("bookTime").value || "",
        people: document.getElementById("bookPeople").value || "",
        room: document.getElementById("bookRoom").value || "",
        notes: document.getElementById("bookNotes").value || ""
    };
}

function updateWhatsappPreview() {
    if (typeof hideAlert === "function") hideAlert("bookingAlert");

    const vars = getBookingVars();
    const btn = document.getElementById("whatsappBtn");

    if (!vars.hotelSlug || !vars.serviceId) {
        if (btn) {
            btn.classList.add("disabled");
            btn.href = "#";
        }
        return;
    }

    if (btn) btn.classList.remove("disabled");

    const msg = buildWhatsappMessage(vars);
    // WhatsApp iletişim numarası (Santis Club Ana Hat)
    const waNumber = "905348350169";
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

    if (btn) btn.href = waLink;

    const pv = document.getElementById("waPreview");
    if (pv) pv.value = msg;
}

function buildWhatsappMessage(vars) {
    const tpl = t("booking.whatsapp_template");
    const msg = tpl
        .replace("{hotel}", vars.hotelName)
        .replace("{service}", vars.serviceName)
        .replace("{date}", vars.date)
        .replace("{time}", vars.time)
        .replace("{guests}", vars.people)
        .replace("{kisi}", vars.people)
        .replace("{name}", vars.hotelName)
        .replace("{url}", window.location.href);

    return cleanWhatsappMessage(msg);
}

function cleanWhatsappMessage(msg) {
    return msg.split("\n").filter(line => {
        const t = line.trim();
        if (!t) return false;
        if (t.includes("{notes}") || t.includes("{priceTime}")) return false;
        return true;
    }).join("\n");
}

function submitOnlineForm() {
    const vars = getBookingVars();
    if (!vars.hotelSlug || !vars.serviceId) {
        if (typeof showAlert === "function") showAlert("formAlert", "Hotel/Service required");
        return;
    }

    const ref = "SC-" + Math.floor(Math.random() * 900000);
    const box = document.getElementById("successBox");
    if (box) {
        box.textContent = `Booking Received! Ref: ${ref}`;
        box.classList.add("show");
    }
}

// Simple Alerts (Local)
function showAlert(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add("show"); }
}

function hideAlert(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = ""; el.classList.remove("show"); }
}
