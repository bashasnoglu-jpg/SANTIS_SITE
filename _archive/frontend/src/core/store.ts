import { EventBus } from './santis-bus';

// 1. Tip Güvenli State Şeması
export interface MenuItem {
    id: string; 
    title: string; 
    intensity: string; 
    url: string;
}

export interface AppState {
    kernelStatus: 'booting' | 'ready' | 'error';
    network: {
        isOnline: boolean;
        latency: number;
    };
    user: {
        isAuthenticated: boolean;
        token: string | null;
        l5Clearance: boolean;
    };
    ui: {
        activeRoute: string;
        theme: 'cinematic' | 'sleep';
        isMenuOpen: boolean;
        megaMenu: MenuItem[];
    };
    system: {
        activeWorkers: number;
        memUsage: number;
    }
}

// 2. Başlangıç (Initial) State
const initialState: AppState = {
    kernelStatus: 'booting',
    network: { isOnline: true, latency: 0 },
    user: { isAuthenticated: false, token: null, l5Clearance: false },
    ui: { activeRoute: '/', theme: 'cinematic', isMenuOpen: false, megaMenu: [] },
    system: { activeWorkers: 0, memUsage: 0 }
};

// 3. Tip Güvenli Gözlemci (Observer) Tipleri
type Listener = (state: AppState) => void;

class ReactiveStore {
    private _state: AppState;
    private listeners: Set<Listener> = new Set();

    constructor(initial: AppState) {
        // ES6 Proxy kullanarak her State değişimini yakalar (Intercept) ve bileşenleri uyarırız.
        this._state = this.createProxy(initial);
    }

    private createProxy<T extends object>(obj: T): T {
        const self = this;
        return new Proxy(obj, {
            get(target, prop) {
                const val = (target as any)[prop];
                // İç içe (nested) objeler için recursive proxy
                if (val !== null && typeof val === 'object') {
                    return self.createProxy(val);
                }
                return val;
            },
            set(target, prop, value) {
                const oldVal = (target as any)[prop];
                if (oldVal !== value) {
                    (target as any)[prop] = value;
                    self.notifyListeners();
                }
                return true;
            }
        });
    }

    public get state(): AppState {
        return this._state;
    }

    // Doğrudan yığın güncelleme (Batch Update) için
    public update(partial: Partial<AppState>) {
        Object.assign(this._state, partial);
    }

    // Durum Değişiklik Aboneliği (Subscription)
    public subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        listener(this._state); // İlk abonelikte güncel durumu fırlat
        // Unsubscribe fonksiyonu döndür (React/Vue cleanup mantığı)
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        // EventBus'a da jenerik bir STATE_MUTATED hook'u bırakırız (Global log veya debug için)
        EventBus.emit('STATE_MUTATED', this._state);
        this.listeners.forEach(listener => listener(this._state));
    }
}

// Global Singleton Instance
export const Store = new ReactiveStore(initialState);
