/**
 * 👁️ THE GOD'S EYE (SOVEREIGN TELEMETRY MFE)
 * ADR-003: Distributed Cognitive Admin OS
 * Author: Santis OS Head Engineer
 * Özellikler: Bento Grid UI, Bloomberg Terminal Canvas, Karantina Kapsülü.
 * V2.0: Shadow DOM İzolasyonu, Web Components, Ghost Nodes (Hayalet Düğümler)
 */

// ===============================================================
// 📈 1. SOVEREIGN OPTICS (Canvas Sparkline Renderer)
// ===============================================================
const GOD_MODE_COLORS = {
    canvasBg: 'rgb(10, 15, 12)',
    success: 'rgb(16, 185, 129)',
    danger: 'rgb(239, 68, 68)',
};

class SovereignOpticsRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d', { alpha: false }); 
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.points = Array.from({ length: 150 }, () => this.height - 20); 
        this.loop();
    }

    resize() {
        this.width = this.canvas.parentElement.offsetWidth;
        this.height = this.canvas.parentElement.offsetHeight - 40; // Title payı
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.canvas.style.width = '100%';
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    pushData(jitterMs) {
        const targetY = Math.max(10, this.height - (jitterMs * 2));
        this.points.push(targetY);
        this.points.shift();
    }

    loop() {
        this.ctx.fillStyle = GOD_MODE_COLORS.canvasBg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.beginPath();
        for(let i=10; i<this.height; i+=20) {
            this.ctx.moveTo(0, i); this.ctx.lineTo(this.width, i);
        }
        this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.points[0]);
        for (let i = 1; i < this.points.length; i++) {
            const x = (i / this.points.length) * this.width;
            this.ctx.lineTo(x, this.points[i]);
        }
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = GOD_MODE_COLORS.success;
        this.ctx.stroke();

        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
        this.ctx.fill();

        requestAnimationFrame(() => this.loop());
    }
}

// ===============================================================
// 🕸️ 2. THE NODE RADAR (Abstract Quantum Network & Ghost Nodes)
// ===============================================================
class NodeRadarNetwork {
    constructor(containerElement) {
        this.container = containerElement;
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 8 Adet Tesis Tablet Düğümü
        this.nodes = Array.from({length: 8}, (_,i) => ({
            id: `NODE-0${i+1}`,
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.2, 
            vy: (Math.random() - 0.5) * 0.2,
            ping: Math.random() * 40,
            status: 'HEALTHY' // HEALTHY | WARNING | DEAD (Ghost Node)
        }));

        this.loop();
    }

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight - 40;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.canvas.style.width = '100%';
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    killRandomNode() {
        // Hayalet Düğüm (Ghost Node) Simülasyonu
        const healthyNodes = this.nodes.filter(n => n.status !== 'DEAD');
        if (healthyNodes.length > 0) {
            const unlucky = healthyNodes[Math.floor(Math.random() * healthyNodes.length)];
            unlucky.status = 'DEAD';
            unlucky.vx = 0; // Hayaletler süzülmez, boşlukta asılı kalır
            unlucky.vy = 0;
            return unlucky.id;
        }
        return null;
    }

    updateNodes(telemetryData) {
        if(telemetryData.jitter > 100) {
            const active = this.nodes.filter(n => n.status !== 'DEAD');
            if(active.length > 0) active[Math.floor(Math.random()*active.length)].status = 'WARNING';
        } else {
            this.nodes.forEach(n => { if(n.status !== 'DEAD') n.status = 'HEALTHY'; });
        }
    }

    loop() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Bağlantı Çizgileri (Ağ Örgüsü) - Hayalet düğümler ince çizgiyle bağlanır
        this.ctx.lineWidth = 1;
        for(let i=0; i<this.nodes.length; i++) {
            for(let j=i+1; j<this.nodes.length; j++) {
                const dist = Math.hypot(this.nodes[i].x - this.nodes[j].x, this.nodes[i].y - this.nodes[j].y);
                if(dist < 150) {
                    const isGhostConnection = this.nodes[i].status === 'DEAD' || this.nodes[j].status === 'DEAD';
                    this.ctx.strokeStyle = isGhostConnection ? 'rgba(148, 163, 184, 0.05)' : 'rgba(16, 185, 129, 0.15)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                    this.ctx.stroke();
                }
            }
        }

