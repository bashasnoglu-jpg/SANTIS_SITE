import { EventBus } from './santis-bus';
import { PageRouter } from './page-router';
import { Fabric } from '../engines/worker-fabric';
import { AuthEngine } from '../services/auth-service';
import { Store } from './store';
import { NeuralEngine } from '../engines/neural-interaction/neural-engine';

export class Kernel {
    private router: PageRouter;

    constructor() {
        this.router = new PageRouter();
    }

    public async boot(): Promise<void> {
        console.log('🧠 [Kernel v4] Boot Sequence Initiated (TypeScript)');
        const startTime = performance.now();
        await this.router.mount();
        const bootTime = performance.now() - startTime;
        
        EventBus.emit('KERNEL_READY', { bootTime, version: '4.0.0-TS' });
        console.log(`🧠 [Kernel v4] ✅ KERNEL READY — ${Math.round(bootTime)}ms`);

        // Service Worker Synchronization
        this.initServiceWorker();
    }

    private initServiceWorker(): void {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'NETWORK_STATUS') {
                    const { isOnline, latency } = event.data.payload;
                    // SW'den gelen veriyi tip güvenli EventBus'a aktarıyoruz
                    EventBus.emit('NETWORK_STATUS', event.data.payload);
                    
                    // Reactive Store'u güncelle
                    Store.update({
                        network: {
                            isOnline: isOnline,
                            latency: latency
                        }
                    });

                    if (!isOnline) {
                        console.warn("🔌 [Kernel] Bağlantı koptu. Uyku moduna geçiliyor...");
                    }
                }
            });
        }
    }

    public async initWorkerFabric(): Promise<void> {
        console.log('🧠 [Worker Fabric] ✓ Threading Subsystem Prepared!');
        
        // Worker'ı ayağa kaldır
        Fabric.initialize();
        
        // Sistemin çalıştığını kanıtlamak için asenkron test çağrısı (Ana UI akmaya devam eder)
        try {
            console.log('🧮 [Score Engine Proxy] UI serbest, arka plan analizi tetiklendi...');
            const dummyData = new Float32Array([1.5, 2.5, 3.5]);
            
            // IDE burada .processNeuroDetail'i otomatik tamamlayacak ve dönüş tipini bilecek!
            const result = await Fabric.AI.processNeuroDetail(dummyData);
            console.log(`🧬 [Kernel v4] İşçi Yanıtı: ${result.status} | Skor: ${result.score}`);

            // L5 BIO CHECKOUT DEMO
            // AuthEngine.promptL5Checkout(); // Kullanıcı tetiklemelidir, boot sırasında otomatik çalışmaz!
            (window as any).AuthEngine = AuthEngine; // Konsoldan test edebilmek için Global Scope'a aktar
            // Neural Interaction Engine Başlatılıyor
            const neuralEngine = new NeuralEngine();
            neuralEngine.init();

            Store.update({ kernelStatus: 'ready' });
        } catch (err) {
            console.error('🚨 [Kernel v4] Worker test hatası:', err);
            Store.update({ kernelStatus: 'error' });
        }
    }
}
