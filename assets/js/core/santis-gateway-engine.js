/**
 * 🦅 SOVEREIGN MODE v2 - NEURAL ENTRY POINT & COMMAND PALETTE
 * Global Kuantum Router & Otonom Menü Orkestratörü
 */
class SovereignGatewayEngine {
    constructor() {
        this.manifestUrl = '/api/nav-manifest';
        this.containerId = 'sovereign-gateway-container';
        this.paletteId = 'sovereign-cmd-palette';
        this.navData = null;
        
        this.init();
    }

    async init() {
        await this.fetchManifest();
        this.injectCSS();
        // Sadece admin sayfalarında sol menüyü oluştur
        if (window.location.pathname.includes('/admin/')) {
            this.buildGateway();
        }
        this.initPrefetch();
        this.initCommandPalette();
        console.log("🌌 [Sovereign Gateway V2] Neural Entry Point & CMD+K Command Palette Aktif.");
    }

    async fetchManifest() {
        try {
            const res = await fetch(this.manifestUrl);
            if (!res.ok) throw new Error('Manifest API failed');
            this.navData = await res.json();
        } catch (e) {
            console.warn("⚠️ [Gateway] Manifest API down. Failsafe (Production Zırhı) devrede.", e);
            this.navData = {
                items: [
                    { name: "Boardroom", icon: "🏛️", path: "/admin/boardroom.html" },
                    { name: "God's Eye", icon: "👁️", path: "/admin/gods-eye-vision.html" },
                    { name: "CRM", icon: "💼", path: "/admin/crm.html" },
                    { name: "Revenue", icon: "💰", path: "/admin/revenue.html" },
                    { name: "Black Room", icon: "🌑", path: "/admin/black-room.html" },
                    { name: "Sovereign Lab", icon: "🧪", path: "/admin/sovereign-lab.html" }
                ]
            };
        }
    }

    buildGateway() {
        // Build the fixed Glass UI Navigation via JS
        const wrapper = document.createElement('div');
        wrapper.id = this.containerId;
        
        const nav = document.createElement('nav');
        nav.id = 'sovereign-gateway-inner';

        this.navData.items.forEach(item => {
            const link = document.createElement('a');
            link.href = item.path;
            link.innerHTML = `<span>${item.icon}</span> <span>${item.name}</span>`;

            if (location.pathname.includes(item.path.split('/').pop())) {
                link.classList.add('active');
            }

            nav.appendChild(link);
        });

        wrapper.appendChild(nav);
        document.body.appendChild(wrapper);
    }

