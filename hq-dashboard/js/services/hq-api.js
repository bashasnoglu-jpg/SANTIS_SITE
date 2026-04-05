import { getMockHQData } from './hq-mock-service.js';

export async function fetchHQSnapshot() {
    // SINGLE SWITCH FOR MOCK VS PROD
    if (window.__HQ_USE_MOCK__) {
        console.log('[SANTIS API] 🛡️ Mock Data Source Engaged.');
        return getMockHQData();
    }
    
    try {
        const API_BASE = window.__HQ_API_BASE__ || localStorage.getItem('SANTIS_HQ_API_BASE') || '';
        // If API fails or is not actually built out yet, we will fallback to Mock for seamless demo
        const res = await fetch(`${API_BASE}/api/hq/snapshot`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // timeout logic could be here
        });
        
        if (!res.ok) throw new Error(`Snapshot failed: ${res.status}`);
        return await res.json();
        
    } catch (e) {
        console.warn('[SANTIS API] ⚠️ Core Service Offline. Reverting to Autonomous MOCK Payload.', e);
        return getMockHQData();
    }
}
