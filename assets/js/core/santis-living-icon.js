/**
 * 🫀 FAZ Φ (PHI): SANTIS LIVING ICON ENGINE v1.0
 * Kuantum Mührünü Canlı Bir Telemetri Radarına (Nabız) Çeviren Biyolojik Katman
 */
class SantisLivingIcon {
    constructor() {
        this.linkNode = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
        if (!this.linkNode) {
            this.linkNode = document.createElement('link');
            this.linkNode.rel = 'icon';
            this.linkNode.type = 'image/svg+xml';
            document.head.appendChild(this.linkNode);
        }

        // 🎨 BİYOMETRİK DURUMLAR: Renkler ve Nefes (Animasyon) Hızları
        this.states = {
            OPTIMAL:  { color: "#00FFCC", dur: "2s",   pulse: "24;30;24" }, // 🟢 Kuantum Yeşili: Sakin, derin nefes
            WARNING:  { color: "#FACC15", dur: "0.8s", pulse: "24;32;24" }, // 🟡 Kehribar Sarısı: Hızlı nabız (CPU/Ağ stresi)
            CRITICAL: { color: "#EF4444", dur: "0.3s", pulse: "24;38;24" }, // 🔴 Kan Kırmızısı: Panik nabız (WS koptu)
            OFFLINE:  { color: "#6B7280", dur: "0s",   pulse: "24;24;24" }  // ⚪ Ölü Gri: Düz çizgi (İnternet yok/Koma)
        };

        this.currentState = null;
        console.log("🫀 [Living Icon] Kinetik Mühür motoru uyandı. Telemetri damarlarına bağlanılıyor...");
        
        this.#startHeartbeat();
    }

    // 🧬 SVG DNA'SINI CANLI OLARAK SENTEZLE
    #generateSVG(stateConfig) {
        const { color, dur, pulse } = stateConfig;
        
        // ⚡ Koma durumunda değilse animasyonu (Nefesi) SVG'ye göm
        const animation = dur !== "0s" 
            ? `<animate attributeName="r" values="${pulse}" dur="${dur}" repeatCount="indefinite" />` 
            : "";

        // Minimalist Sovereign Mührü (SVG Matrisi)
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <defs>
                <linearGradient id="sovereignGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#D4AF37" />
                    <stop offset="100%" stop-color="#FACC15" />
                </linearGradient>
            </defs>
            <rect width="512" height="512" rx="128" fill="#030303"/>
            <path d="M 360 152 L 152 152 L 152 256 L 360 256 L 360 360 L 152 360" fill="none" stroke="url(#sovereignGradient)" stroke-width="48" stroke-linecap="square" stroke-linejoin="miter"/>
            <circle cx="360" cy="152" r="24" fill="${color}" />
            <circle cx="152" cy="360" r="24" fill="${color}" />
            <circle cx="256" cy="256" r="24" fill="${color}">
                ${animation}
            </circle>
        </svg>`;

        // Güvenli Base64 Dönüşümü
        return `data:image/svg+xml;base64,${btoa(svgString)}`;
    }

    #mutateSeal(stateKey) {
        if (this.currentState === stateKey) return; // Aynı durumdaysa DOM'u yorma (Zero-Friction)
        this.currentState = stateKey;

        // Taze kanı (Yeni SVG Data URI) sekme çubuğuna pompala!
        this.linkNode.href = this.#generateSVG(this.states[stateKey]);
        console.log(`👁️ [Living Seal] Organizma Nabzı Değişti: ${stateKey} (${this.states[stateKey].color})`);
    }

    // 📡 TELEMETRİ RADARI (Sovereign OS'in Merkezi Sinir Sistemini Dinler)
    #startHeartbeat() {
        setInterval(() => {
            let nextState = "OPTIMAL";

            // 1. Fiziksel Bağlantı Koptuysa (En ölümcül durum)
            if (!navigator.onLine) {
                nextState = "OFFLINE";
            } 
            else {
                // 2. Faz L'deki Telemetry Bus uyanıksa stres analizi yap (İşlemci boğuluyorsa)
                let isCpuStressed = false;
                // Try window.SovereignHealthEngine or if fallback use local checks
                if (window.SovereignHealthEngine && window.SovereignHealthEngine.bus) {
                    isCpuStressed = window.SovereignHealthEngine.bus.metrics.eventLoopLag > 50; // 50ms üstü gecikme = Stres
                } else if (window.santisPrecog) {
                    isCpuStressed = window.santisPrecog.timeline.cpuThrottled;
                }
                
                // 3. WebSocket Koptuysa (Amiral Gemisi ile iletişim kesildiyse)
                let isWsDead = false;
                if (window.santisStream) {
                    isWsDead = !window.santisStream.isConnected;
                }

                if (isWsDead) {
                    nextState = "CRITICAL";
                } else if (isCpuStressed) {
                    nextState = "WARNING";
                }
            }

            this.#mutateSeal(nextState);
        }, 1000); // Nabız saniyede 1 kez dinlenir
    }
}

// 🌐 SİSTEME MÜHÜRLE
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.santisLivingIcon = new SantisLivingIcon());
} else {
    window.santisLivingIcon = new SantisLivingIcon();
}
