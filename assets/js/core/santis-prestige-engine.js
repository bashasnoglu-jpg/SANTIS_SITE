/**
 * ═══════════════════════════════════════════════════════════
 * SANTIS OS - THE GLASS CANVAS & NEUROLINK (Phase 46 Act I)
 * ═══════════════════════════════════════════════════════════
 * Aptal ama çok hızlı Main Thread İletkeni. 
 * Kognitif/Matematiksel yük taşımaz, sadece sensör verisini toplar,
 * Worker'a atar ve The NeuroLink (BroadcastChannel) sinyallerini 
 * dinleyerek pikselleri 120Hz hızında DOM'a yansıtır.
 */

class SantisPrestigeGlassCanvas {
    constructor() {
        this.isObsidian = false;
        this.initNeuroLink();
        this.initOracle();
        this.bindSensors();
    }

    initOracle() {
        if (!window.__oracleWorker) {
            window.__oracleWorker = new Worker('/assets/js/workers/santis-cognitive-worker.js');
        }
        this.oracle = window.__oracleWorker;
        
        // Lokal Hafıza Kumaşını (Persistence) oku
        let initialSAI = 0;
        try {
            const enc = localStorage.getItem('_santis_sai_v1');
            if (enc) initialSAI = parseFloat(atob(enc)) || 0;
        } catch(e) {}

        this.oracle.postMessage({ type: 'INIT', initialSAI: initialSAI });

        // Oracle'dan (Worker'dan) gelen Telepatik Yanıtları Dinle
        this.oracle.onmessage = (e) => {
            const data = e.data;
            if (data.action === 'UNLOCK_OBSIDIAN') {
                console.warn(`🔮 [The Oracle] Sentetik Zeka Onayı: Zarafet Sınırı Aşıldı. SAI: ${data.sai}`);
                this.saveScore(data.sai); // Kalıcılık mührü
                this.activateObsidianMode(true, true);
            }
        };

        // Açılışta zaten VIP ise anında karanlığa bürün
        if (initialSAI >= 1000) this.activateObsidianMode(false, false);
        
        // Kalp Atışı: Her saniye Oracle'a "Ben sakinim" (Dwell Time) sinyali gönder
        setInterval(() => {
            if (!this.isObsidian && document.visibilityState === 'visible') {
                this.oracle.postMessage({ 
                    type: 'KINEMATIC_TICK', 
                    payload: { isIdleTick: true, timestamp: performance.now() }
                });
            }
        }, 1000);
    }

    initNeuroLink() {
        if ("BroadcastChannel" in window) {
            this.neuroLink = new BroadcastChannel('santis_omniverse');
            this.neuroLink.onmessage = (e) => {
                if (e.data.state === 'OBSIDIAN_AWAKENED') {
                    console.log("🌌 [The NeuroLink] Paralel Evrenden Şimşek Sinyali Alındı. Sayfa Yenilemeden Karanlık Mode Uyanıyor!");
                    this.activateObsidianMode(true, false);
                }
            };
        }
    }

    bindSensors() {
        let isThrottled = false;
        
        // Scroll İletkeni: DOM'dan alır, Kuantum çekirdeğine kusar (requestAnimationFrame throttle)
        document.addEventListener('scroll', () => {
            if (this.isObsidian) return;
            if (!isThrottled) {
                requestAnimationFrame(() => {
                    this.oracle.postMessage({
                        type: 'KINEMATIC_TICK',
                        payload: { scrollY: window.scrollY, timestamp: performance.now() }
                    });
                    isThrottled = false;
                });
                isThrottled = true;
            }
        }, { passive: true });
    }

    saveScore(score) {
        try { localStorage.setItem('_santis_sai_v1', btoa(score.toString())); } catch(e) {}
    }

    forceVIP() { 
        // God Mode Backdoor
        this.saveScore(1500);
        this.activateObsidianMode(true, true);
    }

