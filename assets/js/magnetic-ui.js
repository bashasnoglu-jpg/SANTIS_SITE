/**
 * 🦅 V24 SOVEREIGN MAGNETIC ENGINE
 * Zero-dependency, GPU-accelerated cursor magnetism.
 * "Quiet Luxury" - smooth, elastic, and entirely decoupled from the Main Thread's heavy tasks.
 */

class MagneticUI {
    constructor(element) {
        this.element = element;
        this.bounds = this.element.getBoundingClientRect();
        
        // Target coordinates for logical position
        this.target = { x: 0, y: 0 };
        // Current coordinates for animation frame
        this.current = { x: 0, y: 0 };
        
        // Fine-tuned physics multipliers (Quiet Luxury: Slow, Heavy, Deliberate)
        this.pullK = 0.3;     // The magnetic pull strength [Lower = Smoother]
        this.springK = 0.08;  // The snap-back strength [Lower = Heavier]
        
        this.isHovering = false;
        this.rafId = null;

        this.init();
    }

    init() {
        if (window.matchMedia("(hover: none)").matches) return;

        // Bounding box for calculations
        this.updateBounds();
        
        // We use mouseenter on the element itself to begin pulling
        this.element.addEventListener('mouseenter', this.onEnter.bind(this));
        
        // We use window bindings for active movement to prevent jitter/rapid mouseleave loops
        this.onWindowMove = this.onMove.bind(this);
        window.addEventListener('resize', this.updateBounds.bind(this));
    }

    updateBounds() {
        // Remove transform to get accurate original bounds
        const temp = this.element.style.transform;
        this.element.style.transform = 'none';
        this.bounds = this.element.getBoundingClientRect();
        this.element.style.transform = temp;
    }

    onEnter() {
        this.isHovering = true;
        this.updateBounds();
        window.addEventListener('mousemove', this.onWindowMove);
        this.animate();
    }

    onMove(e) {
        if (!this.isHovering) return;

        // Calculate cursor distance from center of element's original bounds
        const centerX = this.bounds.left + this.bounds.width / 2;
        const centerY = this.bounds.top + this.bounds.height / 2;
        
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        
        // Calculate hypotenuse to determine magnetic field escape
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        // If mouse moves too far from the button (escape radius), release it
        const escapeRadius = Math.max(this.bounds.width, this.bounds.height) * 1.5;
        
        if (distance > escapeRadius) {
            this.onLeave();
            return;
        }

        // Apply magnetic pull factor based on cursor position relative to origin
        this.target.x = distX * this.pullK;
        this.target.y = distY * this.pullK;
    }

    onLeave() {
        this.isHovering = false;
        this.target.x = 0;
        this.target.y = 0;
        window.removeEventListener('mousemove', this.onWindowMove);
    }

    animate() {
        // Hardware Accelerated LERP (Linear Interpolation)
        this.current.x += (this.target.x - this.current.x) * this.springK;
        this.current.y += (this.target.y - this.current.y) * this.springK;

        // Apply Translate3D for GPU offloading (Zero Layout Shift)
        this.element.style.transform = `translate3d(${this.current.x}px, ${this.current.y}px, 0)`;

        // Continue framing if hovering, or if still snapping back to origin
        if (this.isHovering || Math.abs(this.current.x) > 0.1 || Math.abs(this.current.y) > 0.1) {
            this.rafId = requestAnimationFrame(this.animate.bind(this));
        } else {
            // Clean up to prevent ghost calculations
            this.element.style.transform = '';
            cancelAnimationFrame(this.rafId);
        }
    }
}

// Global initialization logic mapped to the specific user class
const initMagneticEngine = () => {
    const magneticElements = document.querySelectorAll('.santis-magnetic');
    if(magneticElements.length > 0) {
        magneticElements.forEach(el => new MagneticUI(el));
        console.log(`🦅 [Magnetic UI] Sovereign Engine Active on ${magneticElements.length} elements.`);
    }
};

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMagneticEngine);
} else {
    initMagneticEngine();
}
