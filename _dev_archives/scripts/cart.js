/**

 * SANTIS CART SYSTEM v1.0

 * localStorage based simple cart

 */



const CART = {

    key: 'santis_cart_v1',

    items: [],



    init() {

        this.load();

        this.bindEvents();

        this.updateBadge();

    },



    load() {

        const stored = localStorage.getItem(this.key);

        if (stored) this.items = JSON.parse(stored);

    },



    save() {

        localStorage.setItem(this.key, JSON.stringify(this.items));

        this.updateBadge();

    },



    add(sku, silent = false) {
        // Check if exists
        const exists = this.items.find(i => i.sku === sku);
        if (exists) {
            exists.qty++;
        } else {
            this.items.push({ sku: sku, qty: 1 });
        }
        this.save();

        if (!silent) {
            // Use custom notification if available, else alert with premium tone
            if (window.showSantisNotification) {
                window.showSantisNotification("Ritüel deneyim listenize eklendi.");
            } else {
                alert("Ritüel deneyim listenize eklendi.");
            }
        }
    },



    updateBadge() {

        const count = this.items.reduce((sum, i) => sum + i.qty, 0);

        document.querySelectorAll('.cart-count').forEach(el => {

            el.textContent = count;

            el.style.display = count > 0 ? 'inline-block' : 'none';

        });

    }

};



/* SANTIS CONCIERGE LOGIC */

const CONCIERGE = {

    whatsappNumber: "905348350169",



    generateMessage(serviceData) {

        const time = new Date().getHours();

        const greeting = time < 12 ? "Günaydın" : (time < 18 ? "İyi Günler" : "İyi Akşamlar");



        return encodeURIComponent(

            `${greeting} Santis Concierge,\n\n` +

            `[${serviceData.title ? serviceData.title.toUpperCase() : 'HİZMET'}] hizmetiniz hakkında bilgi almak ve rezervasyon yaptırmak istiyorum.\n\n` +

            `Süre: ${serviceData.duration || 'Belirtilmedi'}\n` +

            `Referans: ${serviceData.id || '-'}\n\n` +

            `Müsaitlik durumunu öğrenebilir miyim?`

        );

    },



    openWhatsApp(serviceData) {

        const msg = this.generateMessage(serviceData);

        window.open(`https://wa.me/${this.whatsappNumber}?text=${msg}`, '_blank');

    }

};



/* Simple Notification Helper */

window.showSantisNotification = function (msg) {

    const div = document.createElement('div');

    div.style.cssText = `

        position: fixed; bottom: 20px; right: 20px; 

        background: #d4af37; color: #000; padding: 15px 25px; 

        border-radius: 8px; font-weight: 600; z-index: 10000;

        box-shadow: 0 10px 30px rgba(0,0,0,0.3);

        transform: translateY(100px); transition: transform 0.3s ease;

    `;

    div.textContent = msg;

    document.body.appendChild(div);

    setTimeout(() => div.style.transform = 'translateY(0)', 10);

    setTimeout(() => {

        div.style.transform = 'translateY(100px)';

        setTimeout(() => div.remove(), 300);

    }, 3000);

};



// GLOBAL EXPORTS

window.CART = CART;

window.CONCIERGE = CONCIERGE;



document.addEventListener('DOMContentLoaded', () => {

    CART.init();

});

