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



/* ==========================================================================
   PHASE V7: THE SOVEREIGN HAND-OFF (SHADOW CART ENJECTION & MODAL BUILDER)
   ========================================================================== */

function injectBookingModal() {
    if (document.getElementById('bookingModal')) return;

    console.log("🕯️ [Sovereign Hand-Off] Injecting VIP Booking Modal Protocol...");

    // Yüksek lüks algısı (Sovereign CSS Zırhı ve Euro formatına uygun VIP Modal)
    const modalHTML = `
    <div class="modal-overlay VIP_SOVEREIGN" id="bookingModal" hidden aria-hidden="true" style="z-index:999999; backdrop-filter:blur(15px); background:rgba(0,0,0,0.85); display:none; align-items:center; justify-content:center; position:fixed; inset:0; flex-direction:column;">
        <div class="modal-content" style="background:#050505; border:1px solid rgba(212,175,55,0.3); box-shadow:0 25px 50px -12px rgba(0,0,0,1), 0 0 30px rgba(212,175,55,0.1); border-radius:12px; padding:32px; width:90%; max-width:500px; color:#fff; font-family:'Outfit', sans-serif; position:relative;">
            <button id="bookingCloseBtn" onclick="closeBookingModal()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:rgba(255,255,255,0.5); font-size:24px; cursor:pointer;" aria-label="Kapat">&times;</button>
            <div style="text-align:center; margin-bottom:24px;">
                <span class="nv-kicker" style="color:#D4AF37; font-size:11px; letter-spacing:0.2em; text-transform:uppercase;">SANTIS CLUB VIP</span>
                <h2 id="bookingModalTitle" style="font-family:'Cinzel', serif; font-size:24px; margin-top:8px; font-weight:400; letter-spacing:0.05em;">THE BLACK ROOM</h2>
                <p id="bookingModalSub" style="color:rgba(255,255,255,0.6); font-size:13px; margin-top:4px;">Sovereign Executive</p>
            </div>
            
            <div class="booking-form-grid" style="display:flex; flex-direction:column; gap:16px;">
                <select id="bookHotel" style="width:100%; padding:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; outline:none; -webkit-appearance:none; font-family:'Outfit', sans-serif; font-size:14px; cursor:pointer;" aria-label="Konum">
                    <option value="santis_hq">Santis Club HQ [Merkez]</option>
                </select>
                <select id="bookService" style="width:100%; padding:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#D4AF37; border-radius:6px; outline:none; -webkit-appearance:none; font-family:'Outfit', sans-serif; font-size:14px; font-weight:500; cursor:pointer;" aria-label="Paket Adı">
                    <option value="">Lütfen Bekleyin...</option>
                </select>
                <div style="display:flex; gap:16px;">
                    <input type="date" id="bookDate" style="width:100%; padding:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; outline:none; font-family:'Outfit', sans-serif; font-size:14px; color-scheme:dark;" aria-label="Tarih">
                    <input type="time" id="bookTime" style="width:100%; padding:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; outline:none; font-family:'Outfit', sans-serif; font-size:14px; color-scheme:dark;" aria-label="Saat">
                </div>
                <div style="display:flex; gap:16px;">
                    <input type="number" id="bookPeople" min="1" max="4" placeholder="Kişi Sayısı" style="width:100%; padding:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; outline:none; font-family:'Outfit', sans-serif; font-size:14px;" aria-label="Kişi">
                    <input type="text" id="bookRoom" placeholder="Oda No (Opsiyonel)" style="width:100%; padding:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; outline:none; font-family:'Outfit', sans-serif; font-size:14px;" aria-label="Oda No">
                </div>
                
                <!-- COGNITIVE UPSELL CONTAINER -->
                <div id="cognitiveUpsellContainer" style="display:none; background:rgba(212,175,55,0.05); border:1px solid rgba(212,175,55,0.2); padding:12px; border-radius:6px; margin-bottom:4px; font-family:'Outfit', sans-serif;"></div>

                <textarea id="bookNotes" rows="3" placeholder="Sistem Mührü" style="width:100%; padding:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(212,175,55,0.2); color:#D4AF37; border-radius:6px; outline:none; font-family:'Courier New', monospace; font-size:12px; resize:none;" aria-label="Mühür / Notlar"></textarea>
                
                <textarea id="waPreview" hidden aria-hidden="true"></textarea>
                
                <button id="whatsappBtn" onclick="window.submitShadowCart()" style="width:100%; background:#D4AF37; color:#000; padding:16px; border:none; border-radius:6px; font-family:'Cinzel', serif; font-size:14px; font-weight:700; letter-spacing:0.1em; cursor:pointer; margin-top:8px; transition:all 0.3s ease;">
                    WHATSAPP İLE REZERVE ET
                </button>
                <div id="bookingAlert" style="display:none; text-align:center; margin-top:12px; font-size:13px; color:#ef4444;">Form eksik. Lütfen kontrol edin.</div>
                <div id="formAlert" style="display:none;"></div>
                <div id="successBox" style="display:none;"></div>
                <h3 id="waPanelTitle" hidden></h3>
                <h3 id="formPanelTitle" hidden></h3>
                <button id="shareWhatsappBtn" hidden></button>
                <button id="copyMsgBtn" hidden></button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Kapatma işlevlerini güvenli hale getir
    const modal = document.getElementById('bookingModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeBookingModal();
    });
}

window.addVirtualSku = function (offerObj) {
    if (!offerObj || !offerObj.virtual_sku) return;

    injectBookingModal();

    console.log("💎 [Shadow Cart] Injecting Virtual SKU:", offerObj.virtual_sku);

    // 1. Ziyaretçinin Niyetini 'Black Room' moduna geçir
    window.state = window.state || {};
    window.state.shadow_cart = offerObj;

    // 2. VIP Formu Aç (Dışa Bağımlılık Yok - Tamamen İzole)
    const modal = document.getElementById("bookingModal");
    if (modal) {
        modal.classList.add("open");
        modal.removeAttribute("hidden");
        modal.setAttribute("aria-hidden", "false");
        modal.style.setProperty("display", "flex", "important"); // Override all
        modal.style.setProperty("opacity", "1", "important");
        modal.style.setProperty("visibility", "visible", "important");
        modal.style.zIndex = "2147483647"; // Maksimum Z-Index

        // Hide standard alerts safely (No app.js crash risk)
        if (typeof hideAlert === "function") {
            try { hideAlert("bookingAlert"); hideAlert("formAlert"); } catch (e) { }
        }

        const successBox = document.getElementById("successBox");
        if (successBox) {
            successBox.classList.remove("show");
            successBox.textContent = "";
        }
    }

    // 3. UI Bypass (Drop-down'ları sabitleyip Gölge Ürünü basmak)
    setTimeout(() => {
        const hotelSelect = document.getElementById("bookHotel");
        const serviceSelect = document.getElementById("bookService");

        if (hotelSelect) {
            hotelSelect.value = "santis_hq"; // Merkez
            hotelSelect.disabled = true; // Kilit
        }

        if (serviceSelect) {
            // Standart hizmetleri sil ve Özel Paketi dayat
            serviceSelect.innerHTML = "";
            const opt = document.createElement("option");
            opt.value = offerObj.virtual_sku;
            opt.textContent = `👑 ${offerObj.title} [€${offerObj.dynamic_price}]`;
            opt.selected = true;
            serviceSelect.appendChild(opt);
            serviceSelect.disabled = true;

            // Telemetri ve Form Notları için gizli mühür
            const notesEl = document.getElementById("bookNotes");
            if (notesEl) {
                notesEl.value = `[SOVEREIGN HAND-OFF]\nPaket: ${offerObj.title}\nFiyat: €${offerObj.dynamic_price}\nToken: ${offerObj.token}\nSKU: ${offerObj.virtual_sku}`;
                notesEl.readOnly = true;
            }

            renderCognitiveUpsell(offerObj.virtual_sku); // Tetikle

            // Preview'i Safe Bırak
            if (typeof updateWhatsappPreview === "function") {
                try { updateWhatsappPreview(); } catch (e) { }
            }
        }
    }, 150);
}

/* ==========================================================================
   ISOLATED BLACK ROOM WHATSAPP SENDER (NO DEPENDENCIES)
   ========================================================================== */
window.submitShadowCart = function () {
    const dateStr = document.getElementById("bookDate")?.value;
    const timeStr = document.getElementById("bookTime")?.value;

    const alertBox = document.getElementById("bookingAlert");
    if (!dateStr || !timeStr) {
        if (alertBox) {
            alertBox.style.display = "block";
            alertBox.textContent = "Lütfen Tarih ve Saat bilgisini giriniz.";
        }
        return;
    }
    if (alertBox) alertBox.style.display = "none";

    // Güvenli DOM Okuyucuları
    const hotel = document.getElementById("bookHotel")?.options?.[0]?.text || "Santis Club HQ";
    const service = document.getElementById("bookService")?.options?.[0]?.text || "Özel VIP Paket";
    const people = document.getElementById("bookPeople")?.value || "Belirtilmedi";
    const room = document.getElementById("bookRoom")?.value || "Belirtilmedi";
    const notes = document.getElementById("bookNotes")?.value || "";

    const offerObj = window.state?.shadow_cart;
    const priceVal = document.getElementById('accept-black-room-offer')?.dataset?.price || offerObj?.dynamic_price || offerObj?.eur_price || offerObj?.price || "";
    const priceStr = priceVal ? `€${priceVal}` : "Özel Sovereign Fiyatı";

    let hwMsg = `👑 *SANTIS CLUB - THE BLACK ROOM*\n\n`;
    hwMsg += `Yeni bir VIP Sovereign talebi oluşturuldu.\n\n`;
    hwMsg += `▪️ *Lokasyon:* ${hotel}\n`;
    hwMsg += `▪️ *Paket:* ${service}\n`;
    hwMsg += `▪️ *Sovereign Fiyatı:* ${priceStr}\n`;
    hwMsg += `▪️ *Tarih ve Saat:* ${dateStr} - ${timeStr}\n`;
    hwMsg += `▪️ *Kişi Sayısı:* ${people}\n`;

    // Append Upsell specifically for Shadow Cart Logic (if needed)
    const upsellCb = document.getElementById('checkCognitiveUpsell');
    if (upsellCb && upsellCb.checked) {
        const [uLabel, uPrice] = upsellCb.value.split('|');
        hwMsg += `▪️ *Aurelia Add-on:* ${uLabel} (+€${uPrice})\n`;
    }

    hwMsg += `\n*Mühür / Protokol:*\n${notes}\n\n`;
    hwMsg += `Lütfen uygunluk durumunu The War Room üzerinden teyit edin.`;

    const waNumber = "905348350169";
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(hwMsg)}`;

    window.location.href = waLink;
};



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

    if (modal.classList.contains("VIP_SOVEREIGN")) {
        modal.style.display = "none";
    }

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



    if (state.selectedServiceId) {
        bookService.value = state.selectedServiceId;
        renderCognitiveUpsell(state.selectedServiceId);
    }

    bookService.onchange = (e) => {
        renderCognitiveUpsell(e.target.value);
        updateWhatsappPreview();
    };
}



