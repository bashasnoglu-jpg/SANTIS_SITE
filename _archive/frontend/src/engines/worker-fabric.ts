import * as Comlink from 'comlink';
import { EventBus } from '../core/santis-bus';

import type { AIWorkerContract } from '../workers/ai-worker';
import type { RenderServicesContract } from '../workers/render-worker';
import type { NetworkServicesContract } from '../workers/network-worker';

export class WorkerFabricManager {
    private aiWorkerProxy: Comlink.Remote<AIWorkerContract> | null = null;
    private renderWorkerProxy: Comlink.Remote<RenderServicesContract> | null = null;
    private networkWorkerProxy: Comlink.Remote<NetworkServicesContract> | null = null;

    public initialize(): void {
        try {
            const aiWorker = new Worker(new URL('../workers/ai-worker.ts', import.meta.url), { type: 'module' });
            this.aiWorkerProxy = Comlink.wrap<AIWorkerContract>(aiWorker);
            
            // YENİ: Render Worker'ı ayağa kaldır
            const renderWorker = new Worker(new URL('../workers/render-worker.ts', import.meta.url), { type: 'module' });
            this.renderWorkerProxy = Comlink.wrap<RenderServicesContract>(renderWorker);

            // YENİ: Network Worker'ı ayağa kaldır
            const networkWorker = new Worker(new URL('../workers/network-worker.ts', import.meta.url), { type: 'module' });
            this.networkWorkerProxy = Comlink.wrap<NetworkServicesContract>(networkWorker);

            console.log('🧠⚡ [Worker Fabric] AI, Render ve Network İplikleri (Comlink RPC) Online.');
            EventBus.emit('WORKER_ONLINE', { threadId: 'ai-worker-01', status: 'active' });
            EventBus.emit('WORKER_ONLINE', { threadId: 'render-worker-01', status: 'active' });
            EventBus.emit('WORKER_ONLINE', { threadId: 'network-worker-01', status: 'active' });
        } catch (error) {
            console.error('🚨 [Worker Fabric] Worker başlatılamadı:', error);
        }
    }

    public get AI() { if(!this.aiWorkerProxy) throw new Error("AI Offline"); return this.aiWorkerProxy; }
    public get Render() { if(!this.renderWorkerProxy) throw new Error("Render Offline"); return this.renderWorkerProxy; } // YENİ
    public get Network() { if(!this.networkWorkerProxy) throw new Error("Network Offline"); return this.networkWorkerProxy; }
}
export const Fabric = new WorkerFabricManager();
