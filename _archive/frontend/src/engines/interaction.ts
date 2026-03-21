import * as Comlink from 'comlink';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Fabric } from './worker-fabric';
import { EventBus } from '../core/santis-bus';

gsap.registerPlugin(ScrollTrigger);

export class InteractionEngine {
    public async enableUltraMotion(): Promise<void> {
        const canvas = document.getElementById('santis-gl') as HTMLCanvasElement;
        if (!canvas || !('transferControlToOffscreen' in canvas)) {
            console.error('🚨 [Interaction] Tarayıcı OffscreenCanvas desteklemiyor veya Canvas yok!');
            return;
        }

        // 1. SİHİRLİ DOKUNUŞ: Canvas kontrolünü DOM'dan tamamen koparıyoruz!
        const offscreen = canvas.transferControlToOffscreen();
        
        // 2. Comlink.transfer ile nesneyi Worker'a kargola (Bellek sahipliğini devreder, SIFIR klonlama maliyeti)
        await Fabric.Render.initEngine(
            Comlink.transfer(offscreen, [offscreen as unknown as Transferable]), 
            window.innerWidth, 
            window.innerHeight, 
            window.devicePixelRatio
        );

        console.log('🌌 [Interaction] Ultra Motion aktif: Canvas kontrolü Render Worker\'a transfer edildi!');
        this.bindEvents();
    }

    private bindEvents(): void {
        window.addEventListener('resize', () => {
            Fabric.Render.onResize(window.innerWidth, window.innerHeight, window.devicePixelRatio);
        }, { passive: true });

        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            // Fire-and-Forget (Fırlat-Unut) RPC çağrısı! Ana thread beklemez.
            Fabric.Render.onPointerMove(x, y);
        }, { passive: true });

        // EventBus Listener For Routes: Update Camera Context
        EventBus.on('ROUTE_CHANGED', (payload) => {
            Fabric.Render.onRouteChange(payload.current);
        });

        // EventBus Listener For Network Status: Dim Ambient Light
        EventBus.on('NETWORK_STATUS', (payload) => {
            Fabric.Render.onNetworkStatus(payload.isOnline);
        });

        // -------------------------------------------------------------
        // UI Interaction: Liquid Menu Scroll Intent (Glassmorphism)
        // -------------------------------------------------------------
        const navbar = document.getElementById('nv-main-nav');
        if (navbar) {
            let lastScrollY = window.scrollY;
            const SHIT_THRESHOLD = 60; // Pixels before glassmorphism kicks in

            // We use GSAP purely for the ScrollTrigger ticking, but update DOM directly for max performance
            ScrollTrigger.create({
                trigger: document.body,
                start: "top top",
                end: "bottom bottom",
                onUpdate: (self) => {
                    const currentY = window.scrollY;
                    
                    // 1. Shrink state (Glassmorphism active)
                    if (currentY > SHIT_THRESHOLD) {
                        navbar.classList.add('is-scrolled');
                        
                        // 2. Scroll Intent (Hide on down, show on up)
                        if (currentY > lastScrollY && currentY > SHIT_THRESHOLD * 2) {
                            navbar.classList.add('is-hidden');
                        } else {
                            navbar.classList.remove('is-hidden');
                        }
                    } else {
                        // At the top -> Reset everything
                        navbar.classList.remove('is-scrolled');
                        navbar.classList.remove('is-hidden');
                    }
                    
                    lastScrollY = currentY;

                    // Send strictly bounded progress to Worker
                    Fabric.Render.onScroll(self.progress);
                }
            });
        } else {
             // Fallback if no nav
             ScrollTrigger.create({
                trigger: document.body,
                start: "top top",
                end: "bottom bottom",
                onUpdate: (self) => Fabric.Render.onScroll(self.progress)
            });
        }
    }
}
