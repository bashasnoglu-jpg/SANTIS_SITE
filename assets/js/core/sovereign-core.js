/**
 * =======================================================
 * L9 SOVEREIGN CONTINUITY KERNEL v3 (Production Engine)
 * "State is never transferred. It is deterministically replayed."
 * =======================================================
 */

export class SovereignLedger {
    static KEY = '@l9-ledger-v3';
    static CHANNEL = new BroadcastChannel('l9-quorum-channel');

    static init(onPeerPressure) {
        this.CHANNEL.onmessage = (e) => {
            if (e.data.type === 'PRESSURE_ALERT') onPeerPressure(e.data.level);
        };
    }

    static write(type, payload = {}) {
        const log = this.read();
        const event = { t: performance.now(), type, ...payload };
        
        log.push(event);
        const pruned = log.slice(-50); // Drop Policy: Max 50 deterministik olay (Memory Leak Kalkanı)
        
        try { sessionStorage.setItem(this.KEY, JSON.stringify(pruned)); } 
        catch(e) { console.warn("[L9] Storage disabled. Ephemeral mode active."); }

        // Kuantum Koro Haberleşmesi (Sadece yangın anı SOS)
        if (type === 'PRESSURE_SPIKE') {
            this.CHANNEL.postMessage({ type: 'PRESSURE_ALERT', level: payload.level });
        }
    }

    static read() {
        try { return JSON.parse(sessionStorage.getItem(this.KEY) || "[]"); } 
        catch { return []; }
    }
    
    static clear() { 
        try { sessionStorage.removeItem(this.KEY); } catch(e) {}
    }
}

export class RenderBudgetController {
    constructor() {
        this.localPressure = 0; 
        this.peerPressure = 0;
        this.lastTime = performance.now();
        this.fps = 60;
    }
    
    setPeerPressure(level) { this.peerPressure = level; }

    update(now) {
        const dt = now - this.lastTime; this.lastTime = now;
        if (dt > 0) this.fps = (this.fps * 0.9) + ((1000 / dt) * 0.1); 
        
        // 20fps altı kırmızı alarm (Critical Level 2)
        if (this.fps < 20) this.localPressure = 2;
        else if (this.fps < 45) this.localPressure = 1;
        else this.localPressure = 0;
        
        // Final Pressure: Lokal sekmenin ve yan sekmelerin oluşturduğu genel ağırlık.
        return Math.max(this.localPressure, this.peerPressure);
    }

    shouldThrottle() { return Math.max(this.localPressure, this.peerPressure) >= 2; }
}

export class ArbitrationQuantizer {
    constructor(baseCooldown = 150) {
        this.baseCooldown = baseCooldown; 
        this.velocity = 0; 
        this.lastTrigger = 0;
        this.currentCooldown = baseCooldown;
    }
    
    updateVelocity(newV) {
        // Lineer Amortisör
        this.velocity = (this.velocity * 0.85) + (newV * 0.15); 
        return this.velocity;
    }
    
    shouldTrigger(now, pressure) {
        // Backpressure kapı geciktirmesi
        const multiplier = pressure >= 2 ? 3 : (pressure === 1 ? 1.5 : 1);
        this.currentCooldown = this.baseCooldown * multiplier;

        if (now - this.lastTrigger >= this.currentCooldown) {
            this.lastTrigger = now; return true;
        }
        return false;
    }
}

export class ContinuityReplayEngine {
    static execute(arbitrator) {
        const log = SovereignLedger.read();
        if (log.length === 0) return null;

        let pendingIntent = null;
        let lastV = 0;

        console.log(`[L9 Kernel] Replaying ${log.length} quantum events...`);

        // Geçmişin matematiksel olarak tekrar yaşatılması
        log.forEach(event => {
            if (event.type === 'SCROLL_VECTOR') {
                lastV = arbitrator.quantizer.updateVelocity(event.v);
            } else if (event.type === 'PRESSURE_SPIKE') {
                arbitrator.budget.localPressure = Math.max(arbitrator.budget.localPressure, event.level);
            } else if (event.type === 'NAV_INTENT') {
                pendingIntent = event;
            }
        });

        // Frame Drift önleyici: Üretilen enerjinin CSS'e anlık teması
        if (Math.abs(lastV) > 0.05) {
            document.documentElement.style.setProperty('--l9-velocity', lastV.toFixed(3));
        }

        return pendingIntent;
    }
}

export class SovereignArbitrator {
    constructor(mutatorCallback) {
        this.budget = new RenderBudgetController();
        this.quantizer = new ArbitrationQuantizer();
        this.commitState = mutatorCallback || function(){};
        
        SovereignLedger.init((level) => this.budget.setPeerPressure(level));
        this.lastY = window.scrollY;
        
        this._bindInput();
        this._loop();
    }

    _bindInput() {
        window.addEventListener('scroll', () => {
            const dt = Math.max(performance.now() - this.budget.lastTime, 1);
            const rawV = (window.scrollY - this.lastY) / dt;
            this.lastY = window.scrollY;
            
            const smoothedV = this.quantizer.updateVelocity(rawV);
            // JS'de thrashing yok, Native GPU Inject
            try { document.documentElement.attributeStyleMap.set('--l9-velocity', CSS.number(smoothedV)); } 
            catch(err) { document.documentElement.style.setProperty('--l9-velocity', smoothedV.toFixed(3)); }
        }, { passive: true });
    }

    _loop = (now) => {
        this.budget.update(now || performance.now());
        requestAnimationFrame(this._loop);
    }
    
    // (Opsiyonel) Lokal sayfa içi animasyon kararları için Kernel çağrısı
    dispatchLocalTransition(overrideForce = false) {
        if (this.budget.shouldThrottle() && !overrideForce) {
            this.commitState();
            return;
        }
        
        if (document.startViewTransition) {
            document.startViewTransition(() => this.commitState());
        } else {
            this.commitState();
        }
    }
}
