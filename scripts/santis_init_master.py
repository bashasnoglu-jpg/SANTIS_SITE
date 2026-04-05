import os

ROOT_DIR = r"C:\Users\tourg\Desktop\SANTIS_SITE\santis-os-monorepo\apps\guest-web\src"

directories = [
    "core",
    "services",
    "network",
    "components",
    "styles",
    "admin"
]

for d in directories:
    os.makedirs(os.path.join(ROOT_DIR, d), exist_ok=True)

files = {}

files["core/SantisEngine.ts"] = """import { EventEmitter } from 'events';

export type CacheKey = string;
export type CacheValue = any;

export class CacheIntelligence {
    private accessLog: Map<CacheKey, number[]> = new Map();
    private readonly HOT_THRESHOLD = 50;

    recordAccess(key: CacheKey) {
        const now = Date.now();
        const hits = this.accessLog.get(key) || [];
        hits.push(now);
        this.accessLog.set(key, hits.filter(t => now - t < 60000));
    }

    async getHotSubset(keys: CacheKey[], limit: number): Promise<CacheKey[]> {
        return keys
            .map(key => ({ key, count: (this.accessLog.get(key) || []).length }))
            .filter(item => item.count >= this.HOT_THRESHOLD)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit)
            .map(i => i.key);
    }
}

export class CacheGraph {
    private deps: Map<CacheKey, Set<CacheKey>> = new Map();

    link(parent: CacheKey, child: CacheKey) {
        if (!this.deps.has(parent)) this.deps.set(parent, new Set());
        this.deps.get(parent)!.add(child);
    }

    getRelatedKeys(key: CacheKey): CacheKey[] {
        return Array.from(this.deps.get(key) || []);
    }
}

export class CacheRegenerator {
    private activeRebuilds: Map<CacheKey, Promise<any>> = new Map();

    constructor(private intelligence: CacheIntelligence) {}

    async ensureSingleFlight(key: CacheKey, rebuildTask: () => Promise<any>): Promise<any> {
        if (this.activeRebuilds.has(key)) {
            console.log(`[Regenerator] Single-Flight: Reuse active rebuild for ${key}`);
            return this.activeRebuilds.get(key);
        }

        const task = rebuildTask().finally(() => this.activeRebuilds.delete(key));
        this.activeRebuilds.set(key, task);
        return task;
    }

    async prewarmHotSubset(keys: CacheKey[], batchSize: number, worker: (key: CacheKey) => Promise<void>) {
        const hotKeys = await this.intelligence.getHotSubset(keys, batchSize);
        console.log(`[Regenerator] Prewarming ${hotKeys.length} hot keys...`);
        for (const key of hotKeys) {
            this.ensureSingleFlight(key, () => worker(key)).catch(err => 
                console.error(`[Regenerator] Prewarm error for ${key}:`, err)
            );
        }
    }
}

export class SantisCoreEngine extends EventEmitter {
    private store: Map<CacheKey, CacheValue> = new Map();
    public intelligence = new CacheIntelligence();
    public graph = new CacheGraph();
    public regenerator = new CacheRegenerator(this.intelligence);

    async get(key: CacheKey, fallback?: () => Promise<CacheValue>): Promise<CacheValue> {
        this.intelligence.recordAccess(key);
        if (this.store.has(key)) return this.store.get(key);
        if (fallback) {
            return this.regenerator.ensureSingleFlight(key, async () => {
                const value = await fallback();
                this.store.set(key, value);
                return value;
            });
        }
        return null;
    }

    async invalidate(rootKey: CacheKey, rebuildLogic: (key: CacheKey) => Promise<any>) {
        const relatedKeys = this.graph.getRelatedKeys(rootKey);
        const allAffected = [rootKey, ...relatedKeys];

        allAffected.forEach(k => this.store.delete(k));

        await this.regenerator.prewarmHotSubset(allAffected, 10, async (key) => {
            const freshData = await rebuildLogic(key);
            this.store.set(key, freshData);
            this.emit('cache:rehydrated', { key, timestamp: Date.now() });
        });
    }

    trackDependency(parent: CacheKey, child: CacheKey) {
        this.graph.link(parent, child);
    }
}
"""

files["services/EconomyUnit.ts"] = """import { SantisCoreEngine } from '../core/SantisEngine';

export class SantisEconomyUnit {
    constructor(private core: SantisCoreEngine) {
        this.core.trackDependency('inventory:hamam', 'pricing:hamam');
    }

    async calculateDynamicPrice(serviceId: string, sessionId: string) {
        return this.core.get(`pricing:${serviceId}:${sessionId}`, async () => {
             console.log(`[Economy] Computing surge price for: ${serviceId}`);
             const inventory = await this.fetchInventory(serviceId);
             
             // Base logic for Exclusivity Premium
             const exclusivityPremium = inventory.slots <= 2 ? 0.25 : 0;
             const finalPrice = 1200 * (1 + exclusivityPremium);
             const uiState = inventory.slots <= 2 ? 'EXCLUSIVE_ACCESS' : 'STANDARD_QUIET';

             return { finalPrice, uiState, remaining: inventory.slots, holdTTL: 300 };
        });
    }

    private async fetchInventory(id: string) {
        return { slots: 2 }; 
    }
}
"""

