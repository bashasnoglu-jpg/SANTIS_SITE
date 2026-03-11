/**
 * 👑 SANTIS OS - AURELIA CONCIERGE ENGINE v1.0
 * The Neural Ghost Interface (Black Glassmorphism & Typewriter)
 */

class AureliaConcierge {
    constructor() {
        this.isTyping = false;
        this.panel = null;
        this.body = null;
        this.cursor = null;

        // Auto-Inject on DOM Content Loaded
        this.injectUI();
    }

    injectUI() {
        if (document.getElementById('aurelia-glass-panel')) {
            this.panel = document.getElementById('aurelia-glass-panel');
            this.textNode = document.getElementById('aurelia-text');
            this.cursor = document.getElementById('aurelia-cursor');
            return;
        }

        const sdfStyle = document.createElement('style');
        sdfStyle.innerHTML = `
            @keyframes vectorOmegaVibrate {
                0% { transform: scale(1) rotate(0deg); box-shadow: 0 0 100px rgba(212,175,55,0.2); }
                25% { transform: scale(0.998) rotate(-0.5deg) translate(-1px, 1px); box-shadow: 0 0 120px rgba(212,175,55,0.3); }
                50% { transform: scale(1.002) rotate(0.4deg) translate(1px, -1px); box-shadow: 0 0 90px rgba(212,175,55,0.2); }
                75% { transform: scale(0.999) rotate(-0.2deg) translate(-0.5px, -1px); box-shadow: 0 0 110px rgba(212,175,55,0.4); }
                100% { transform: scale(1) rotate(0deg); box-shadow: 0 0 100px rgba(212,175,55,0.2); }
            }
            .aurelia-luxury-arrest {
                pointer-events: auto !important;
                opacity: 1 !important;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(20px);
            }
            .aurelia-omega-inertia {
                animation: vectorOmegaVibrate 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
            }
            #aurelia-sdf-distortion {
                background: radial-gradient(circle at 50% 50%, rgba(201,169,110,0.1), transparent 60%),
                            repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0, rgba(201,169,110,0.03) 2px, transparent 4px);
                animation: sdfPulse 8s linear infinite;
            }
            @keyframes sdfPulse {
                0% { transform: scale(1) rotate(0deg); }
                50% { transform: scale(1.1) rotate(5deg); }
                100% { transform: scale(1) rotate(0deg); }
            }
        `;
        document.head.appendChild(sdfStyle);

        const htmlRaw = `
            <div id="aurelia-hyper-overlay" style="position:fixed; inset:0; z-index:99998; opacity:0; pointer-events:none; transition:opacity 0.8s ease-out; background:rgba(0,0,0,0.8); backdrop-filter:blur(15px);">
                <div id="aurelia-sdf-distortion" style="position:absolute; inset:0; mix-blend-mode:overlay; opacity:0.6;"></div>
            </div>

            <div id="aurelia-glass-panel" style="position: fixed; inset: 0; opacity: 0; pointer-events: none; z-index: 99999; display: flex; align-items: center; justify-content: center; transition: opacity 0.5s ease-out;">
                <div id="aurelia-vector-panel" style="position:relative; background: #050505; border: 1px solid rgba(212,175,55,0.4); border-radius: 16px; padding: 40px; width: 90%; max-width: 600px; box-shadow: 0 0 80px rgba(212,175,55,0.2); overflow:hidden;">
                    
                    <div style="position:absolute; inset:0; background:radial-gradient(ellipse at top, rgba(201,169,110,0.1), transparent 70%); pointer-events:none;"></div>
                    
                    <div class="aurelia-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:16px; margin-bottom:24px;">
                        <div class="aurelia-identity" style="display:flex; align-items:center; gap:12px;">
                            <div class="aurelia-status-dot" id="aurelia-pulse" style="width:8px; height:8px; background:#D4AF37; border-radius:50%; box-shadow:0 0 10px #D4AF37;"></div>
                            <div>
                                <div class="aurelia-title" style="color:#D4AF37; font-family:monospace; font-size:14px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">Aurelia AI</div>
                                <div class="aurelia-subtitle" style="color:#888; font-family:monospace; font-size:10px; letter-spacing:1px; text-transform:uppercase;">Sovereign Interceptor</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="aurelia-body" id="aurelia-text-container" style="min-height:100px; text-align:center; padding:20px 0;">
                        <span id="aurelia-text" style="color:#FFF; font-size:18px; font-weight:300; line-height:1.6; letter-spacing:0.5px;"></span>
                        <span class="aurelia-cursor" id="aurelia-cursor" style="display:inline-block; width:6px; height:18px; background:#D4AF37; margin-left:8px; vertical-align:middle; animation:pulse 1s infinite alternate;"></span>
                    </div>
                    
                    <div class="aurelia-actions" style="display:flex; gap:16px; margin-top:20px;">
                        <button class="aurelia-btn decline" id="aurelia-btn-decline" style="flex:1; padding:16px; background:transparent; border:1px solid #333; color:#888; border-radius:8px; font-family:monospace; font-size:11px; text-transform:uppercase; letter-spacing:2px; cursor:pointer;">Sessizlik Lütfen</button>
                        <button class="aurelia-btn accept" id="aurelia-btn-accept" style="flex:2; padding:16px; background:#D4AF37; border:none; color:#000; font-weight:bold; border-radius:8px; font-family:monospace; font-size:12px; text-transform:uppercase; letter-spacing:2px; cursor:pointer; box-shadow:0 0 20px rgba(212,175,55,0.4);">Ayrıcalığı Kabul Et</button>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        container.innerHTML = htmlRaw.trim();
        document.body.appendChild(container.firstChild);
        document.body.appendChild(document.getElementById('aurelia-glass-panel'));

        this.panel = document.getElementById('aurelia-glass-panel');
        this.overlay = document.getElementById('aurelia-hyper-overlay');
        this.vectorPanel = document.getElementById('aurelia-vector-panel');
        this.textNode = document.getElementById('aurelia-text');
        this.cursor = document.getElementById('aurelia-cursor');

        // Binds
        document.getElementById('aurelia-btn-close').addEventListener('click', () => this.hide());
        document.getElementById('aurelia-btn-decline').addEventListener('click', () => this.hide());
        document.getElementById('aurelia-btn-accept').addEventListener('click', () => this.acceptOffer());
    }

    show() {
        if (!this.panel) return;
        this.panel.classList.add('aurelia-luxury-arrest');
        this.overlay.style.opacity = '1';
        this.vectorPanel.classList.add('aurelia-omega-inertia');
        document.body.style.overflow = 'hidden'; // Freeze SPA (Wormhole freeze)
        
        // Block Escape Routing
        window.history.pushState(null, null, window.location.href);

        this.logToNeuralMemory();
    }

    hide() {
        if (!this.panel) return;
        this.panel.classList.remove('aurelia-luxury-arrest');
        this.overlay.style.opacity = '0';
        this.vectorPanel.classList.remove('aurelia-omega-inertia');
        document.body.style.overflow = ''; // Restore Flow
    }

    logToNeuralMemory() {
        // Vercel Edge + Upstash Redis Neural Memory Simulation
        console.log(`🧠 [Aurelia Edge] Logging Exit-Intent to Upstash Redis... Persona: ${window.SANTIS?.persona || 'Unknown'}`);
        try {
            const memory = JSON.parse(localStorage.getItem('sv_neural_memory') || '{"strikes":0, "last_escaped":null}');
            memory.strikes += 1;
            memory.last_escaped = new Date().toISOString();
            localStorage.setItem('sv_neural_memory', JSON.stringify(memory));
            console.log(`📡 [Aurelia Edge] Memory written. Target is locked for future predictions.`);
        } catch(e) {}
    }

    acceptOffer() {
        // Balina kabul ettiğinde Rezervasyon Modal'ına Sovereign parametresiyle geçilir

        // 🚀 PHASE 83: LOG EDGE ANALYTICS CONVERSION
        fetch('http://localhost:8000/api/edge/analytics/edge_prefetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                persona: window.SANTIS?.persona || sessionStorage.getItem('santis_persona') || 'default',
                whisperId: 'Aurelia Sovereign Impact',
                success: true,
                revenue: 4250 // Base uplift (Ornek 124 rezervasyon basarısı varsayımıyla ciro simülasyonu)
            })
        }).catch(err => console.warn('[Phase 83] Edge Logger Bypass:', err));

        if (typeof window.openReservationModal === 'function') {
            window.openReservationModal('Sovereign Priority Upgrade');
            this.hide();
        } else {
            console.warn("⚠️ [Aurelia] Reservation Modal API bulunamadı, fallback tetikleniyor.");
            window.location.href = "/?booking=open";
        }
    }

    async awaken(intentScore, currentNode) {
        if (this.isTyping) return;
        this.isTyping = true;

        this.textNode.innerHTML = ""; // Temizle
        this.show();

        try {
            // EDGE WORKER (Sovereign Orchestrator) Streaming API'sine bağlan (Örnek Endpoint)
            // Real Phase'de bura https://edge.santis-os.com/api/v1/aurelia/stream olacaktır.
            const apiBase = window.__API_BASE__ || 'http://127.0.0.1:8000/api/v1';
            let csrfToken = '';
            const match = document.cookie.match(new RegExp('(^| )csrf_token=([^;]+)'));
            if (match) csrfToken = match[2];

            const response = await fetch(`${apiBase}/telemetry/aurelia-mock`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ intent_score: intentScore, node: currentNode })
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            const streamLoop = async () => {
                const { done, value } = await reader.read();
                if (done) {
                    this.isTyping = false;
                    return;
                }

                const chunk = decoder.decode(value, { stream: true });
                requestAnimationFrame(() => {
                    this.textNode.innerHTML += chunk;
                });

                await streamLoop();
            };

            await streamLoop();

        } catch (error) {
            console.error("🛑 [Sovereign Guard] Aurelia Streaming Connection Failed.", error);
            // Fallback (Offline Rescue) with Typewriter Effect
            const fallbackText = "Eğer düşünmek için daha fazla dinginliğe ihtiyacınız varsa, lütfen bana bildirin. VIP önceliğiniz 15 dakika saklı tutulacaktır.";

            let i = 0;
            const typeOffline = () => {
                if (i < fallbackText.length) {
                    this.textNode.innerHTML += fallbackText.charAt(i);
                    i++;
                    setTimeout(typeOffline, 35);
                } else {
                    this.isTyping = false;
                }
            };
            typeOffline();
        }
    }
}

// Global olarak serbest bırak
window.Aurelia = new AureliaConcierge();
