import gsap from 'gsap';
import { EventBus } from '../core/santis-bus';
import { Store, type MenuItem } from '../core/store';
import { SpatialUIEngine } from './spatial-engine';
import { Fabric } from '../engines/worker-fabric';

export class LiquidMenu {
    private container: HTMLElement;
    private spatialEngine: SpatialUIEngine;

    constructor(spatialEngine: SpatialUIEngine) {
        this.spatialEngine = spatialEngine;
        // Menüyü DOM'a dinamik olarak enjekte et
        this.container = document.createElement('div');
        this.container.id = 'santis-liquid-menu';
        this.container.style.cssText = `
            position: fixed; inset: 0; z-index: 9990;
            background: rgba(5, 5, 8, 0.85); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
            clip-path: circle(0% at 50% -10%); pointer-events: none;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 25px;
        `;
        document.body.appendChild(this.container);
        this.bindReactivity();
    }

    private bindReactivity() {
        // 1. DataBridge Veriyi Çektiğinde Menü Elemanlarını Çiz (Reaktif Tüketici)
        // Store.subscribe sayesinde State'teki her değişiklikte burası uyarılır.
        Store.subscribe((state) => {
            // Sadece megaMenu dizisi değiştiyse veya menü aç/kapa değiştiyse tepki ver
            this.renderItems(state.ui.megaMenu);
            
            if (state.ui.isMenuOpen) {
                this.reveal();
            } else {
                this.hide();
            }
        });

        // 2. SPA Router sayfa değiştirdiğinde menüyü otomatik kapat
        EventBus.on('ROUTE_START', () => { 
            Store.update({ ui: { ...Store.state.ui, isMenuOpen: false } }); 
        });
    }

    private renderItems(items: MenuItem[]) {
        if (!items || items.length === 0) return; // Veri yoksa render etme
        
        let htmlContent = `<h2 style="color: white; font-size: 2.5rem; font-weight: 300; margin-bottom: 20px;">Santis Ekosistemi</h2>`;
        
        items.forEach(item => {
            htmlContent += `
                <a href="${item.url}" class="liquid-item" data-spatial="true" style="text-decoration: none; color: white; padding: 25px 50px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 30px; position: relative; cursor: pointer; display: block; overflow: visible;">
                    <div class="spatial-glare" style="position: absolute; inset: 0; border-radius: 30px; pointer-events: none; opacity: 0; transition: opacity 0.3s;"></div>
                    <span style="color: #10b981; font-size: 0.8rem; letter-spacing: 2px; display: block; transform: translateZ(20px);">${item.intensity} INTENSITY</span>
                    <h3 style="margin: 10px 0 0 0; font-size: 1.8rem; transform: translateZ(50px);">${item.title}</h3>
                </a>
            `;
        });
        
        // İçeriği güncelle
        this.container.innerHTML = htmlContent;
        
        // SPATIAL SİHRİ: Yeni eklenen HTML elemanlarına (data-spatial="true") anında Apple VisionOS fiziğini aşıla!
        this.spatialEngine.mount();
    }

    private reveal() {
        // Eğer menü zaten açıksa animasyonu tekrar oynatma
        if (this.container.style.pointerEvents === 'auto') return;
        
        Fabric.Render.onRouteChange('MENU_OPEN'); // Arka plandaki 3D Kameraya "Geri Çekil" emri fırlat (Kusursuz entegrasyon)
        gsap.to(this.container, { clipPath: "circle(150% at 50% -10%)", duration: 1.2, ease: "expo.inOut", pointerEvents: "auto" });
        
        // DOM'a yeni eklenen elemanların render edilmesi için 1 frame bekle
        requestAnimationFrame(() => {
            const items = this.container.querySelectorAll('.liquid-item');
            if (items.length > 0) {
                gsap.fromTo(items, 
                    { y: 60, opacity: 0, rotationX: -20 }, 
                    { y: 0, opacity: 1, rotationX: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.5)", delay: 0.2, clearProps: "all" }
                );
            }
        });
    }

    private hide() {
        // Eğer menü zaten kapalıysa animasyonu tekrar oynatma
        if (this.container.style.pointerEvents === 'none') return;

        Fabric.Render.onRouteChange('MENU_CLOSE'); // Kamerayı normale döndür
        gsap.to(this.container, { clipPath: "circle(0% at 50% -10%)", duration: 0.8, ease: "expo.inOut", pointerEvents: "none" });
    }
}
