export class ScoreEngineProxy {
    private worker: Worker;

    constructor() {
        console.log('⚙️ [Score Engine Proxy] Connecting to AI Worker...');
        // Vite web worker isolated bundle integration
        this.worker = new Worker(new URL('../workers/ai-worker.ts', import.meta.url), {
            type: 'module'
        });
        
        this.worker.onmessage = (e: MessageEvent) => {
            console.log('🧠 [Worker Fabric] Message received from background thread:', e.data);
        };
    }

    calculate(data: any) {
        this.worker.postMessage({ command: 'CALCULATE', payload: data });
    }
}
