import { fetchHQSnapshot } from './services/hq-api.js';
import { hqStore } from './core/hq-store.js';
import { SovereignNeuralBridge } from './transport/hq-neural-bridge.js';
import { HQMapEngine } from './engines/hq-map-engine.js';
import { HQChartEngine } from './engines/hq-chart-engine.js';
import { initDomController } from './ui/hq-dom-controller.js';

// Setup Mock Environment globally by default for the demo unless API is available
window.__HQ_USE_MOCK__ = true; 

async function bootHQ() {
    console.log('[SANTIS OS] 🦅 V10 Karargâh Ön-Yükleme Başlıyor...');

    // 1. Initialize static DOM bindings (so click events work immediately)
    initDomController();

    // 2. Fetch Initial Data Snapshot (Store gets hydrated)
    const snapshot = await fetchHQSnapshot();
    hqStore.setState(snapshot);

    // 3. Initialize rendering engines (They subscribe themselves to hqStore)
    window.__HQ_MAP_ENGINE__ = new HQMapEngine();
    window.__HQ_CHART_ENGINE__ = new HQChartEngine();

    // 4. Ignite Neural Bridge (Websocket Stream)
    const API_BASE = window.__HQ_API_BASE__ || "http://localhost:8080";
    const WS_BASE  = API_BASE.replace(/^http/, 'ws') + '/ws';
    
    const bridge = new SovereignNeuralBridge(WS_BASE);
    await bridge.igniteEngine();

    console.log('[SANTIS OS] 🟢 V10 Karargâh Çevrimiçi.');
}

window.addEventListener('DOMContentLoaded', bootHQ);
