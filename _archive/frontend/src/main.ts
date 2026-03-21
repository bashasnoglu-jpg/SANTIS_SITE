/// <reference types="vite-plugin-pwa/client" />
import './styles/cinematic.css'; // Tailwind direktifleri
import { Kernel } from './core/santis-core';
import { InteractionEngine } from './engines/interaction';
import { LiquidMenu } from './ui/liquid-menu';
import { SpatialUIEngine } from './ui/spatial-engine';
import { CheckoutRitual } from './pages/checkout-ritual';
import { Store } from './core/store';
import { APIClient } from './services/api-client';
import { registerSW } from 'virtual:pwa-register';

// 🧹 [PWA] Eski ve bozuk Service Worker'ları acımasızca temizle (Self-Healing)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister().then(boolean => {
                if(boolean) console.log('🗑️ [PWA] Eski Service Worker başarıyla imha edildi.');
            });
        } 
    });
}

// PWA Service Worker Registration
registerSW({
  onNeedRefresh() {
    console.log('🔄 [PWA] Yeni sürüm hazır, refresh bekleniyor.');
  },
  onOfflineReady() {
    console.log('🌍 [PWA] Sistem çevrimdışı çalışmaya hazır!');
  },
});

const os = new Kernel();
os.boot().then(async () => {
    os.initWorkerFabric();
    
    // Hacimsel Apple Vision OS Arayüzü Başlatılıyor
    const spatialUI = new SpatialUIEngine();
    
    // UI Orchestration - Yeni Reaktif Veri Tüketen LiquidMenu
    new LiquidMenu(spatialUI);

    // Ultra Motion GPU Motoru Başlatılıyor
    const interaction = new InteractionEngine();
    await interaction.enableUltraMotion();

    // SPATIAL INJECTION: Diğer tüm menüler için Volume Mount
    spatialUI.mount();

    // YENİ DATA BRIDGE 🦅 - API'den verileri çek ve Reaktif Kasa'ya bas
    APIClient.fetchMegaMenu();

    // DOM EVENT BAĞLAMASI: Tetikleyici sadece Store'u değiştirir (Reaktivite)
    const trigger = document.getElementById('menu-trigger');
    if (trigger) {
        trigger.addEventListener('click', () => {
            Store.update({ ui: { ...Store.state.ui, isMenuOpen: !Store.state.ui.isMenuOpen } });
        });
    }

    // THE GRAND FINALE: L5 Checkout Ritual ve Living Ticket Enjeksiyonu
    new CheckoutRitual(spatialUI);
});
