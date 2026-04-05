import { EventEmitter } from 'events';

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
