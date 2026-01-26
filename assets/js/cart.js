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
            alert("Ürün sepete eklendi! (Demo)");
        }
    },

    bindEvents() {
        // Delegated listener for all add-to-cart buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-add-to-cart="1"]');
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation(); // CRITICAL: Stop link navigation

            const sku = btn.dataset.sku;
            if (sku) this.add(sku);
        });
    },

    updateBadge() {
        const count = this.items.reduce((sum, i) => sum + i.qty, 0);
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CART.init();
});
