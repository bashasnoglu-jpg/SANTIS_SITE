/**
 * SANTIS SOVEREIGN UI ENGINE (VNEXT)
 * Magnetic Resonance, Touch Awareness, Zero-Reflow Animations
 */

export class SovereignUIEngine {
    constructor() {
        this.magneticButtons = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        this.rafId = null;

        // Configuration
        this.MAGNET_DISTANCE = 120; // 120px Proximity Activation
        this.MAGNET_STRENGTH = 0.3; // Maximum Pull factor

        if (!this.isTouch) {
            this.initMagneticPhysics();
        }
        this.initWhisperInputs();
        
        console.log("💎 [Sovereign UI] Engine Uyandı. TouchDevice: " + this.isTouch);
    }

    initMagneticPhysics() {
        // Collect all target elements
        this.magneticButtons = Array.from(document.querySelectorAll('.btn-magnetic')).map(el => {
            return {
                el: el,
                currentX: 0,
                currentY: 0,
                targetX: 0,
                targetY: 0,
                rect: el.getBoundingClientRect(),
                isHovering: false
            };
        });

        if (this.magneticButtons.length === 0) return;

        // Sadece tek bir global listener. Memory leak engellendi.
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }, { passive: true });

        // Update rects on resize/scroll for precision (debounced)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.updateRects(), 250);
        });
        window.addEventListener('scroll', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.updateRects(), 250);
        }, { passive: true });

        // Start Physics Loop
        this.renderLoop();
    }

    updateRects() {
        this.magneticButtons.forEach(btn => {
            btn.rect = btn.el.getBoundingClientRect();
        });
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    renderLoop() {
        this.magneticButtons.forEach(btn => {
            // Calculate center of button
            const centerX = btn.rect.left + btn.rect.width / 2;
            const centerY = btn.rect.top + btn.rect.height / 2;

            // Distance from mouse to center
            const distX = this.mouseX - centerX;
            const distY = this.mouseY - centerY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            // Proximity Activation
            if (distance < this.MAGNET_DISTANCE) {
                // Inside magnetic field
                btn.targetX = distX * this.MAGNET_STRENGTH;
                btn.targetY = distY * this.MAGNET_STRENGTH;
                
                if (!btn.isHovering) {
                    btn.isHovering = true;
                    btn.el.classList.add('is-magnetizing');
                }
            } else {
                // Outside magnetic field - snap back
                btn.targetX = 0;
                btn.targetY = 0;
                
                if (btn.isHovering) {
                    // Start CSS transition snap back when mouse leaves range
                    btn.isHovering = false;
                    btn.el.classList.remove('is-magnetizing');
                }
            }

            // Lerp physical calculation to target (Smooth sub-pixel interpolation)
            // If it's snapping back (target=0) and almost at 0, don't waste GPU ticks
            if (!btn.isHovering && Math.abs(btn.currentX) < 0.1 && Math.abs(btn.currentY) < 0.1) {
                btn.currentX = 0;
                btn.currentY = 0;
                btn.el.style.transform = `translate3d(0px, 0px, 0px)`;
            } else {
                btn.currentX = this.lerp(btn.currentX, btn.targetX, 0.15);
                btn.currentY = this.lerp(btn.currentY, btn.targetY, 0.15);
                btn.el.style.transform = `translate3d(${btn.currentX}px, ${btn.currentY}px, 0px)`;
            }
        });

        // 60FPS / 120FPS Request Animation Frame lock
        this.rafId = requestAnimationFrame(() => this.renderLoop());
    }

    initWhisperInputs() {
        // Floating Label inputs
        const inputs = document.querySelectorAll('.input-whisper');
        inputs.forEach(input => {
            const checkEmpty = () => {
                if(input.value.trim() !== '') input.classList.add('has-value');
                else input.classList.remove('has-value');
            };
            input.addEventListener('blur', checkEmpty);
            input.addEventListener('change', checkEmpty);
            // Initial check
            checkEmpty();
        });
    }
}

// Global Engine Mount
if(document.readyState === 'complete' || document.readyState === 'interactive') {
    window.SovereignUI = new SovereignUIEngine();
} else {
    document.addEventListener('DOMContentLoaded', () => window.SovereignUI = new SovereignUIEngine());
}