function getBookingVars() {

    const hotelSlug = document.getElementById("bookHotel").value;

    const serviceId = document.getElementById("bookService").value;



    const hotelObj = getHotels().find(h => h.slug === hotelSlug);

    const hotelName = hotelObj ? (hotelObj.translations?.[state.lang]?.name || hotelObj.translations?.tr?.name) : "";



    const serviceObj = (CONTENT?.global?.services || {})[serviceId];

    let serviceName = serviceObj ? (serviceObj.name?.[state.lang] || serviceObj.name?.tr) : "";

    // If Shadow Cart item
    if (!serviceName && window.state && window.state.shadow_cart && window.state.shadow_cart.virtual_sku === serviceId) {
        serviceName = window.state.shadow_cart.title;
    }

    // Append Cognitive Upsell to serviceName if selected
    const upsellCb = document.getElementById('checkCognitiveUpsell');
    let finalNotes = document.getElementById("bookNotes").value || "";

    if (upsellCb && upsellCb.checked) {
        const [uLabel, uPrice] = upsellCb.value.split('|');
        serviceName += ` + ${uLabel} (+€${uPrice})`;
    }

    return {

        hotelSlug,

        serviceId,

        hotelName,

        serviceName,

        date: document.getElementById("bookDate").value || "",

        time: document.getElementById("bookTime").value || "",

        people: document.getElementById("bookPeople").value || "",

        room: document.getElementById("bookRoom").value || "",

        notes: finalNotes

    };

}

