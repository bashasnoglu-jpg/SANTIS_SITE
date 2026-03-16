/* ==========================================
   🍏 PHASE 69: SENSORY DUST (FPS PROTECTED) & MAGNETIC
   ========================================== */
class SensoryDust {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = window.innerWidth < 768 ? 18 : 40;
        this.isActive = true;

        // Respect reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.isActive = false;
            return;
        }

        this.init();
    }

    init() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '0'; // Behind major content
        document.body.appendChild(this.canvas);

        this.resize();
        window.addEventListener('resize', () => {
            this.resize();
            this.maxParticles = window.innerWidth < 768 ? 18 : 40;
        });

        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }

        requestAnimationFrame((t) => this.animate(t));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 1.5 + 0.5,
            speedY: Math.random() * 0.3 + 0.1,
            speedX: (Math.random() - 0.5) * 0.2,
            opacity: Math.random() * 0.4 + 0.1
        };
    }

    animate(time) {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.particles.length > this.maxParticles) {
            this.particles.splice(this.maxParticles);
        } else if (this.particles.length < this.maxParticles) {
            for (let i = this.particles.length; i < this.maxParticles; i++) {
                this.particles.push(this.createParticle());
            }
        }

        this.particles.forEach(p => {
            p.y -= p.speedY; // move up
            p.x += p.speedX;

            if (p.y < -10) {
                p.y = this.canvas.height + 10;
                p.x = Math.random() * this.canvas.width;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`; // Sovereign Gold
            this.ctx.fill();
        });

        requestAnimationFrame((t) => this.animate(t));
    }
}

// Magnetic Elements Component
class MagneticElements {
    constructor() {
        this.items = document.querySelectorAll('.magnetic-btn');
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        this.init();
    }

    init() {
        this.items.forEach(item => {
            // Apply GSAP only if available (handled safely)
            if (typeof gsap === 'undefined') return;

            item.addEventListener('mousemove', (e) => {
                const rect = item.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                // Pure transform: translate for layout security
                gsap.to(item, {
                    x: x * 0.3,
                    y: y * 0.3,
                    duration: 0.6,
                    ease: "power2.out"
                });
            });

            item.addEventListener('mouseleave', () => {
                gsap.to(item, {
                    x: 0,
                    y: 0,
                    duration: 0.8,
                    ease: "elastic.out(1, 0.3)"
                });
            });
        });
    }
}

// Initializer
document.addEventListener("DOMContentLoaded", () => {
    window.SantisSensoryDust = new SensoryDust();
    window.SantisMagnetic = new MagneticElements();
});
