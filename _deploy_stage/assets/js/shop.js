/* ==========================================================================

   SANTIS CLUB - CONCIERGE SHOPPING (WHATSAPP COMMERCE)

   ========================================================================== */



const SHOP = {

    state: {

        cart: [],

        isOpen: false

    },



    init() {

        this.loadCart();

        this.renderFab(); // Floating Action Button

        this.renderCartDrawer();

        this.updateCount();

    },



    loadCart() {

        const saved = localStorage.getItem('santis_cart');

        if (saved) {

            try {

                this.state.cart = JSON.parse(saved);

            } catch (e) {

                this.state.cart = [];

            }

        }

    },



    saveCart() {

        localStorage.setItem('santis_cart', JSON.stringify(this.state.cart));

        this.updateCount();

        this.renderCartItems();

    },



    addToCart(product) {

        const existing = this.state.cart.find(item => item.id === product.id);

        if (existing) {

            existing.qty += 1;

        } else {

            this.state.cart.push({ ...product, qty: 1 });

        }

        this.saveCart();

        this.openCart();

        this.shakeFab();

    },



    removeFromCart(id) {

        this.state.cart = this.state.cart.filter(item => item.id !== id);

        this.saveCart();

    },



    updateQty(id, change) {

        const item = this.state.cart.find(i => i.id === id);

        if (item) {

            item.qty += change;

            if (item.qty <= 0) this.removeFromCart(id);

            else this.saveCart();

        }

    },



    getCartTotal() {

        return this.state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    },



    openCart() {

        this.state.isOpen = true;

        document.getElementById('shop-drawer').classList.add('open');

        document.getElementById('shop-overlay').classList.add('open');

        this.renderCartItems();

    },



    closeCart() {

        this.state.isOpen = false;

        document.getElementById('shop-drawer').classList.remove('open');

        document.getElementById('shop-overlay').classList.remove('open');

    },



    toggleCart() {

        if (this.state.isOpen) this.closeCart();

        else this.openCart();

    },



    updateCount() {

        const count = this.state.cart.reduce((sum, item) => sum + item.qty, 0);



        // Target all possible badges (Navbar, Mobile, FAB)

        const badges = document.querySelectorAll('.cart-badge, .shop-badge, #cartBadge, #shop-badge');



        badges.forEach(badge => {

            if (badge) {

                badge.textContent = count;

                // Only hide if it's the FAB badge (logic specific to FAB), 

                // but usually we want to show 0 or hide. 

                // Let's keep existing logic: show if > 0 (or always show 0 if preferred, but existing was hide)

                // Actually, navbar badge usually stays visible. Let's make it conditional based on class.

                if (badge.id === 'shop-badge') {

                    badge.style.display = count > 0 ? 'flex' : 'none';

                } else {

                    // Navbar badge: often we just update text. 

                    // If user wants it hidden when 0:

                    // badge.style.display = count > 0 ? 'flex' : 'none';



                    // Current navbar.html default is 0. existing shop.js logic hid it. 

                    // Let's stick to hiding if 0 for cleaner look, valid for 'Quiet Luxury'

                    badge.style.display = count > 0 ? 'flex' : 'none';

                }

            }

        });

    },



    shakeFab() {

        const fab = document.getElementById('shop-fab');

        if (fab) {

            fab.style.transform = "scale(1.2)";

            setTimeout(() => fab.style.transform = "scale(1)", 200);

        }

    },



    renderFab() {

        if (document.getElementById('shop-fab')) return;



        const fab = document.createElement('div');

        fab.id = 'shop-fab';

        fab.className = 'shop-fab';

        // Bag Icon

        fab.innerHTML = `

            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

                <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z"></path>

                <path d="M3 6H21"></path>

                <path d="M16 10C16 12.21 14.21 14 12 14C9.79 14 8 12.21 8 10"></path>

            </svg>

            <span id="shop-badge" class="shop-badge">0</span>

        `;

        fab.onclick = () => this.toggleCart();

        document.body.appendChild(fab);

    },



    renderCartDrawer() {

        if (document.getElementById('shop-drawer')) return;



        // Overlay is reused but we might need new one if not present

        let overlay = document.querySelector('.nv-nav-overlay'); // Try reuse

        if (!overlay) {

            overlay = document.createElement('div');

            overlay.className = 'nv-nav-overlay';

            document.body.appendChild(overlay);

        }

        overlay.id = 'shop-overlay'; // Add specific ID for shop targeting

        overlay.onclick = () => this.closeCart();



        // Drawer

        const drawer = document.createElement('div');

        drawer.id = 'shop-drawer';

        drawer.className = 'nav-sheet shop-drawer'; // Reuse sheet style base

        /* Override styles inline or in css */

        drawer.style.width = '400px';

        drawer.style.maxWidth = '90vw';

        drawer.style.zIndex = '10005';



        drawer.innerHTML = `

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1);">

                <h2 style="font-family:var(--font-heading); margin:0; font-size:1.5rem; color:var(--text-main);">Shopping Bag</h2>

                <button onclick="SHOP.closeCart()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.5rem;">&times;</button>

            </div>

            

            <div id="shop-items" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:15px; padding-bottom:20px;">

                <!-- Items go here -->

            </div>



            <div style="margin-top:auto; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); background:var(--surface);">

                <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:1.2rem; font-weight:600;">

                    <span>Total</span>

                    <span id="shop-total" style="color:var(--accent-gold);">0€</span>

                </div>

                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:20px; text-align:center;">

                    * Toplam tutar ve stok durumu concierge onayıyla kesinleşir.

                </div>

                <button onclick="SHOP.checkout()" style="width:100%; padding:14px; background:var(--accent-gold); border:none; border-radius:8px; color:#000; font-weight:bold; cursor:pointer; font-size:1rem; letter-spacing:1px; text-transform:uppercase; transition:all 0.2s;">

                    WHATSAPP ORDER

                </button>

            </div>

        `;

        document.body.appendChild(drawer);

    },



    renderCartItems() {
        const container = document.getElementById('shop-items');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted); font-size:0.9rem;">Sepetiniz henüz boş.</div>';
            this.updateTotal();
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1);">
                <div style="width:60px; height:60px; border-radius:4px; overflow:hidden; background:#222;">
                    <img src="${item.img || item.image || '/assets/img/placeholder.png'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/img/placeholder.png'"/>
                </div>
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:0.95rem; margin-bottom:4px; color:var(--text-main);">${typeof item.name === 'object' ? (item.name.tr || item.name.en) : item.name}</div>
                    <div style="color:var(--accent-gold); font-size:0.9rem;">${item.price}€</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                   <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); border-radius:4px; padding:2px;">
                        <button onclick="SHOP.updateQty('${item.id}', -1)" style="width:24px; height:24px; background:none; border:none; color:#fff; cursor:pointer;">-</button>
                        <span style="font-size:0.9rem;">${item.qty}</span>
                        <button onclick="SHOP.updateQty('${item.id}', 1)" style="width:24px; height:24px; background:none; border:none; color:#fff; cursor:pointer;">+</button>
                   </div>
                   <button onclick="SHOP.removeFromCart('${item.id}')" style="font-size:0.75rem; color:var(--text-muted); background:none; border:none; cursor:pointer; text-decoration:underline; opacity:0.7;">sil</button>
                </div>
            </div>
        `).join('');

        this.updateTotal();
    },

    updateTotal() {
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const totalEl = document.getElementById('shop-total');
        if (totalEl) totalEl.innerText = total + "€";

        // Update Badge
        const totalQty = this.cart.reduce((sum, item) => sum + item.qty, 0);
        const badge = document.getElementById('shop-badge');
        if (badge) {
            badge.innerText = totalQty;
            badge.style.display = totalQty > 0 ? 'flex' : 'none';
        }
    },



    // --- CHECKOUT & ORDER LOGIC ---



    // --- SHIPPING & PAYMENT ZONES ---

    shippingZones: {

        'TR': { name: 'Turkey', base: 50, perKg: 10, threshold: 1000, currency: 'TRY' }, // Local rules

        'EU1': { name: 'Europe Zone 1 (DE, NL, BE)', base: 15, perKg: 2, threshold: 150, currency: 'EUR', countries: ['DE', 'NL', 'BE'] },

        'EU2': { name: 'Europe Zone 2 (FR, IT, ES)', base: 20, perKg: 3, threshold: 150, currency: 'EUR', countries: ['FR', 'IT', 'ES', 'AT'] },

        'ROW': { name: 'Rest of World', base: 35, perKg: 5, threshold: 200, currency: 'EUR', countries: [] }

    },



    getZone(countryCode) {

        if (countryCode === 'TR') return this.shippingZones.TR;

        if (this.shippingZones.EU1.countries.includes(countryCode)) return this.shippingZones.EU1;

        if (this.shippingZones.EU2.countries.includes(countryCode)) return this.shippingZones.EU2;

        return this.shippingZones.ROW;

    },



    calculateShipping(countryCode) {

        const zone = this.getZone(countryCode);

        const totalWeightKg = this.state.cart.reduce((sum, item) => {

            // Heuristic weight if not in DB: 0.5kg avg

            const w = item.weight || 0.5;

            return sum + (w * item.qty);

        }, 0);



        let cost = zone.base + (totalWeightKg * zone.perKg);

        return { cost: Math.round(cost), zone: zone.name, currency: zone.currency };

    },



    // --- CHECKOUT & ORDER LOGIC ---



    // --- SHIPPING & PAYMENT ZONES ---

    shippingZones: {

        'TR': { name: 'Turkey', base: 50, perKg: 10, threshold: 1000, currency: 'TRY' }, // Local rules

        'EU1': { name: 'Europe Zone 1 (DE, NL, BE)', base: 15, perKg: 2, threshold: 150, currency: 'EUR', countries: ['DE', 'NL', 'BE'] },

        'EU2': { name: 'Europe Zone 2 (FR, IT, ES)', base: 20, perKg: 3, threshold: 150, currency: 'EUR', countries: ['FR', 'IT', 'ES', 'AT'] },

        'ROW': { name: 'Rest of World', base: 35, perKg: 5, threshold: 200, currency: 'EUR', countries: [] }

    },



    getZone(countryCode) {

        if (countryCode === 'TR') return this.shippingZones.TR;

        if (this.shippingZones.EU1.countries.includes(countryCode)) return this.shippingZones.EU1;

        if (this.shippingZones.EU2.countries.includes(countryCode)) return this.shippingZones.EU2;

        return this.shippingZones.ROW;

    },



    calculateShipping(countryCode) {

        const zone = this.getZone(countryCode);

        const totalWeightKg = this.state.cart.reduce((sum, item) => {

            // Heuristic weight if not in DB: 0.5kg avg

            const w = item.weight || 0.5;

            return sum + (w * item.qty);

        }, 0);



        let cost = zone.base + (totalWeightKg * zone.perKg);

        return { cost: Math.round(cost), zone: zone.name, currency: zone.currency };

    },



    // --- SHIPPING & PAYMENT ZONES ---

    shippingZones: {

        'TR': { name: 'Turkey', base: 50, perKg: 10, threshold: 1000, currency: 'TRY' }, // Local rules

        'EU1': { name: 'Europe Zone 1 (DE, NL, BE)', base: 15, perKg: 2, threshold: 150, currency: 'EUR', countries: ['DE', 'NL', 'BE'] },

        'EU2': { name: 'Europe Zone 2 (FR, IT, ES)', base: 20, perKg: 3, threshold: 150, currency: 'EUR', countries: ['FR', 'IT', 'ES', 'AT'] },

        'ROW': { name: 'Rest of World', base: 35, perKg: 5, threshold: 200, currency: 'EUR', countries: [] }

    },



    getZone(countryCode) {

        if (countryCode === 'TR') return this.shippingZones.TR;

        if (this.shippingZones.EU1.countries.includes(countryCode)) return this.shippingZones.EU1;

        if (this.shippingZones.EU2.countries.includes(countryCode)) return this.shippingZones.EU2;

        return this.shippingZones.ROW;

    },



    calculateShipping(countryCode) {

        const zone = this.getZone(countryCode);

        const totalWeightKg = this.state.cart.reduce((sum, item) => {

            // Heuristic weight if not in DB: 0.5kg avg

            const w = item.weight || 0.5;

            return sum + (w * item.qty);

        }, 0);



        let cost = zone.base + (totalWeightKg * zone.perKg);

        return { cost: Math.round(cost), zone: zone.name, currency: zone.currency };

    },



    openCheckoutModal() {

        if (this.state.cart.length === 0) return;



        // Ensure Modal Exists

        if (!document.getElementById('checkout-modal')) {

            this.createCheckoutModal();

        }



        document.getElementById('checkout-modal').style.display = 'flex';

        // Delay opacity for transition

        setTimeout(() => document.getElementById('checkout-modal').classList.add('active'), 10);

    },



    closeCheckoutModal() {

        const modal = document.getElementById('checkout-modal');

        if (modal) {

            modal.classList.remove('active');

            setTimeout(() => modal.style.display = 'none', 300);

        }

    },



    createCheckoutModal() {

        const modal = document.createElement('div');

        modal.id = 'checkout-modal';

        modal.className = 'modal-overlay'; // Reusing style from index.html if available

        modal.style.zIndex = '10010'; // Above everything



        modal.innerHTML = `
    < div class="modal-content" style = "max-width:500px; width:95%; background:#111; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:25px; position:relative;" >
                <button onclick="SHOP.closeCheckoutModal()" style="position:absolute; top:15px; right:15px; background:none; border:none; color:#fff; font-size:20px; cursor:pointer;">&times;</button>
                
                <h2 style="font-family:var(--font-heading); margin-top:0; color:#fff; font-size:1.4rem;">Checkout</h2>
                
                <!--Delivery Type Toggle-- >
                <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px;">
                    <button id="btn-hotel" onclick="SHOP.toggleDeliveryType('hotel')" class="lux-chip active" style="flex:1; text-align:center; justify-content:center; background:rgba(212,175,55,0.2); border-color:#d4af37;">
                        🏨 In Hotel
                    </button>
                    <button id="btn-delivery" onclick="SHOP.toggleDeliveryType('delivery')" class="lux-chip" style="flex:1; text-align:center; justify-content:center;">
                        🚚 Delivery
                    </button>
                </div>

                <form id="checkout-form" onsubmit="SHOP.submitOrder(event)">
                    <input type="hidden" id="order-type" value="hotel">
                    
                    <!-- Common Fields -->
                    <div class="form-group" style="margin-bottom:15px;">
                        <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Full Name</label>
                        <input type="text" id="cust-name" required placeholder="Guest Name" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid #333; color:#fff; border-radius:6px;">
                    </div>

                    <!-- Hotel Specific -->
                    <div id="hotel-fields">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                            <div class="form-group">
                                <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Room Number</label>
                                <input type="text" id="cust-room" placeholder="101" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid #333; color:#fff; border-radius:6px;">
                            </div>
                            <div class="form-group">
                                <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Time</label>
                                <select id="cust-time" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid #333; color:#fff; border-radius:6px;">
                                    <option value="ASAP">ASAP (Immediate)</option>
                                    <option value="30min">In 30 mins</option>
                                    <option value="1hour">In 1 hour</option>
                                    <option value="Schedule">Schedule later</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Delivery Specific (Hidden by default) -->
                    <div id="delivery-fields" style="display:none;">
                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Full Address</label>
                            <textarea id="cust-address" rows="3" placeholder="Street, City, Country" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid #333; color:#fff; border-radius:6px;"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Phone / WhatsApp</label>
                            <input type="tel" id="cust-phone" placeholder="+90 ..." style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid #333; color:#fff; border-radius:6px;">
                        </div>
                    </div>

                    <!-- Summary -->
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span style="color:#aaa;">Subtotal</span>
                            <span id="checkout-subtotal">0€</span>
                        </div>
                         <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span style="color:#aaa;">Service / Shipping</span>
                            <span id="checkout-shipping">0€</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-weight:bold; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px; margin-top:10px;">
                            <span>Total</span>
                            <span id="checkout-total" style="color:var(--accent-gold);">0€</span>
                        </div>
                    </div>

                    <button type="submit" style="width:100%; padding:14px; background:var(--accent-gold); border:none; border-radius:8px; color:#000; font-weight:bold; cursor:pointer; font-size:1rem; letter-spacing:1px; text-transform:uppercase;">
                        CONFIRM ORDER via WHATSAPP
                    </button>
                    
                    <p style="text-align:center; font-size:0.75rem; color:#666; margin-top:15px;">
                        Orders are processed by our Concierge team. Payment is collected upon delivery or charged to your room.
                    </p>
                </form>
            </div >
    `;
        document.body.appendChild(modal);

    },



    toggleDeliveryType(type) {

        document.getElementById('btn-hotel').style.background = type === 'hotel' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.03)';

        document.getElementById('btn-hotel').style.borderColor = type === 'hotel' ? '#d4af37' : 'rgba(255,255,255,0.1)';

        document.getElementById('btn-delivery').style.background = type === 'delivery' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.03)';

        document.getElementById('btn-delivery').style.borderColor = type === 'delivery' ? '#d4af37' : 'rgba(255,255,255,0.1)';



        document.getElementById('hotel-fields').style.display = type === 'hotel' ? 'block' : 'none';

        document.getElementById('delivery-fields').style.display = type === 'delivery' ? 'block' : 'none';



        document.getElementById('order-type').value = type;



        const roomInput = document.getElementById('cust-room');

        const addrInput = document.getElementById('cust-address');



        if (type === 'hotel') {

            roomInput.setAttribute('required', 'true');

            addrInput.removeAttribute('required');

        } else {

            roomInput.removeAttribute('required');

            addrInput.setAttribute('required', 'true');

        }



        this.updateCheckoutTotal();

    },



    updateCheckoutTotal() {

        const type = document.getElementById('order-type').value;

        const totalEl = document.getElementById('modal-total');

        const shippingEl = document.getElementById('modal-shipping');



        let productTotal = this.getCartTotal();

        let shippingCost = 0;

        let grandTotal = productTotal;



        if (type === 'delivery') {

            const country = document.getElementById('cust-country').value;

            const shipData = this.calculateShipping(country);

            shippingCost = shipData.cost;

            grandTotal += shippingCost;



            if (shippingEl) shippingEl.textContent = `+ Shipping: ${shippingCost}€ (${shipData.zone})`;

        } else {

            if (shippingEl) shippingEl.textContent = '';

        }



        if (totalEl) totalEl.textContent = grandTotal + '€';

    },



    checkout() {

        if (this.state.cart.length === 0) return;

        this.openCheckoutModal();

        this.updateCheckoutTotal();

    },



    submitOrder(e) {

        e.preventDefault();



        const type = document.getElementById('order-type').value;

        const name = document.getElementById('cust-name').value;

        const notes = document.getElementById('cust-notes').value;

        let productTotal = this.getCartTotal();

        let shippingCost = 0;

        let grandTotal = productTotal;

        let shippingDetails = "";



        // Shipment Calc

        if (type === 'delivery') {

            const country = document.getElementById('cust-country').value;

            const shipData = this.calculateShipping(country);

            shippingCost = shipData.cost;

            grandTotal += shippingCost;

            shippingDetails = `DELIVERY(${shipData.zone})`;



            // Check IOSS limit

            if (grandTotal > 150 && shipData.zone.includes('Europe')) {

                // Just a warning in prompt logic, here we proceed but note it.

                // In real app, we might block or warn. 

            }

        } else {

            shippingDetails = "HOTEL DELIVERY";

        }



        // Generate ID

        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // 240126

        const randomCode = Math.floor(Math.random() * 9000) + 1000;

        const orderId = `SC - ${dateStr} -${randomCode} `;



        // Payment Link Simulation (Stripe link)

        const paymentLink = `https://pay.santis-club.com/${orderId}`;



        // Build Receipt

        let msg = `🧾 *Santis Club — Order Request*\n`;

        msg += `Order ID: *${orderId}*\n`;

        msg += `----------------------------\n`;



        this.state.cart.forEach(item => {

            msg += `• ${item.qty}x ${item.name?.tr || item.name} — ${item.price * item.qty}€\n`;

        });



        msg += `----------------------------\n`;

        msg += `Subtotal: ${productTotal}€\n`;

        if (shippingCost > 0) msg += `Shipping: ${shippingCost}€\n`;

        msg += `*TOTAL: ${grandTotal}€*\n`;

        msg += `----------------------------\n\n`;



        msg += `👤 *Customer:* ${name}\n`;

        if (type === 'hotel') {

            const room = document.getElementById('cust-room').value;

            const time = document.getElementById('cust-time').value;

            msg += `📍 *Location:* Room ${room} (${time})\n`;

            msg += `💳 *Payment:* Charge to Room (pending approval)\n`;

        } else {

            const country = document.getElementById('cust-country').value;

            const addr = document.getElementById('cust-address').value;

            const phone = document.getElementById('cust-phone').value;

            msg += `🚚 *Ship To:* ${country} - ${addr}\n`;

            msg += `📞 *Phone:* ${phone}\n`;

            msg += `💳 *Payment:* Please send payment link: ${paymentLink}\n`;

        }



        if (notes) msg += `📝 *Not:* ${notes}\n`;



        // 3. Send

        const num = "905348350169";

        const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;



        window.open(url, '_blank');

        this.closeCheckoutModal();

    },

    async initAtelierPage() {
        const grid = document.getElementById('atelier-grid');
        if (!grid) return;

        try {
            const res = await fetch('/assets/data/products-atelier.json');
            const products = await res.json();

            grid.innerHTML = '';

            products.forEach(p => {
                const card = document.createElement('div');
                card.className = "product-card-atelier fade-up";
                card.dataset.cat = p.category || 'other';

                card.innerHTML = `
                    <div class="atelier-img-wrap">
                        <img src="${p.image || '/assets/img/placeholder.png'}" class="atelier-img" alt="${p.name}">
                        <button class="nv-btn btn-add-atelier" style="position:absolute; bottom:20px; right:20px; padding:10px; background:#fff; color:#000; opacity:0; transform:translateY(10px); transition:all 0.3s;">
                            + KOLEKSİYONA EKLE
                        </button>
                    </div>
                    <h3 class="atelier-title">${p.name}</h3>
                    <div class="atelier-price">€${p.price}</div>
                    <div style="font-size:11px; color:#666; margin-top:5px;">${p.variant || ''}</div>
                `;

                // Hover effect for button
                const imgWrap = card.querySelector('.atelier-img-wrap');
                const btn = card.querySelector('.btn-add-atelier');

                imgWrap.addEventListener('mouseenter', () => {
                    btn.style.opacity = '1';
                    btn.style.transform = 'translateY(0)';
                });
                imgWrap.addEventListener('mouseleave', () => {
                    btn.style.opacity = '0';
                    btn.style.transform = 'translateY(10px)';
                });

                // Add Action
                btn.onclick = () => {
                    this.addToCart(p);
                    this.showToast(`Koleksiyona Eklendi: ${p.name}`);
                };

                grid.appendChild(card);
            });

            // Filter
            document.querySelectorAll('.cat-link').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.cat-link').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const cat = btn.dataset.cat;

                    document.querySelectorAll('.product-card-atelier').forEach(c => {
                        c.style.display = (cat === 'all' || c.dataset.cat === cat) ? 'block' : 'none';
                    });
                });
            });

        } catch (e) {
            console.error(e);
            grid.innerHTML = "<p>Atelier verileri yüklenemedi.</p>";
        }
    }

}; // END SHOP OBJECT

// Auto Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.SHOP) window.SHOP.init();
    });
} else {
    if (window.SHOP) window.SHOP.init();
}