/**
 * PROTOCOL 31: COGNITIVE UPSELL RENDERER
 * Fetch cross-sell packages mathematically suitable for the selected booking
 */
window.renderCognitiveUpsell = function (serviceId) {
    const upsellContainer = document.getElementById("cognitiveUpsellContainer");

    if (!serviceId || !window.santisRevenueBrain || !upsellContainer) {
        if (upsellContainer) upsellContainer.style.display = 'none';
        return;
    }

    const upsell = window.santisRevenueBrain.getCognitiveUpsell(serviceId);

    if (upsell) {
        upsellContainer.style.display = 'flex';
        upsellContainer.style.justifyContent = 'space-between';
        upsellContainer.style.alignItems = 'center';

        upsellContainer.innerHTML = `
            <div>
                <div style="font-size:10px; color:#D4AF37; letter-spacing:1px; text-transform:uppercase;">AURELIA ÖNERİYOR (VIP)</div>
                <div style="font-size:14px; color:#fff; font-weight:500;">${upsell.label}</div>
            </div>
            <div style="text-align:right; display:flex; align-items:center; gap:12px;">
                <div style="font-size:14px; color:#D4AF37; font-family:'Cinzel', serif; font-weight:600;">+€${upsell.price}</div>
                <input type="checkbox" id="checkCognitiveUpsell" value="${upsell.label}|${upsell.price}" style="width:20px; height:20px; accent-color:#D4AF37; cursor:pointer;">
            </div>
        `;

        // Dinamik güncelleme bağlantısı
        const checkbox = document.getElementById('checkCognitiveUpsell');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (typeof updateWhatsappPreview === "function") updateWhatsappPreview();
            });
        }
    } else {
        upsellContainer.style.display = 'none';
    }
};



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

