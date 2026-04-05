import { QuarantineBarrier, PRIORITY } from './sovereign-quarantine.js';

/**
 * =======================================================
 * SANTIS OS V42.1 - SOVEREIGN NEURAL BUS
 * "Single Source of Truth, Zero-Storm, Absolute Arbitration"
 * =======================================================
 */

class SovereignNeuralBusCore {
    constructor() {
        if (SovereignNeuralBusCore.instance) {
            return SovereignNeuralBusCore.instance;
        }

        this.url = 'ws://localhost:8080/ws';
        this.socket = null;
        this.subscribers = new Map();
        
        // Backoff State
        this.retryCount = 0;
        // Localhost geliştirme ortamında konsol kirliliğini engellemek için tekrar denemesini kısıtla
        this.maxRetries = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 1 : 10;
        this.isConnecting = false;
        
        // Heartbeat System
        this.pingInterval = null;

        SovereignNeuralBusCore.instance = this;
        console.log('👁️ [NEURAL BUS] Singleton Instance Generated.');
    }

    async connect() {
        if (!window.SovereignWS) {
            console.log(`%c🌌 [NEURAL BUS] Tüm evren sağır (Orchestrator yok). Dream Mode Başlatılıyor...`, 'color: #a855f7; font-weight: bold;');
            this.dispatchLocal('SYSTEM_SYNC', { status: 'SIMULATION' }, PRIORITY.CRITICAL);
            if (window.SantisCNS) window.SantisCNS.dispatch('NETWORK_SIMULATION_MODE', {});
            this._startSimulatedStream();
            return;
        }

        console.log(`%c🟢 [NEURAL BUS] Uplink Established via SovereignWS.`, 'color: #10b981; font-weight: bold;');
        this.dispatchLocal('SYSTEM_SYNC', { status: 'ONLINE' }, PRIORITY.CRITICAL);

        window.SovereignWS.subscribe('message', (parsedData) => {
            const data = parsedData;
            if (typeof data.payload === 'object') data.payload._source = 'network';
            this.dispatchLocal(data.type || data.channel, data.payload, PRIORITY.HIGH);
        });

        window.SovereignWS.subscribe('close', () => {
            console.log('%c📡 [NEURAL BUS] Uplink Lost via SovereignWS.', 'color: #f59e0b;');
            this.dispatchLocal('SYSTEM_SYNC', { status: 'OFFLINE' }, PRIORITY.CRITICAL);
            
            if (window.SovereignWS.offline) {
                console.log(`%c🌌 [NEURAL BUS] Maksimum arama sınırı aşıldı. Dream Mode Başlatılıyor...`, 'color: #a855f7; font-weight: bold;');
                this.dispatchLocal('SYSTEM_SYNC', { status: 'SIMULATION' }, PRIORITY.CRITICAL);
                if (window.SantisCNS) window.SantisCNS.dispatch('NETWORK_SIMULATION_MODE', {});
                this._startSimulatedStream();
            }
        });
    }
    
    _startSimulatedStream() {
        if (this._simulationTimer) return;
        let pinger = 12;
        this._simulationTimer = setInterval(() => {
            pinger = Math.max(8, Math.min(30, pinger + (Math.random() * 4 - 2)));
            // Ağ üzerinden geliyormuş gibi sahte (Simulated) olaylar dispatch et
            this.dispatchLocal('stream:update', {
                type: 'demo',
                payload: {
                    simulated: true,
                    agents: 3,
                    ping: Math.round(pinger),
                    _source: 'simulation'
                }
            }, PRIORITY.HIGH);
        }, 5000);
    }
    
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }
        this.subscribers.get(eventType).add(callback);

        return () => {
            const subs = this.subscribers.get(eventType);
            if (subs) subs.delete(callback);
        };
    }

    /**
     * @param {string} eventType 
     * @param {object} payload 
     * @param {number} priority 
     */
    dispatchLocal(eventType, payload, priority = PRIORITY.NORMAL) {
        const currentPressure = window.__SDCR_PRESSURE || 0; 
        if (!QuarantineBarrier.evaluate(eventType, payload, priority, currentPressure)) return;
        
        if (this.subscribers.has(eventType)) {
            this.subscribers.get(eventType).forEach(cb => cb(payload));
        }
        if (eventType !== '*' && this.subscribers.has('*')) {
            this.subscribers.get('*').forEach(cb => cb({ eventType, payload }));
        }
    }

    /**
     * Gövdeden (Lob'dan) Kule'ye giden Telemetri / Yayın Sinyali
     */
    emit(eventType, payload = {}, priority = PRIORITY.LOW) {
        // Arbitrator'dan anlık donanım basıncını oku (Global State veya Memory Reference)
        const currentPressure = window.__SDCR_PRESSURE || 0; 

        // 🛑 KAN-BEYİN BARİYERİ (BACKPRESSURE GATE)
        if (!QuarantineBarrier.evaluate(eventType, payload, priority, currentPressure)) {
            // Olay sessizce ezildi. Zero GC (Garbage Collection) maliyeti.
            return; 
        }

        // 1. Lokal Abonelere (Ledger, Arbitrator) dağıt
        this.dispatchLocal(eventType, payload, priority);

        // 2. Kuleye (WebSocket) Gönderim Filtresi
        // DİKKAT: LOW Priority verileri ASLA ağa çıkarma! 
        if (window.SovereignWS && window.SovereignWS.isConnected && priority <= PRIORITY.HIGH) {
            if (payload._source !== 'network') {
                window.SovereignWS.send({ channel: eventType, payload });
            }
        }
    }
}

export const NeuralBus = new SovereignNeuralBusCore();
