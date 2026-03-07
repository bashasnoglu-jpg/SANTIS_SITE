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
        // Zaten varsa bir daha ekleme, ama elementleri map et!
        if (document.getElementById('aurelia-glass-panel')) {
            this.panel = document.getElementById('aurelia-glass-panel');
            this.textNode = document.getElementById('aurelia-text');
            this.cursor = document.getElementById('aurelia-cursor');
            return;
        }

        const htmlRaw = `
            <div id="aurelia-glass-panel" style="position: fixed; bottom: 40px; right: 40px; opacity: 0; pointer-events: none; z-index: 9999;">
                <div class="aurelia-header">
                    <div class="aurelia-identity">
                        <div class="aurelia-status-dot" id="aurelia-pulse"></div>
                        <div>
                            <div class="aurelia-title">Aurelia</div>
                            <div class="aurelia-subtitle">Sovereign Concierge</div>
                        </div>
                    </div>
                    <button class="aurelia-close" id="aurelia-btn-close">×</button>
                </div>
                
                <div class="aurelia-body" id="aurelia-text-container">
                    <span id="aurelia-text"></span>
                    <span class="aurelia-cursor" id="aurelia-cursor"></span>
                </div>
                
                <div class="aurelia-actions">
                    <button class="aurelia-btn decline" id="aurelia-btn-decline">Sessizlik Lütfen</button>
                    <button class="aurelia-btn accept" id="aurelia-btn-accept">Ayrıcalığı Kabul Et</button>
                </div>
            </div>
        `;

        // Create Container
        const container = document.createElement('div');
        container.innerHTML = htmlRaw.trim();
        document.body.appendChild(container.firstChild);

        // Inject CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/css/aurelia-chat.css';
        document.head.appendChild(link);

        // Map Elements
        this.panel = document.getElementById('aurelia-glass-panel');
        this.textNode = document.getElementById('aurelia-text');
        this.cursor = document.getElementById('aurelia-cursor');

        // Binds
        document.getElementById('aurelia-btn-close').addEventListener('click', () => this.hide());
        document.getElementById('aurelia-btn-decline').addEventListener('click', () => this.hide());
        document.getElementById('aurelia-btn-accept').addEventListener('click', () => this.acceptOffer());
    }

    show() {
        if (!this.panel) return;
        this.panel.classList.add('visible');
    }

    hide() {
        if (!this.panel) return;
        this.panel.classList.remove('visible');
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
