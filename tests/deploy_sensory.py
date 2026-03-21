import os
import re

# Now interaction-engine.js
js_path = 'c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\assets\\js\\modules\\interaction-engine.js'

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

sensory_engine_js = """
// ==========================================
// 🧲 SENSORY LAYER: MAGNETIC ENGINE v1.0
// ==========================================
class SovereignMagneticEngine {
    constructor(el, strength = 0.3, radius = 120) {
        this.el = el;
        this.strength = strength;
        this.radius = radius;
        this.boundMove = this.handleMove.bind(this);
        this.boundReset = this.reset.bind(this);
        this.bind();
    }

    bind() {
        this.el.addEventListener('mousemove', this.boundMove);
        this.el.addEventListener('mouseleave', this.boundReset);
    }

    unbind() {
        this.el.removeEventListener('mousemove', this.boundMove);
        this.el.removeEventListener('mouseleave', this.boundReset);
        this.reset();
    }

    handleMove(e) {
        // Mobile Kill Switch
        if (window.matchMedia('(pointer: coarse)').matches) return;
        
        const rect = this.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const distX = e.clientX - cx;
        const distY = e.clientY - cy;

        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance > this.radius) {
            this.reset();
            return;
        }

        const force = (1 - distance / this.radius);
        const dx = distX * force * this.strength;
        const dy = distY * force * this.strength;

        this.el.style.setProperty('--mx', `${dx}px`);
        this.el.style.setProperty('--my', `${dy}px`);
    }

    reset() {
        this.el.style.setProperty('--mx', `0px`);
        this.el.style.setProperty('--my', `0px`);
    }
}

// Global Magnetic Bind Array cache for unbinding cards
window.magneticInstances = window.magneticInstances || new Map();

// Helper to bind a single sticky element (e.g. Buttons)
window.bindMagnetic = function(el) {
    if (!el.classList.contains('santis-magnetic')) el.classList.add('santis-magnetic');
    if (!window.magneticInstances.has(el)) {
        window.magneticInstances.set(el, new SovereignMagneticEngine(el));
    }
};

// ==========================================
// 🌊 SENSORY LAYER: INERTIA SCROLL v1.0
// ==========================================
class SovereignInertiaEngine {
    constructor() {
        this.elements = document.querySelectorAll('[data-inertia]');
        this.maxClamp = 60;
        
        if (this.elements.length > 0) {
            this.animate = this.animate.bind(this);
            requestAnimationFrame(this.animate);
        }
    }

    animate() {
        // Halt processing entirely if Reveal is open or mobile limits
        if (typeof revealState !== 'undefined' && revealState.isOpen) {
            requestAnimationFrame(this.animate);
            return;
        }
        
        // Touch devices: reduce or kill
        const isMobile = window.matchMedia('(pointer: coarse)').matches;
        
        const scrollY = window.scrollY;
        
        this.elements.forEach(el => {
            if (isMobile) {
                el.style.transform = `translateY(0px)`;
                return;
            }
            
            const speed = parseFloat(el.dataset.inertia) || 0.15;
            const offset = Math.min(scrollY * speed, this.maxClamp);
            el.style.transform = `translateY(${offset}px)`;
        });

        requestAnimationFrame(this.animate);
    }
}

// Start Inertia loop
window.addEventListener('DOMContentLoaded', () => {
    // Bind all static static buttons
    document.querySelectorAll('.santis-magnetic').forEach(btn => window.bindMagnetic(btn));
    
    // Boot Inertia engine
    window.inertiaEngine = new SovereignInertiaEngine();
});

"""

if 'MAGNETIC ENGINE' not in js:
    js = js.replace('// 🧬 SOVEREIGN MORPH ENGINE v2.0 (GOD-TIER FLIP)', sensory_engine_js + '\n// 🧬 SOVEREIGN MORPH ENGINE v2.0 (GOD-TIER FLIP)')

# Modify Cover Flow updates inside interaction-engine.js
import re
old_transform = r"card\.style\.transform = `translateX\(\$\{translateX\}%\) scale\(\$\{scale\}\)`;"
new_transform = r"card.style.transform = `translateX(${translateX}%) scale(${scale}) translate(var(--mx, 0px), var(--my, 0px))`;"
js = re.sub(old_transform, new_transform, js)

# Bind Active Card in Cover Flow
inject_active_magnetic = """
                if (diff === 0) {
                    card.classList.add('is-active');
                    if (window.bindMagnetic) window.bindMagnetic(card);
                } else {
                    card.classList.remove('is-active');
                    if (window.magneticInstances && window.magneticInstances.has(card)) {
                        window.magneticInstances.get(card).unbind();
                        window.magneticInstances.delete(card);
                    }
                }"""

old_active_block = r"if \(diff === 0\) \{\s*card\.classList\.add\('is-active'\);\s*\} else \{\s*card\.classList\.remove\('is-active'\);\s*\}"
js = re.sub(old_active_block, inject_active_magnetic, js)

# Bind the ghost close button
trigger_string = "ghost.appendChild(closeBtn);"
trigger_inject = """ghost.appendChild(closeBtn);
        if (window.bindMagnetic) window.bindMagnetic(closeBtn);"""
if 'window.bindMagnetic(closeBtn)' not in js:
    js = js.replace(trigger_string, trigger_inject)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Sensory engines javascript deployed in interaction-engine.js.")
