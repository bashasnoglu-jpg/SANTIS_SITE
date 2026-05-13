export class HQStore {
    constructor() {
        this.state = {
            network: { total_tenants: 0, total_hotels: 0 },
            performance: { today_revenue: 0, today_bookings: 0 },
            yieldStatus: { multiplier: 1.0, action: 'OBSERVING' },
            aiInsight: { text: 'Awaiting data...', latency: 0, staffing: 'Pending' },
            feed: [],
            forecast: { historical: { labels:[], data:[] }, ai: { labels:[], data:[] } },
            heatmap: { insight: '', data: [] }
        };
        this.listeners = [];
    }

    setState(patch) {
        this.state = {
            ...this.state,
            ...patch
        };
        this.emit();
    }

    subscribe(fn) {
        this.listeners.push(fn);
        // Fire immediately upon subscription so UI gets latest state
        fn(this.state);
    }

    emit() {
        this.listeners.forEach(fn => fn(this.state));
    }
}

export const hqStore = new HQStore();
