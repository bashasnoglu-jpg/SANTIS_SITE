/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V43.1
 * Modül: OBSERVABILITY KERNEL (The Sovereign Panopticon)
 * "Zaman bükülebilir, ancak asla yalan söyleyemez."
 * =======================================================
 */

export class SovereignPanopticon {
    constructor(scheduler) {
        this.scheduler = scheduler;
        this.isActive = false;
        this.lastTick = performance.now();
        this.lineageGraph = new Map();
        
        // Kuantum Gözünü Aç (CTRL + SHIFT + O)
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyO') {
                e.preventDefault();
                this.toggle();
            }
        });

        this._injectDiagnosticHUD();
        this._attachDevToolsBridge();
    }

    _injectDiagnosticHUD() {
        if (document.getElementById('sdcr-panopticon')) return;

        this.hud = document.createElement('div');
        this.hud.id = 'sdcr-panopticon';
        Object.assign(this.hud.style, {
            position: 'fixed', top: '20px', right: '20px', width: '380px',
            background: 'rgba(9, 9, 11, 0.90)', border: '1px solid #27272a',
            color: '#a1a1aa', fontFamily: 'monospace', fontSize: '11px',
            padding: '15px', zIndex: '999999', display: 'none',
            backdropFilter: 'blur(10px)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            pointerEvents: 'none', borderRadius: '8px'
        });

        this.hud.innerHTML = `
            <div style="color: #06b6d4; font-weight: bold; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin-bottom: 8px; letter-spacing: 1px;">
                👁️ SDCR PANOPTICON V43.1
            </div>
            <div id="pan-v8-health" style="margin-bottom: 4px;">V8 EVENT LOOP: CALCULATING...</div>
            <div id="pan-peb-status">PEB BUDGET: CALCULATING...</div>
            
            <div style="margin-top: 15px; border-bottom: 1px solid #27272a; padding-bottom: 5px; color: #fff;">🧬 TEMPORAL DIFF INSPECTOR</div>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between;"><span>VISUAL (Illusion):</span> <span id="pan-visual" style="color:#fff;">0.000</span></div>
                <div style="display: flex; justify-content: space-between;"><span>PHANTOM (Future):</span> <span id="pan-phantom" style="color:#8b5cf6;">0.000</span></div>
                <div style="display: flex; justify-content: space-between;"><span>TRUTH (Ledger):</span> <span id="pan-truth" style="color:#10b981;">0.000</span></div>
                <div style="display: flex; justify-content: space-between;"><span>DRIFT (Error):</span> <span id="pan-drift" style="color:#ef4444;">0.000</span></div>
            </div>

            <div style="margin-top: 15px; height: 6px; border-radius: 3px; background: #27272a; position: relative; overflow: hidden;">
                <div id="bar-drift" style="position:absolute; top:0; left:0; height:100%; width:0%; background:#ef4444; transition: width 0.1s;"></div>
            </div>
            <div style="margin-top: 10px; font-size: 9px; color: #52525b; text-align: center;">
                Time-Travel: window.PANOPTICON.freezeAndReplay(60)
            </div>
        `;
        document.body.appendChild(this.hud);
    }

    toggle() {
        this.isActive = !this.isActive;
        this.hud.style.display = this.isActive ? 'block' : 'none';
        if (this.isActive) {
            console.log("%c👁️ [PANOPTICON] Göz Açıldı. Gerçeklik izleniyor.", "color: #06b6d4; font-weight: bold;");
            this._startObserver();
        } else {
            console.log("%c👁️ [PANOPTICON] Göz Kapandı.", "color: #71717a;");
        }
    }

    // ⏱️ 1. GC + EVENT LOOP LATENCY PROFILER
    _measureV8Vitality(now) {
        const delta = now - this.lastTick;
        this.lastTick = now;
        
        // 16.6ms referansından sapma (Jitter). V8 GC Pauses burada deşifre olur!
        const jitter = Math.max(0, delta - 16.66);
        const v8El = document.getElementById('pan-v8-health');
        
        if (jitter > 12) {
            v8El.innerHTML = `V8 LOOP: <span style="color:#ef4444; font-weight:bold;">${jitter.toFixed(1)}ms JITTER (GC PAUSE!)</span>`;
        } else {
            v8El.innerHTML = `V8 LOOP: <span style="color:#10b981;">STABLE (${jitter.toFixed(1)}ms)</span>`;
        }
    }

    // 🕰️ 2. PHANTOM VS TRUTH DIFF INSPECTOR
    _startObserver() {
        const observe = (time) => {
            if (!this.isActive || !this.scheduler.isRunning) return;
            this._measureV8Vitality(time);

            // Temporal Governor'dan (Safety Core) anlık Traceability verilerini çek
            const safety = this.scheduler.safety;
            const stateHash = safety.stateHashLog;
            
            if (stateHash.size > 0) {
                // Son frame'i Map'ten okuma
                const latestFrame = Array.from(stateHash.values()).pop();

                document.getElementById('pan-visual').innerText = latestFrame.visual.toFixed(4);
                document.getElementById('pan-phantom').innerText = latestFrame.phantom.toFixed(4);
                document.getElementById('pan-truth').innerText = latestFrame.truth.toFixed(4);
                
                const driftEl = document.getElementById('pan-drift');
                driftEl.innerText = latestFrame.drift.toFixed(2);
                
                // PEB Durumu
                const pebEl = document.getElementById('pan-peb-status');
                const budgetUsed = (latestFrame.drift / safety.errorBudget) * 100;
                
                if (budgetUsed > 80) {
                    pebEl.innerHTML = `PEB BUDGET: <span style="color:#ef4444; font-weight:bold;">CRITICAL (${budgetUsed.toFixed(0)}%)</span>`;
                } else {
                    pebEl.innerHTML = `PEB BUDGET: <span style="color:#10b981;">SAFE (${budgetUsed.toFixed(0)}%)</span>`;
                }

                document.getElementById('bar-drift').style.width = `${Math.min(100, budgetUsed)}%`;
            }
            requestAnimationFrame(observe);
        };
        requestAnimationFrame(observe);
    }

    // 🧬 3. EVENT LINEAGE GRAPH VIEWER
    traceEvent(eventId, source, payload) {
        this.lineageGraph.set(eventId, { bornAt: performance.now(), source, payload });
        if (this.lineageGraph.size > 200) this.lineageGraph.delete(this.lineageGraph.keys().next().value);
    }

    // ⏪ 4. FRAME REPLAY DEBUGGER (Time Travel Injection)
    freezeAndReplay(framesToRewind = 60) {
        if (!this.scheduler) return;
        
        console.warn(`%c🛑 [SDCR PANOPTICON] TIME-TRAVEL INITIATED. REWINDING ${framesToRewind} FRAMES...`, "color: #ef4444; font-weight: bold; background: #222; padding: 4px;");
        this.scheduler.isRunning = false; // The World (Zamanı dondur)

        const history = Array.from(this.scheduler.safety.stateHashLog.entries());
        let replayIndex = Math.max(0, history.length - framesToRewind);
        
        // Console'a Otopsi Tablosu Bas
        const replayTable = history.slice(replayIndex).map(([id, state]) => ({
            Frame: id, Visual: state.visual.toFixed(3), Phantom: state.phantom.toFixed(3), 
            Truth: state.truth.toFixed(3), Drift: state.drift.toFixed(2)
        }));
        console.table(replayTable);
        
        // Frame'leri Ekranda Ağır Çekimde (Slow-Mo) Tekrar Oynat
        const replayInterval = setInterval(() => {
            if (replayIndex >= history.length) {
                clearInterval(replayInterval);
                console.log("%c▶️ [SDCR PANOPTICON] Replay Complete. Type PANOPTICON.resume() to re-ignite runtime.", "color: #10b981; font-weight: bold;");
                return;
            }

            const [frameId, state] = history[replayIndex];
            
            // Geçmişin illüzyonunu fiziksel olarak CSS'e (GPU'ya) tekrar yansıt (Ghost Render)
            document.documentElement.style.setProperty('--l9-temporal-velocity', state.visual.toFixed(4));
            
            // HUD'ı manuel güncelle
            document.getElementById('pan-visual').innerText = state.visual.toFixed(4);
            document.getElementById('pan-drift').innerText = state.drift.toFixed(2);
            
            replayIndex++;
        }, 100); // Orijinal 16ms yerine 100ms ile ağır çekim otopsi
    }

    resume() {
        console.log("%c▶️ [SDCR PANOPTICON] Zaman çizgisi devam ediyor...", "color: #10b981; font-weight: bold;");
        this.scheduler.start(); // Motoru tekrar ateşle
        if (this.isActive) this._startObserver();
    }

    _attachDevToolsBridge() {
        window.PANOPTICON = this;
        console.log("%c👁️ [SDCR] Observability Kernel Online. Press CTRL+SHIFT+O for HUD.", "color: #8b5cf6; font-weight: bold;");
    }
}
