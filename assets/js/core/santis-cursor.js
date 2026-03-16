/**
 * 🦅 SANTIS MASTER OS: QUANTUM CURSOR ENGINE
 * @version V30_LIQUID_INTERACTION_PRO
 * @description: Native imleci yok eder. Lerp tabanlı, mix-blend-mode destekli 
 * ve Magnetic UI ile tam entegre çalışan Sovereign İmleç Motoru.
 */

export class SovereignCursor {
    constructor() {
        // Dokunmatik cihazlarda imlece gerek yoktur
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

        // Initialize elements
        this.cursorDot = document.createElement('div');
        this.cursorHalo = document.createElement('div');
        
        this.cursorDot.className = 'santis-cursor-dot';
        this.cursorHalo.className = 'santis-cursor-halo';
        
        document.body.appendChild(this.cursorDot);
        document.body.appendChild(this.cursorHalo);

        // Kuantum Konumlandırma Matrisi
        this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.mouse = { x: this.pos.x, y: this.pos.y };
        this.speed = 0.15; // Halo'nun takip hızı (Sıvı sürtünme katsayısı)
        this.isActive = false;

        this.init();
        console.log("👁️🗨️ [Quantum Cursor] Native imleç katledildi. Sıvı İmleç devrede.");
    }

    init() {
        // 1. Pointermove - for broader device support
        window.addEventListener('pointermove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            if (!this.isActive) {
                this.isActive = true;
                this.cursorHalo.style.opacity = 1;
                this.cursorDot.style.opacity = 1;
            }

            // Çekirdek (Dot) fareyi 0ms gecikme ile (anında) takip eder
            this.cursorDot.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0)`;
        }, { passive: true });

        // 5. Cursor Visibility - Kullanıcı sayfayı terk edince kaybolmalı
        document.addEventListener("mouseleave", () => {
            this.isActive = false;
            this.cursorHalo.style.opacity = 0;
            this.cursorDot.style.opacity = 0;
        });

        document.addEventListener("mouseenter", () => {
            this.isActive = true;
            this.cursorHalo.style.opacity = 1;
            this.cursorDot.style.opacity = 1;
        });

        // Kinetik Lerp döngüsünü başlat
        this.render();
        this.bindMagneticHover();
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    render() {
        // Çember (Halo) fareyi Lerp formülü ile pürüzsüzce takip eder
        this.pos.x = this.lerp(this.pos.x, this.mouse.x, this.speed);
        this.pos.y = this.lerp(this.pos.y, this.mouse.y, this.speed);

        this.cursorHalo.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;

        requestAnimationFrame(() => this.render());
    }

    /**
     * 🧲 MANYETİK KENETLENME (Snap, Hover & Morph)
     * 4. Global Interaction Detection - Sadece spesifik sınıfları değil tüm link/butonları yakala
     */
    bindMagneticHover() {
        document.addEventListener("mouseover", (e) => {
            const target = e.target.closest("a, button, .santis-magnetic, input, [data-santis-cursor]");
            if (target) {
                // 3 Cursor Modu: default, hover, drag
                if (target.classList.contains("santis-drag") || target.closest(".santis-drag") || target.closest(".bento-card-v6")) {
                    this.cursorHalo.classList.add("cursor-drag");
                } else {
                    this.cursorHalo.classList.add("is-snapped");
                }
                this.cursorDot.classList.add("is-hidden"); // Çekirdeği gizle
            }
        });

        document.addEventListener("mouseout", (e) => {
            const target = e.target.closest("a, button, .santis-magnetic, input, [data-santis-cursor]");
            if (target) {
                this.cursorHalo.classList.remove("is-snapped", "cursor-drag");
                this.cursorDot.classList.remove("is-hidden"); // Çekirdeği geri getir
            }
        });
    }
}
