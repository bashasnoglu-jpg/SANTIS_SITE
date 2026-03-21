import gsap from 'gsap';
import { EventBus } from '../core/santis-bus';
import { Fabric } from '../engines/worker-fabric';
import { SpatialUIEngine } from '../ui/spatial-engine';

export class CheckoutRitual {
    private isMounted = false;
    private spatialEngine: SpatialUIEngine;

    constructor(spatialEngine: SpatialUIEngine) {
        this.spatialEngine = spatialEngine;
        // Router sayfa değiştirdiğinde (SPA geçişi) bu sınıfı uyandır
        EventBus.on('ROUTE_CHANGED', (payload) => {
            if (payload.current === '/rezervasyon') this.mount();
            else if (this.isMounted) this.unmount();
        });
    }

    private mount() {
        this.isMounted = true;
        console.log('🎫 [Santis OS] L5 Checkout Ritual Mühürlendi. Ödeme geçidi aktif.');

        const content = document.getElementById('santis-app-content');
        if (!content) return;

        // Hacimsel (Spatial) Kredi Kartı Formu
        content.innerHTML = `
            <div id="checkout-container" style="display: flex; flex-direction: column; align-items: center; gap: 40px; margin-top: 50px;">
                <h1 style="color: #10b981; font-size: 3rem; margin: 0; font-weight: 300;">L5 Rezervasyon</h1>
                
                <div data-spatial="true" style="width: 400px; height: 250px; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 30px; backdrop-filter: blur(20px); position: relative; display: flex; flex-direction: column; justify-content: flex-end; cursor: crosshair; box-shadow: 0 40px 80px rgba(0,0,0,0.5);">
                    <div class="spatial-glare" style="position: absolute; inset: 0; border-radius: 20px; pointer-events: none; opacity: 0;"></div>
                    <div style="transform: translateZ(40px);">
                        <div style="color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-bottom: 5px; letter-spacing: 2px;">KART NUMARASI</div>
                        <div style="color: white; font-size: 1.5rem; letter-spacing: 4px; font-family: monospace;">**** **** **** 1618</div>
                    </div>
                </div>

                <button id="pay-button" data-spatial="true" style="padding: 15px 40px; background: #10b981; color: black; font-weight: bold; font-size: 1.2rem; border: none; border-radius: 30px; cursor: pointer; transform: translateZ(20px);">Ritüeli Tamamla</button>
            </div>
        `;

        this.spatialEngine.mount(); // Yeni eklenen DOM elemanlarına Apple VisionOS fiziği aşıla
        document.getElementById('pay-button')?.addEventListener('click', () => this.processPayment());
    }

    private async processPayment() {
        const btn = document.getElementById('pay-button');
        if (btn) btn.innerText = "Yapay Zeka Doğruluyor...";

        // 1. AI Worker'a ağır ödeme işlemini kargola (Main Thread asla donmaz)
        const { isLivingTicketReady } = await Fabric.AI.verifyCheckoutRitual(6500);

        if (isLivingTicketReady) {
            // 2. GPU Render Worker'a Altın Dönüşümü Emri Ver (Cross-Worker Etkileşim)
            Fabric.Render.triggerCheckoutSuccess();

            // 3. DOM'u GSAP ile 'Yaşayan Bilet'e (Living Ticket) Çevir
            const container = document.getElementById('checkout-container');
            if (container) {
                gsap.to(container, { opacity: 0, y: -50, duration: 0.5, onComplete: () => {
                    container.innerHTML = `
                        <div data-spatial="true" style="width: 350px; padding: 40px; background: rgba(255, 215, 0, 0.1); border: 1px solid #ffd700; border-radius: 20px; backdrop-filter: blur(30px); text-align: center; box-shadow: 0 0 50px rgba(255, 215, 0, 0.2);">
                            <div class="spatial-glare" style="position: absolute; inset: 0; border-radius: 20px; pointer-events: none; opacity: 0;"></div>
                            <h2 style="color: #ffd700; font-size: 2rem; transform: translateZ(50px); margin: 0 0 10px 0;">LIVING TICKET</h2>
                            <p style="color: white; transform: translateZ(30px); opacity: 0.8;">L5 Mührü Onaylandı. Ritüel Başladı.</p>
                        </div>
                    `;
                    this.spatialEngine.mount();
                    gsap.fromTo(container, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1, ease: "elastic.out(1, 0.5)", clearProps: "all" });
                }});
            }
        }
    }

    private unmount() {
        this.isMounted = false;
        const content = document.getElementById('santis-app-content');
        if (content) content.innerHTML = ''; // Temizlik
    }
}