    activateObsidianMode(withAnimation = true, shouldBroadcast = true) {
        if (this.isObsidian) return;
        this.isObsidian = true;

        if (shouldBroadcast && this.neuroLink) {
            // Paralel evrenlere fırlat
            this.neuroLink.postMessage({ state: 'OBSIDIAN_AWAKENED' });
        }

        console.warn("♠️ [The Glass Canvas] Obsidian Mode Metamorfozu İşleniyor...");

        // 1. Karanlık Lüks CSS Enjeksiyonu
        if (!document.getElementById('santis-obsidian-style')) {
            const style = document.createElement('style');
            style.id = 'santis-obsidian-style';
            style.innerHTML = `
                :root { --santis-bg: #09090b !important; --santis-text: #e5e5e5 !important; --santis-gold: #D4AF37 !important; }
                body.santis-obsidian { background-color: var(--santis-bg) !important; color: var(--santis-text) !important; font-weight: 300 !important; }
                body.santis-obsidian h1, body.santis-obsidian h2, body.santis-obsidian h3 { color: #f3f4f6 !important; font-weight: 300 !important; }
                .santis-obsidian .bento-card-v6 { background: rgba(255,255,255,0.02) !important; border: 1px solid rgba(212,175,55,0.1) !important; }
                @keyframes revealVIP { 0% { opacity:0; transform:translateY(20px); filter:blur(10px); } 100% { opacity:1; transform:translateY(0); filter:blur(0); } }
                .vip-revealed { animation: revealVIP 3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .direct-concierge-btn { position:fixed; bottom:30px; right:30px; background:transparent; border:1px solid rgba(212,175,55,0.5); color:#D4AF37; padding:12px 24px; border-radius:30px; cursor:pointer; font-family:'Cinzel', serif; letter-spacing:0.1em; opacity:0; transition:all 0.5s; backdrop-filter:blur(10px); z-index:9999; }
            `;
            document.head.appendChild(style);
        }

        const mutateDOM = () => {
            document.body.classList.add('santis-obsidian');
            
            // 2. The Hidden Chambers (Bento Kartı)
            const grid = document.querySelector('.bento-grid-v6') || document.querySelector('#santis-main');
            if (grid && !document.getElementById('vip-reserve-card')) {
                const card = document.createElement('div');
                card.id = 'vip-reserve-card';
                card.className = 'bento-card-v6 vip-revealed';
                card.style.cssText = 'grid-column:span 2; border:1px solid rgba(212,175,55,0.5) !important;';
                card.innerHTML = `<div style="padding:2rem; text-align:center;"><span style="color:#D4AF37; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.2em;">Private Reserves</span><h3 style="font-family:'Cinzel',serif; font-size:1.8rem; margin:10px 0; color:#fff;">Sovereign Estates</h3><p style="color:#a0a0a0; font-size: 0.9rem; font-weight: 300;">Yalnızca davetiye ile erişilebilen usta işi dokunuşlar.</p></div>`;
                grid.appendChild(card);
            }
            
            // 3. Direct Concierge
            if (!document.getElementById('direct-concierge')) {
                const btn = document.createElement('button');
                btn.id = 'direct-concierge';
                btn.className = 'direct-concierge-btn vip-revealed';
                btn.innerText = 'DIRECT CONCIERGE';
                document.body.appendChild(btn);
                setTimeout(() => btn.style.opacity = '1', 3000);
            }
        };

        // Pürüzsüz View Transitions API Mutasyonu
        if (withAnimation && document.startViewTransition) {
            try {
                const transition = document.startViewTransition(() => mutateDOM());
                const handleAbort = e => {
                    if (e && e.name === 'AbortError') {
                        // Silent catch for expected aborted transitions
                    } else {
                        console.error('[Prestige Engine] View Transition error:', e);
                    }
                };
                transition.ready.catch(handleAbort);
                transition.finished.catch(handleAbort);
                if (transition.updateCallbackDone) transition.updateCallbackDone.catch(handleAbort);
            } catch (e) {
                console.warn('[Prestige Engine] View Transition fallback handled.');
                mutateDOM();
            }
        } else {
            if (withAnimation) document.body.style.transition = 'background-color 4s ease';
            mutateDOM();
        }
    }
}

// Otonom Başlatma
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SantisPrestige = new SantisPrestigeGlassCanvas());
} else {
    window.SantisPrestige = new SantisPrestigeGlassCanvas();
}