files["network/SantisSocket.ts"] = """import { EventEmitter } from 'events';

export class SantisSocket extends EventEmitter {
    constructor() {
        super();
    }
    
    send(event: string, payload?: any) {
        console.log(`[WebSocket TX] ${event}`, payload || '');
    }
}
"""

files["components/ReservationModal.ts"] = """import { SantisSocket } from '../network/SantisSocket';

export class SantisReservationModal {
    private holdTimer: number | NodeJS.Timeout | null = null;
    private currentStatus = 'CALM';
    private ws = new SantisSocket();

    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        this.ws.on('RESERVE_HOLD_SYNC', (data) => this.handleHoldSync(data));
        this.ws.on('INTELLIGENCE_SIGNAL', (signal) => this.handleSystemUrgency(signal));
    }

    handleHoldSync({ ttl, status, price }: any) {
        this.updateUI(status, price);
        this.startHoldCountdown(ttl);
    }

    startHoldCountdown(seconds: number) {
        if (this.holdTimer) clearTimeout(this.holdTimer);
        this.holdTimer = setTimeout(() => {
            this.ws.send('REQUEST_RENEWAL_SILENT');
        }, seconds * 1000 - 60000);
    }

    handleSystemUrgency(signal: any) {
        if (signal.type === 'QUEUE_DETECTED' && this.holdTimer) {
            this.showSoftNotification(
                "Size ayrılan bu seçkin zaman dilimini korumaya devam etmek ister misiniz?",
                "Evet, Devam Et"
            );
        }
    }

    showSoftNotification(msg: string, btnText: string) {
        console.log(`[Concierge Notification] ${msg}`);
    }

    updateUI(status: string, price: number) {
        const modalElement = document.querySelector('#reservation-modal');
        const bookingCard = document.querySelector('.reservation-summary-card');

        if (!modalElement || !bookingCard) return;

        if (status === 'EXCLUSIVE_ACCESS') {
            modalElement.classList.add('state-exclusive');
            bookingCard.classList.add('focus-target');
            console.log("[Concierge] Focus mode engaged: Museum Lighting applied.");
        } else {
            modalElement.classList.remove('state-exclusive');
            bookingCard.classList.remove('focus-target');
        }
    }
}
"""

files["styles/bento-ui.css"] = """/* SANTIS QUIET LUXURY UI */
:root {
    --color-smoky-warm-gray: #f5f1e8;
    --color-brushed-bronze: #b89e7c;
}

.santis-viewport {
    transition: filter 1.2s ease, opacity 1.2s ease;
    will-change: filter, opacity;
}

.state-exclusive .santis-viewport:not(.focus-target) {
    filter: blur(2px) grayscale(0.2);
    opacity: 0.75;
    pointer-events: none;
}

.focus-target {
    z-index: 100;
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.8s ease;
    box-shadow: 0 0 80px -20px rgba(184, 158, 124, 0.15);
}

.state-exclusive .focus-target {
    border: 1px solid var(--color-brushed-bronze);
    background-color: rgba(255, 255, 255, 0.02);
}

.hold-indicator {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-family: 'Inter', sans-serif;
    color: var(--color-smoky-warm-gray);
}

.ring-outer {
    width: 14px;
    height: 14px;
    border: 1px solid rgba(184, 158, 124, 0.3);
    border-radius: 50%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ring-inner {
    width: 6px;
    height: 6px;
    background-color: var(--color-brushed-bronze);
    border-radius: 50%;
    animation: santisPulse 4s ease-in-out infinite;
}

@keyframes santisPulse {
    0%, 100% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(1.5); opacity: 0.8; }
}
"""

files["admin/CommandRadar.ts"] = """export class SantisCommandRadar {
    constructor(private engine: any) {
        this.initRadar();
    }

    initRadar() {
        this.engine.on('cache:rehydrated', (data: any) => {
            this.pulseRoom(data.key, 'prewarm');
            this.updateTicker(`Prewarm tamamlandı: ${data.key}`);
        });

        this.engine.on('intelligence:hot_zone', (zone: any) => {
            this.updateHeatmap(zone.id, zone.intensity);
        });
    }

    updateHeatmap(roomId: string, intensity: number) {
        const roomElement = document.querySelector(`#room-${roomId}`) as HTMLElement;
        if (roomElement) {
            roomElement.style.setProperty('--glow-opacity', (intensity * 0.4).toString());
        }
    }

    pulseRoom(roomId: string, type: string) {
        console.log(`[Dark Observatory] Pulsing room ${roomId} - ${type}`);
    }

    updateTicker(msg: string) {
        console.log(`[Dark Observatory Ticker] ${msg}`);
    }

    executeSovereignLock(roomId: string) {
        console.log(`[09:15] Director Intervention: Room ${roomId} manuel olarak mühürlendi. Sovereign Lock devrede.`);
    }
}
"""

for path, content in files.items():
    full_path = os.path.join(ROOT_DIR, path)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {full_path}")

print("Santis OS Bootstrapping Completed Successfully.")
