import os
import re

# 1. Update HTML
html_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

cursor_html = """
<!-- 💧 SANTIS LIQUID CURSOR ENGINE v1.0 -->
<div id="santis-cursor-dot"></div>
<div id="santis-cursor-ring"><span class="santis-cursor-label"></span></div>

</body>"""

if 'id="santis-cursor-dot"' not in html:
    html = html.replace("</body>", cursor_html, 1)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Injected Cursor DOM to index.html")

# 2. Update CSS
css_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\css\style.css"
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

cursor_css = """
/* ==========================================
   💧 LIQUID CURSOR ENGINE
   ========================================== */
@media (pointer: fine) {
    /* Kill native cursor globally for fine pointing devices */
    body, a, button, input, textarea, .santis-btn, .santis-magnetic, .santis-stack-card {
        cursor: none !important;
    }
}

#santis-cursor-dot {
    position: fixed;
    top: 0; left: 0;
    width: 6px; height: 6px;
    background: #D4AF37;
    border-radius: 50%;
    pointer-events: none;
    z-index: 10001;
    mix-blend-mode: difference;
    transform: translate(-50%, -50%);
    will-change: transform;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.1s ease-out; /* scale transition on click */
}

#santis-cursor-ring {
    position: fixed;
    top: 0; left: 0;
    width: 40px; height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    pointer-events: none;
    z-index: 10000;
    mix-blend-mode: difference;
    display: flex; align-items: center; justify-content: center;
    transform-origin: center center;
    will-change: transform, width, height, border-radius;
    opacity: 0;
    transition: opacity 0.3s ease;
}

/* Base Initializer */
body.cursor-initialized #santis-cursor-dot,
body.cursor-initialized #santis-cursor-ring {
    opacity: 1;
}

/* ZIRH 2: Window Edge Death (Hide when mouse leaves window) */
body.cursor-hidden #santis-cursor-dot,
body.cursor-hidden #santis-cursor-ring {
    opacity: 0 !important;
    transform: scale(0) !important;
}

/* ZIRH 3: Micro-Compression on Mousedown */
body.cursor-mousedown #santis-cursor-ring {
    transform: scale(0.85) !important;
    /* We don't animate transform normally because LERP sets it, 
       but we can use matrix logic in JS or apply a sub-div for scale. 
       Actually, doing it in JS LERP is safer. We will handle compression in JS. */
}

.santis-cursor-label {
    display: none;
    color: #000;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease;
}

/* === MORPH STATES === */
/* Text Hover (I-Beam) */
body.cursor-text-hover #santis-cursor-ring {
    width: 2px !important;
    height: 1.5em !important;
    border-radius: 0 !important;
    background: #fff;
    border: none;
}
body.cursor-text-hover #santis-cursor-dot {
    opacity: 0; /* hide dot during text beam */
}

/* Lens / Ghost Action (Expand & Show Text) */
body.cursor-lens-hover #santis-cursor-ring {
    width: 60px !important;
    height: 60px !important;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    mix-blend-mode: normal;
}
body.cursor-lens-hover .santis-cursor-label {
    display: block;
    opacity: 1;
}
body.cursor-lens-hover #santis-cursor-dot {
    opacity: 0; 
}

/* Snap State (The Fluid Box Fusion) */
body.cursor-snap-hover #santis-cursor-ring {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.5);
    mix-blend-mode: normal;
    /* width, height, border-radius are injected by JS dynamically */
}
body.cursor-snap-hover #santis-cursor-dot {
    opacity: 0; /* dissolve dot into the button */
}

"""

if 'LIQUID CURSOR ENGINE' not in css:
    with open(css_path, "a", encoding="utf-8") as f:
        f.write("\n" + cursor_css)
    print("Injected Cursor CSS to style.css")

# 3. Update JS
js_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\js\modules\interaction-engine.js"
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

