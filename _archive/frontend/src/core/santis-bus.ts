export interface SantisEventMap {
    'KERNEL_READY': { bootTime: number; version: string };
    'WORKER_ONLINE': { threadId: string; status: 'idle' | 'active' };
    'TRANSITION_ERROR': { route: string; error: string };
    
    // --- YENİ ROUTING SÖZLEŞMELERİ ---
    'ROUTE_START': { path: string };
    'ROUTE_CHANGED': { previous: string; current: string; title: string }; 
    
    // --- PWA SÖZLEŞMELERİ ---
    'NETWORK_STATUS': { isOnline: boolean; latency: number };

    // --- SECURITY & DATA SÖZLEŞMELERİ ---
    'AUTH_SUCCESS': { token: string };
    'API_DATA_RECEIVED': { endpoint: string; rawData: any };

    // --- STATE MANAGEMENT ---
    'STATE_MUTATED': any; // In real app, import AppState from store.ts to avoid circular dep issues.
}

class SantisEventBus {
    private listeners: { [K in keyof SantisEventMap]?: Array<(payload: SantisEventMap[K]) => void> } = {};

    public on<K extends keyof SantisEventMap>(event: K, callback: (payload: SantisEventMap[K]) => void): void {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event]!.push(callback);
    }

    public emit<K extends keyof SantisEventMap>(event: K, payload: SantisEventMap[K]): void {
        this.listeners[event]?.forEach(cb => cb(payload));
    }
}
export const EventBus = new SantisEventBus();
