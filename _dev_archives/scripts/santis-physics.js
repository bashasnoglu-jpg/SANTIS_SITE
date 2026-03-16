/**
 * 🌌 SANTIS PHYSICS ENGINE v1.0
 * "The Ultra Mega Polish"
 * 
 * Core Principles:
 * 1. EVERYTHING has mass and friction.
 * 2. MOTION is calculated, not animted.
 * 3. 60 FPS Guarantee via requestAnimationFrame.
 */

class SantisPhysics {
    constructor() {
        this.mouse = { x: 0, y: 0 };
        this.magnetics = [];
        this.holograms = [];

        // Physics Constants
        this.config = {
            magneticRange: 100,  // Pixel radius for gravity well
            magneticForce: 0.4,  // Strength of the pull (0.1 - 1.0)
            friction: 0.85,      // Damping factor for spring back
            spring: 0.1          // Hooke's law constant
        };

        this.init();
    }

    init() {
        // console.log("🌌 [Physics] Engine Warming Up...");

        // 1. Global Mouse Tracker (Passive for performance)
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.updateHolograms(); // Direct update for heavy 3D
        }, { passive: true });

        // 2. Initialize Components
        this.initMagnets();

        // 3. Start The Loop
        this.loop();
    }

    // --- 🧲 COMPONENT: MAGNETIC BUTTONS ---
    initMagnets() {
        // Auto-detect all buttons and nav links
        const targets = document.querySelectorAll('.nv-btn, .nv-nav-link, .intro-btn');

        targets.forEach(el => {
            // State for physics integration
            this.magnetics.push({
                el: el,
                x: 0,       // Current position
                y: 0,
                targetX: 0, // Target position (mouse pull)
                targetY: 0,
                width: el.offsetWidth,
                height: el.offsetHeight,
                rect: el.getBoundingClientRect()
            });

            // Bind Events
            el.addEventListener('mousemove', (e) => this.handleMagnetMove(e, el));
            el.addEventListener('mouseleave', () => this.handleMagnetLeave(el));

            // Optimization: Recalc rect on resize
            window.addEventListener('resize', () => {
                const item = this.magnetics.find(i => i.el === el);
                if (item) item.rect = el.getBoundingClientRect();
            });
        });

        // console.log(`🧲 [Physics] Magnetized ${this.magnetics.length} elements.`);
    }

    handleMagnetMove(e, el) {
        const item = this.magnetics.find(i => i.el === el);
        if (!item) return;

        // Calculate distance from center
        // We use the element's center as the gravity core
        item.rect = el.getBoundingClientRect(); // Refresh for accuracy
        const centerX = item.rect.left + item.rect.width / 2;
        const centerY = item.rect.top + item.rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Apply Force
        item.targetX = deltaX * this.config.magneticForce;
        item.targetY = deltaY * this.config.magneticForce;
    }

    handleMagnetLeave(el) {
        const item = this.magnetics.find(i => i.el === el);
        if (item) {
            item.targetX = 0;
            item.targetY = 0;
        }
    }

    // --- 🔮 ENGINE LOOP (60 FPS) ---
    loop() {
        // Update Magnets (Spring Physics)
        this.magnetics.forEach(item => {
            // Lerp towards target (Smooth dampening)
            // x += (target - x) * spring
            item.x += (item.targetX - item.x) * 0.15;
            item.y += (item.targetY - item.y) * 0.15;

            // Apply Transform if significant motion
            if (Math.abs(item.x) > 0.01 || Math.abs(item.y) > 0.01) {
                item.el.style.transform = `translate(${item.x}px, ${item.y}px)`;
            }
        });

        requestAnimationFrame(() => this.loop());
    }

    // --- UTILS ---
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    // --- 🔮 COMPONENT: HOLOGRAPHIC TILT (3D Cards) ---
    initHolograms() {
        // Target all cards that need 3D depth
        const selector = '.nv-card, .nv-trend-card, .product-card, .nv-visual-col, .nv-campaign-slide';

        // Since many cards are dynamic (loaded via JS), we need a MutationObserver
        const observer = new MutationObserver((mutations) => {
            let shouldRefresh = false;
            mutations.forEach(m => {
                if (m.addedNodes.length > 0) shouldRefresh = true;
            });
            if (shouldRefresh) this.refreshHolograms(selector);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Initial Load
        this.refreshHolograms(selector);
        // console.log(`🔮 [Physics] Holographic Matrix Initialized.`);
    }

    refreshHolograms(selector) {
        const targets = document.querySelectorAll(selector);

        targets.forEach(el => {
            // Avoid double-binding
            if (el.dataset.physicsBound) return;
            el.dataset.physicsBound = "true";

            this.holograms.push({
                el: el,
                rect: el.getBoundingClientRect(),
                rx: 0, // Current Rotation X
                ry: 0, // Current Rotation Y
                tx: 0, // Target X
                ty: 0,
                max: 8 // Max rotation degrees
            });

            el.addEventListener('mouseenter', () => {
                el.style.transition = 'none'; // Disable CSS transition for JS physics
            });

            el.addEventListener('mouseleave', () => {
                el.style.transition = 'transform 0.5s ease-out'; // Soft exit
                const item = this.holograms.find(i => i.el === el);
                if (item) { item.tx = 0; item.ty = 0; }
            });
        });
    }

    updateHolograms() {
        // Called on global mousemove
        this.holograms.forEach(item => {
            // Optimization: Only calculate if mouse is close/over
            const rect = item.rect;

            // Check if mouse is inside + buffer
            if (this.mouse.x > rect.left - 50 && this.mouse.x < rect.right + 50 &&
                this.mouse.y > rect.top - 50 && this.mouse.y < rect.bottom + 50) {

                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                // Calculate normalized (-1 to 1)
                const perX = (this.mouse.x - centerX) / (rect.width / 2);
                const perY = (this.mouse.y - centerY) / (rect.height / 2);

                // Set Target Rotation (Inverted Y for X-axis tilt)
                item.ty = perX * item.max;  // Rotate Y based on X pos
                item.tx = -perY * item.max; // Rotate X based on Y pos
            }
        });
    }

    // --- 🔮 ENGINE LOOP (60 FPS) ---
    loop() {
        // 1. Update Magnets
        this.magnetics.forEach(item => {
            item.x += (item.targetX - item.x) * 0.15;
            item.y += (item.targetY - item.y) * 0.15;
            if (Math.abs(item.x) > 0.01 || Math.abs(item.y) > 0.01) {
                item.el.style.transform = `translate(${item.x}px, ${item.y}px)`;
            }
        });

        // 2. Update Holograms (3D Tilt)
        this.holograms.forEach(item => {
            // Lerp Rotation
            item.rx += (item.tx - item.rx) * 0.1;
            item.ry += (item.ty - item.ry) * 0.1;

            // Apply Transform if active
            // We use perspective(1000px) to give 3D depth
            if (Math.abs(item.rx) > 0.01 || Math.abs(item.ry) > 0.01) {
                item.el.style.transform = `perspective(1000px) rotateX(${item.rx}deg) rotateY(${item.ry}deg)`;
            }
        });

        requestAnimationFrame(() => this.loop());
    }

    // --- UTILS ---
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }
}

// Initialize
window.SantisPhysics = new SantisPhysics();
