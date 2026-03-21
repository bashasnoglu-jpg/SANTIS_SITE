import { Store } from '../core/store';

export class APIClient {
    public static async fetchMegaMenu(): Promise<void> {
        console.log('🦅 [API Client] FastAPI ile veri bağı kuruluyor...');
        
        // Gelecekte FastAPI'den gelecek gerçek verinin simülasyonu (600ms ağ gecikmesi)
        await new Promise(res => setTimeout(res, 600)); 
        
        // Reaktif Store'u kısmi güncelle (DOM bu atamayla otomatik tetiklenecek!)
        Store.update({
            ui: {
                ...Store.state.ui,
                megaMenu: [
                    { id: 'l5', title: 'Checkout Ritual', intensity: 'NEURAL', url: '/rezervasyon' },
                    { id: 'l3', title: 'Neuro-Detail Studio', intensity: 'HIGH', url: '/neuro' },
                    { id: 's1', title: 'Santis Signature', intensity: 'MEDIUM', url: '/signature' }
                ]
            }
        });
        console.log('💧 [API Client] Menü verisi reaktif hafızaya mühürlendi.');
    }
}