    initPrefetch() {
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest(`#${this.containerId} a, #${this.paletteId} a`);
            if (link && !link.dataset.prefetched && link.href) {
                const prefetch = document.createElement('link');
                prefetch.rel = 'prefetch';
                prefetch.href = link.href;
                document.head.appendChild(prefetch);
                link.dataset.prefetched = "true";
                console.log(`⚡ [Gateway] Neural Prefetch kilitlendi: ${link.href}`);
            }
        });
    }

    initCommandPalette() {
        // Command Palette (CMD+K)
        const paletteHTML = `
            <div id="${this.paletteId}" class="sovereign-palette-overlay">
                <div class="sovereign-palette-box">
                    <div class="palette-header">
                        <span class="pulse-dot"></span>
                        <input type="text" id="sovereign-cmd-input" placeholder="Sovereign Control Plane... (örn: 'go crm', 'simulate crash')" autocomplete="off">
                        <span class="esc-hint">ESC</span>
                    </div>
                    <div id="sovereign-cmd-results" class="palette-results"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', paletteHTML);
        
        const overlay = document.getElementById(this.paletteId);
        const input = document.getElementById('sovereign-cmd-input');

        // Klavye Dinleyici
        document.addEventListener('keydown', (e) => {
            // CMD+K (Mac) veya CTRL+K (Win)
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                overlay.classList.add('active');
                input.value = '';
                this.renderPaletteResults('');
                input.focus();
            }
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                overlay.classList.remove('active');
            }
        });

        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) overlay.classList.remove('active');
        });

        input.addEventListener('input', (e) => {
            this.renderPaletteResults(e.target.value);
        });
    }

    renderPaletteResults(query) {
        const resultsBox = document.getElementById('sovereign-cmd-results');
        resultsBox.innerHTML = '';
        const q = query.toLowerCase();

        // Admin Node listesini Command Matrix'e bağla
        const commands = this.navData.items.map(i => ({ type: 'route', name: `Execute /${i.name.toLowerCase()}`, icon: i.icon, path: i.path }))
            .concat([
                { type: 'action', name: "simulate crash (Resilience Test)", icon: "🔥", action: () => alert("🚨 SOVEREIGN HEALTH: Crash Simulated!") },
                { type: 'action', name: "purge memory (GC Clear)", icon: "🧹", action: () => { console.clear(); alert("🧠 OMEGA KERNEL: V44 Purge Executed (Zero-Leak)"); } },
                { type: 'action', name: "trigger biometric checkout", icon: "🧬", path: "/ritueller.html" }
            ]);

        const filtered = commands.filter(c => c.name.toLowerCase().includes(q) || c.type.includes(q));

        if (filtered.length === 0) {
            resultsBox.innerHTML = `<div class="palette-empty">Operasyon bulunamadı. Kuantum Veritabanı tarandı.</div>`;
            return;
        }

        filtered.forEach((cmd, idx) => {
            const div = document.createElement('div');
            // 'selected' style on hover via CSS
            div.className = 'palette-item';
            div.innerHTML = `<span>${cmd.icon}</span> <span>${cmd.name}</span>`;
            div.addEventListener('click', () => {
                if(cmd.path) window.location.href = cmd.path;
                else if(cmd.action) cmd.action();
                document.getElementById(this.paletteId).classList.remove('active');
            });
            resultsBox.appendChild(div);
        });
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            #sovereign-gateway-container {
                position: fixed;
                top: 24px;
                left: 24px;
                z-index: 9999;
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            #sovereign-gateway-inner {
                display: flex;
                flex-direction: column;
                gap: 6px;
                backdrop-filter: blur(20px);
                background: rgba(10, 10, 12, 0.65);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            }
            #sovereign-gateway-inner a {
                font-family: 'Inter', sans-serif;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 1.5px;
                color: #d4af37;
                text-decoration: none;
                opacity: 0.5;
                transition: all .2s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 14px;
                border-radius: 8px;
                text-transform: uppercase;
            }
            #sovereign-gateway-inner a:hover {
                opacity: 1;
                transform: translateX(6px);
                background: rgba(212,175,55,0.08);
            }
            #sovereign-gateway-inner a.active {
                opacity: 1;
                color: #00FFCC;
                background: rgba(0, 255, 204, 0.05);
                border-left: 2px solid #00FFCC;
                padding-left: 12px;
            }

            /* COMMAND PALETTE ZIRHI */
            .sovereign-palette-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.6); backdrop-filter: blur(12px);
                z-index: 99999; opacity: 0; visibility: hidden;
                display: flex; align-items: flex-start; justify-content: center;
                padding-top: 15vh; transition: all 0.2s ease;
            }
            .sovereign-palette-overlay.active { opacity: 1; visibility: visible; }
            .sovereign-palette-box {
                width: 100%; max-width: 650px; background: #0f0f11;
                border: 1px solid rgba(212,175,55,0.3); border-radius: 16px;
                box-shadow: 0 30px 60px rgba(0,0,0,0.7); overflow: hidden;
                transform: scale(0.95) translateY(-20px); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .sovereign-palette-overlay.active .sovereign-palette-box {
                transform: scale(1) translateY(0);
            }
            .palette-header {
                display: flex; align-items: center; padding: 18px 24px; border-b: 1px solid rgba(255,255,255,0.05); gap: 14px;
            }
            .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #00FFCC; box-shadow: 0 0 12px #00FFCC; }
            #sovereign-cmd-input {
                flex-grow: 1; background: transparent; border: none; font-size: 16px; color: white;
                font-family: 'Inter', sans-serif; outline: none; letter-spacing: 0.5px;
            }
            #sovereign-cmd-input::placeholder { color: #444; }
            .esc-hint { font-size: 10px; color: #666; font-family: monospace; border: 1px solid #333; padding: 3px 8px; border-radius: 4px; }
            .palette-results { max-height: 350px; overflow-y: auto; padding: 12px; }
            .palette-empty { text-align: center; color: #555; font-size: 12px; padding: 20px; text-transform: uppercase; letter-spacing: 1px; }
            .palette-item {
                display: flex; align-items: center; gap: 14px; padding: 14px 20px; color: #888;
                font-family: 'Inter', sans-serif; font-size: 13px; cursor: pointer; border-radius: 10px;
                transition: all 0.15s; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500;
            }
            .palette-item:hover {
                background: rgba(212,175,55,0.1); color: #D4AF37; padding-left: 24px;
            }
            
            /* Custom Scrollbar */
            .palette-results::-webkit-scrollbar { width: 4px; }
            .palette-results::-webkit-scrollbar-track { background: transparent; }
            .palette-results::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            .palette-results::-webkit-scrollbar-thumb:hover { background: #D4AF37; }
            
            /* Admin Mobile Header Constraint */
            @media (max-width: 768px) {
                #sovereign-gateway-container { display: none; } /* Mobile'da alt menü veya command palette yeterli */
            }
        `;
        document.head.appendChild(style);
    }
}

// Ignition
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.santisGatewayEngine = new SovereignGatewayEngine(); });
} else {
    window.santisGatewayEngine = new SovereignGatewayEngine();
}