ticker_and_cursor_js = """
// ==========================================
// 🌊 SENSORY LAYER: SOVEREIGN TICKER (MASTER LOOP) & CURSOR ENGINE v2.0
// ==========================================
class SovereignTicker {
    constructor() {
        this.inertiaElements = document.querySelectorAll('[data-inertia]');
        this.maxClamp = 60;
        
        // Cursor State
        this.cursorDot = document.getElementById('santis-cursor-dot');
        this.cursorRing = document.getElementById('santis-cursor-ring');
        this.cursorLabel = this.cursorRing ? this.cursorRing.querySelector('.santis-cursor-label') : null;
        
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.ring = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        
        this.isMobile = window.matchMedia('(pointer: coarse)').matches;
        
        this.cursorState = 'normal'; // 'normal', 'snap', 'text', 'lens'
        this.snapTarget = null;
        this.isMouseDown = false;
        
        if (!this.isMobile && this.cursorDot && this.cursorRing) {
            this.bindCursor();
        }
        
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    bindCursor() {
        // Track true mouse coordinates completely decoupled from tick rate
        window.addEventListener('mousemove', (e) => {
            if (!document.body.classList.contains('cursor-initialized')) {
                document.body.classList.add('cursor-initialized');
            }
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Dot is instantaneous, Zero-Latency constraint
            this.cursorDot.style.transform = `translate(calc(${this.mouse.x}px - 50%), calc(${this.mouse.y}px - 50%)) scale(${this.isMouseDown ? 0.5 : 1})`;
        });

        // ZIRH 3: Micro-Compression
        window.addEventListener('mousedown', () => {
            this.isMouseDown = true;
            this.cursorDot.style.transform = `translate(calc(${this.mouse.x}px - 50%), calc(${this.mouse.y}px - 50%)) scale(0.5)`;
        });
        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.cursorDot.style.transform = `translate(calc(${this.mouse.x}px - 50%), calc(${this.mouse.y}px - 50%)) scale(1)`;
        });

        // ZIRH 2: Window Edge Death
        document.addEventListener('mouseleave', () => {
            document.body.classList.add('cursor-hidden');
        });
        document.addEventListener('mouseenter', () => {
            document.body.classList.remove('cursor-hidden');
        });
        
        // Dynamic Delegation for Hover States
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            
            // Text Detection
            if (target.matches('h1, h2, h3, p, span, blockquote')) {
                // Ignore Cover Flow elements for I-Beam or things inside buttons
                if (!target.closest('.santis-btn, .santis-magnetic, .santis-stack-card')) {
                    this.setCursorState('text');
                    return;
                }
            }

            // Magnetic Bounding Snap (The Liquid Fusion)
            const snapEl = target.closest('.santis-magnetic, .santis-btn, .hero-cta, .santis-ghost-close');
            if (snapEl) {
                this.snapTarget = snapEl;
                this.setCursorState('snap');
                return;
            }

            // Lens / Explore Hover (Cover flow cards)
            const lensEl = target.closest('.santis-stack-card:not(.is-active)');
            if (lensEl) {
                this.setCursorLabel('KEŞFET');
                this.setCursorState('lens');
                return;
            }
            
            const closeEl = target.closest('.santis-ghost-overlay');
            if (closeEl && revealState && revealState.isOpen) {
                this.setCursorLabel('KAPAT');
                this.setCursorState('lens');
                return;
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target;
            const snapEl = target.closest('.santis-magnetic, .santis-btn, .hero-cta, .santis-ghost-close');
            if (snapEl === this.snapTarget) {
                this.snapTarget = null;
                this.resetCursorStyle();
                this.setCursorState('normal');
            } else if (target.matches('h1, h2, h3, p, span, blockquote') && this.cursorState === 'text') {
                this.setCursorState('normal');
            } else if (target.closest('.santis-stack-card') || target.closest('.santis-ghost-overlay')) {
                if (this.cursorState === 'lens') {
                    this.setCursorState('normal');
                    this.setCursorLabel('');
                }
            }
        });
    }

    setCursorState(state) {
        document.body.classList.remove('cursor-text-hover', 'cursor-snap-hover', 'cursor-lens-hover');
        this.cursorState = state;
        if (state !== 'normal') {
            document.body.classList.add(`cursor-${state}-hover`);
        }
    }
    
    setCursorLabel(text) {
        if (this.cursorLabel) this.cursorLabel.textContent = text;
    }

    resetCursorStyle() {
        this.cursorRing.style.width = '';
        this.cursorRing.style.height = '';
        this.cursorRing.style.borderRadius = '';
    }

    animate() {
        // --- INERTIA COMPUTATION ---
        if (!(revealState && revealState.isOpen) && !this.isMobile) {
            const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
            this.inertiaElements.forEach(el => {
                const speed = parseFloat(el.dataset.inertia) || 0.15;
                const offset = Math.min(scrollY * speed, this.maxClamp);
                el.style.transform = `translateY(${offset}px)`;
            });
        }

        // --- CURSOR CORE COMPUTATION ---
        if (!this.isMobile && this.cursorRing) {
            let targetX = this.mouse.x;
            let targetY = this.mouse.y;
            
            // ZIRH 1: Scroll Desync Protection (Live Rect Calculation)
            if (this.cursorState === 'snap' && this.snapTarget) {
                const rect = this.snapTarget.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
                
                // Inherit shape dimensions smoothly
                this.cursorRing.style.width = `${rect.width + 10}px`;
                this.cursorRing.style.height = `${rect.height + 10}px`;
                this.cursorRing.style.borderRadius = window.getComputedStyle(this.snapTarget).borderRadius;
            } else {
                this.cursorRing.style.width = '';
                this.cursorRing.style.height = '';
                this.cursorRing.style.borderRadius = '';
            }

            // Fluid LERP Physics (16ms Intent Response - approx 0.15 smoothing)
            const ease = this.cursorState === 'snap' ? 0.25 : 0.15;
            this.ring.x += (targetX - this.ring.x) * ease;
            this.ring.y += (targetY - this.ring.y) * ease;
            
            // ZIRH 3: Micro-compression matrix multiplier
            const compressionScale = this.isMouseDown ? 0.85 : 1;
            
            // Note: We use the inline width/height from the Snap logic, OR fallback to CSS dynamically.
            this.cursorRing.style.transform = `translate(calc(${this.ring.x}px - 50%), calc(${this.ring.y}px - 50%)) scale(${compressionScale})`;
        }

        requestAnimationFrame(this.animate);
    }
}

// Global hook
window.addEventListener('DOMContentLoaded', () => {
    // Bind all static buttons for Magnetic
    document.querySelectorAll('.santis-magnetic, .hero-cta').forEach(btn => {
        if (window.bindMagnetic) window.bindMagnetic(btn);
    });
    
    // Boot the Supreme Master Loop
    if (!window.santisTicker) {
        window.santisTicker = new SovereignTicker();
    }
});
"""

# Try to replace the old InertiaEngine
old_inertia_regex = r"class SovereignInertiaEngine \{.*?\}\s*// Start Inertia loop\s*window\.addEventListener\('DOMContentLoaded', \(\) => \{.*?\}\);\s*"
old_inertia_regex_2 = r"class SovereignInertiaEngine \{.*?\}\s*// Start Inertia loop.*?window\.inertiaEngine = new SovereignInertiaEngine\(\);"

# I will just write a simpler regex to remove the old engine and start loop logic
js = re.sub(r"// ==========================================\s*// 🌊 SENSORY LAYER: INERTIA SCROLL v1.0\s*// ==========================================[\s\S]*?window\.inertiaEngine = new SovereignInertiaEngine\(\);", ticker_and_cursor_js, js)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)
    print("Injected SovereignTicker into interaction-engine.js")