        // Düğüm Çizimi ve Fizik İşleme
        this.nodes.forEach(n => {
            if (n.status !== 'DEAD') {
                n.x += n.vx; n.y += n.vy;
                if(n.x <= 0 || n.x >= this.width) n.vx *= -1;
                if(n.y <= 0 || n.y >= this.height) n.vy *= -1;
            }

            const isDead = n.status === 'DEAD';
            const isWarning = n.status === 'WARNING';
            const pulse = isDead ? 2 : 4 + Math.sin(Date.now() / 300) * 2;
            
            this.ctx.beginPath();
            this.ctx.arc(n.x, n.y, pulse, 0, Math.PI * 2);
            
            if (isDead) {
                this.ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'; // Sönen Yıldız (Ghost)
                this.ctx.shadowBlur = 0;
            } else if (isWarning) {
                this.ctx.fillStyle = 'rgba(245, 158, 11, 0.9)'; // Sarı Alarm
                this.ctx.shadowBlur = 25;
            } else {
                this.ctx.fillStyle = 'rgba(16, 185, 129, 0.8)'; // Zümrüt Yeşili
                this.ctx.shadowBlur = 15;
            }
            
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.fill();
            this.ctx.shadowBlur = 0; 
        });

        requestAnimationFrame(() => this.loop());
    }
}

// ===============================================================
// 🛡️ 3. SHADOW DOM MFE COMPONENT (Sovereign-God-Mode)
// ===============================================================

class SovereignGodModeComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.holdTimer = null;
        this.holdProgress = 0;
        this.HOLD_REQUIRED_MS = 3000;
        this.UPDATE_INTERVAL = 30;
    }

    connectedCallback() {
        // Shadow DOM İzolasyonu: Sadece bu modülü etkileyen CSS enjeksiyonu
        this.shadowRoot.innerHTML = `
            <style>
                @import url('/assets/css/santis-god-mode.css');
            </style>
            <div id="sovereign-god-mode">
                <div class="god-bento-cell god-optics">
                    <span class="god-cell-title">SOVEREIGN OPTICS (TELEMETRY)</span>
                    <canvas id="canvas-optics" class="god-optics-canvas"></canvas>
                </div>
                <div class="god-bento-cell god-radar" id="radar-container">
                    <span class="god-cell-title">THE NODE RADAR</span>
                    <div class="radar-overlay-text" id="radar-status">ACTV: 8 NODES (SANTIS CLUB HQ)</div>
                </div>
                <div class="god-bento-cell god-anomaly">
                    <span class="god-cell-title">ANOMALY ENGINE AI</span>
                    <div class="anomaly-log" id="ai-log">
                        "Sistem senfonisi kusursuz ilerliyor. Gürültü ve parazit tespit edilmedi. Sovereign OS sessiz lüks içinde çalışıyor."
                    </div>
                    <span class="anomaly-time">TIMESTAMP: <span id="time-span"></span></span>
                </div>
                <div class="god-bento-cell god-killswitch">
                    <span class="god-cell-title" style="color:var(--god-danger);">SOVEREIGN OVERRIDE</span>
                    <button class="btn-killswitch" id="btn-quarantine">
                        <span class="relative" style="z-index:2;">[ 3 SN. HOLD ] KARANTİNA</span>
                    </button>
                    <!-- Dinamik pseudo-element alternatifi div barı, ShadowDOM uyumu için -->
                    <div class="top-0" id="hold-bar" style="position:absolute; left:0; height:100%; width:0%; background:rgba(239, 68, 68, 0.8); z-index:0; transition: width 0.1s linear; border-radius:50vw; pointer-events:none;"></div>
                </div>
            </div>
        `;

        this.initEngines();
        this.bindKillSwitch();
        this.startMockStream();

        setInterval(() => {
            const span = this.shadowRoot.getElementById('time-span');
            if(span) span.innerText = new Date().toISOString();
        }, 1000);
    }

    initEngines() {
        const opticsCanvas = this.shadowRoot.getElementById('canvas-optics');
        const radarContainer = this.shadowRoot.getElementById('radar-container');
        
        this.optics = new SovereignOpticsRenderer(opticsCanvas);
        this.radar = new NodeRadarNetwork(radarContainer);
    }

    startMockStream() {
        setInterval(() => {
            if(this.isQuarantined) return;
            const fakeJitter = Math.random() > 0.95 ? (Math.random() * 150) : (Math.random() * 15);
            this.optics.pushData(fakeJitter);
            this.radar.updateNodes({ jitter: fakeJitter });

            const log = this.shadowRoot.getElementById('ai-log');
            
            // Rastgele bağlantı yitimi (Ghost Node Demo)
            if(Math.random() > 0.99) {
                const deadId = this.radar.killRandomNode();
                if(deadId) {
                    log.innerText = `"Sessiz Kayıp: Tesis içi cihaz (${deadId}) ağdan düştü. Düğüm, radar haritasında 'hayalet' statüsüne çekildi. Sovereign OS otonom izlemeye devam ediyor."`;
                    const activeCount = this.radar.nodes.filter(n=>n.status !== 'DEAD').length;
                    this.shadowRoot.getElementById('radar-status').innerText = `ACTV: ${activeCount} NODES (GHOST: ${8-activeCount})`;
                }
            } else if(fakeJitter > 100 && log.innerText.indexOf('Sessiz Kayıp') === -1) {
                // Ghost node uyarısını ezmeme
                log.innerText = '"Dikkat: NodeRadar ağında anlık dalgalanma (Jitter). Paket kaybı önleyici devreye girdi (Backoff Engine)."';
            }
        }, 100);
    }

    bindKillSwitch() {
        const btn = this.shadowRoot.getElementById('btn-quarantine');
        const bar = this.shadowRoot.getElementById('hold-bar');
        const dashboard = this.shadowRoot.getElementById('sovereign-god-mode');
        this.isQuarantined = false;

        const fillBar = () => {
            this.holdProgress += this.UPDATE_INTERVAL;
            const widthPct = Math.min((this.holdProgress / this.HOLD_REQUIRED_MS) * 100, 100);
            bar.style.width = `${widthPct}%`;

            if (this.holdProgress >= this.HOLD_REQUIRED_MS) {
                this.triggerQuarantine(dashboard, btn);
            }
        };

        const startHold = (e) => {
            e.preventDefault();
            if (this.isQuarantined) return;
            btn.classList.add('is-holding');
            this.holdProgress = 0;
            this.holdTimer = setInterval(fillBar, this.UPDATE_INTERVAL);
        };

        const endHold = () => {
            clearInterval(this.holdTimer);
            btn.classList.remove('is-holding');
            if (!this.isQuarantined) {
                this.holdProgress = 0;
                bar.style.width = '0%';
            }
        };

        btn.addEventListener('mousedown', startHold);
        btn.addEventListener('mouseup', endHold);
        btn.addEventListener('mouseleave', endHold);
        btn.addEventListener('touchstart', startHold);
        btn.addEventListener('touchend', endHold);
    }

    triggerQuarantine(dashboard, btn) {
        clearInterval(this.holdTimer);
        this.isQuarantined = true;
        btn.classList.remove('is-holding');
        btn.classList.add('is-engaged');
        btn.querySelector('span').innerText = "SİSTEM DONDURULDU";
        
        dashboard.classList.add('is-quarantined');
        const log = this.shadowRoot.getElementById('ai-log');
        log.innerText = "💀 CRITICAL OVERRIDE: Sovereign OS Boardroom karantinaya alındı. Kuantum bağı kesildi.";
        log.style.color = GOD_MODE_COLORS.danger;
        
        this.radar.nodes.forEach(n => { n.status = 'WARNING'; n.vx = 0; n.vy = 0; });
        console.warn("💀 [God's Eye] KARANTİNA KAPSÜLÜ BAŞARIYLA TETİKLENDİ. Shadow DOM İzole Edildi.");
    }
}

// Global Component Kaydı
customElements.define('sovereign-god-mode', SovereignGodModeComponent);
