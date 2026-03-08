/**
 * SANTIS OS - AURELIA CONCIERGE V2 (Sovereign AI)
 * Sessiz Lüksün Fısıltısı. FOMO değil, "Size Özel" deneyim.
 * Revenue Brain ve Intent Engine'den gelen Kuantum Skorlarını okur.
 */

export class AureliaConciergeV2 {
    constructor() {
        this.isActive = false;
        this.uiKnot = null; // Aurelia'nın DOM'daki varlığı (Chat ya da Notification balonu)

        console.log("🤖 [Aurelia V2] Sovereign Concierge Zekası Uyandı. Emirlerinizi bekliyor.");

        this.initDOM();
        this.mountListeners();

        // Revenue Brain'in arayacağı Global Kanca
        window.Aurelia = window.Aurelia || {};
        window.Aurelia.awaken = (data) => this.interceptRescue(data);
    }

    initDOM() {
        // Zaten varsa bir daha ekleme
        if (document.getElementById('aurelia-quantum-knot')) return;

        this.uiKnot = document.createElement('div');
        this.uiKnot.id = 'aurelia-quantum-knot';
        this.uiKnot.style.position = 'fixed';
        this.uiKnot.style.bottom = '30px';
        this.uiKnot.style.right = '30px';
        this.uiKnot.style.width = '350px';
        this.uiKnot.style.backgroundColor = 'rgba(10, 10, 9, 0.7)';
        this.uiKnot.style.border = '1px solid rgba(179, 155, 89, 0.3)';
        this.uiKnot.style.backdropFilter = 'blur(20px)';
        this.uiKnot.style.color = '#d1cbc1';
        this.uiKnot.style.padding = '20px';
        this.uiKnot.style.zIndex = '99999';
        this.uiKnot.style.opacity = '0';
        this.uiKnot.style.pointerEvents = 'none';
        this.uiKnot.style.transform = 'translateY(20px)';
        this.uiKnot.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'; // Sovereign Easing

        this.uiKnot.innerHTML = `
            <div style="display:flex; align-items:center; gap: 15px; margin-bottom: 10px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background-color:#b39b59; box-shadow: 0 0 10px #b39b59;"></div>
                <span style="font-family: monospace; font-size: 0.8rem; letter-spacing: 0.1em; color: #b39b59; text-transform: uppercase;">Aurelia Concierge</span>
            </div>
            <p id="aurelia-message" style="font-size: 0.95rem; line-height: 1.5; font-weight: 300;">Dinliyorum...</p>
            <div id="aurelia-actions" style="margin-top: 15px; display: none; gap: 10px;">
                <button style="background: transparent; color: #b39b59; border: 1px solid #b39b59; padding: 8px 15px; font-size: 0.8rem; cursor: pointer; text-transform: uppercase;">Ayrıcalığı Kullan</button>
            </div>
        `;

        document.body.appendChild(this.uiKnot);
    }

    mountListeners() {
        if (!window.Santis || !window.Santis.Bootloader) return;

        // Santis Event Bus kancaları (Gelecekteki yayınlar için)
        // window.Santis.Bus.on('intent:high', ...) vs. yüklenebilir.
    }

    /**
     * Revenue Brain'in "Exit Intent" (Sayfadan Çıkma) tespitinde tetiklediği Hayat Öpücüğü!
     * @param {Object} data - Skor ve tetikleyici bilgisi
     */
    interceptRescue(data = {}) {
        if (this.isActive) return;

        console.log(`🚁 [Aurelia V2] Kurtarma Operasyonu Başlıyor! (Gelen Skor: ${data.score || 'Bilinmiyor'})`);

        const messageEl = document.getElementById('aurelia-message');
        const actionsEl = document.getElementById('aurelia-actions');

        // Psikolojik Yaklaşım: Korkutmadan, lüks bir fısıltıyla teklif sun
        messageEl.innerText = "Gitmeden önce... İlgilendiğiniz terapi için size özel bir ayrılıcalık tanımlayabilirim. İster misiniz?";
        actionsEl.style.display = 'flex';

        this.awakenUI();
    }

    /**
     * Tereddüt eden (Hesitation) kullanıcıya Seal.js tarafından fırlatılan özel tetik.
     * Kullanıcı bir kartta çok uzun süre kalıp tıklamadığında (7 saniye sendromu).
     */
    handleHesitation(cardId) {
        if (this.isActive) return;

        console.log(`⏳ [Aurelia V2] Kullanıcı ${cardId} üzerinde tereddüt etti. Fısıldanıyor...`);

        const messageEl = document.getElementById('aurelia-message');
        const actionsEl = document.getElementById('aurelia-actions');

        messageEl.innerText = "Zamanın durduğu bu ritüelde kararsız mı kaldınız? Uzman terapistlerimize danışabilirsiniz.";
        actionsEl.style.display = 'flex';
        actionsEl.innerHTML = `<button onclick="window.CheckoutVault?.open()" style="background: #b39b59; color: #0a0a09; border: none; padding: 8px 15px; font-size: 0.8rem; cursor: pointer; text-transform: uppercase;">Mühürle</button>`;

        this.awakenUI();
    }

    awakenUI() {
        this.isActive = true;
        this.uiKnot.style.opacity = '1';
        this.uiKnot.style.pointerEvents = 'auto';
        this.uiKnot.style.transform = 'translateY(0)';

        // 10 saniye sonra fısıltı kaybolsun (Lüks çok ısrar etmez)
        setTimeout(() => this.sleepUI(), 10000);
    }

    sleepUI() {
        if (!this.isActive) return;

        this.uiKnot.style.opacity = '0';
        this.uiKnot.style.pointerEvents = 'none';
        this.uiKnot.style.transform = 'translateY(20px)';
        this.isActive = false;
        console.log("🤖 [Aurelia V2] Fısıltı Sönümlendi.");
    }
}

// Global Injector
window.AureliaConciergeV2 = AureliaConciergeV2;
document.addEventListener('DOMContentLoaded', () => {
    new AureliaConciergeV2();
});
