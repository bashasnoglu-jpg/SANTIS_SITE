/**
 * SANTIS SOVEREIGN OS - BOOKING SPA ENGINE
 * Kural: "Sıfır Sürtünmeli Render. DOM anında zerk edilir."
 */

import { getServiceById, SOVEREIGN_MENU } from '../data/menu-manifest.js';
import { QuantumVault } from './santis-quantum-vault.js';

// Global Kasa (Wizard scriptinden erişilebilmesi için)
window.QuantumVault = QuantumVault;

class SovereignBookingSPA {
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);
        this.requestedService = this.urlParams.get('service');
        
        // Motoru ateşle
        this.ignite();
    }

    ignite() {
        if (this.requestedService) {
            const serviceData = getServiceById(this.requestedService);
            // 1. Durum: URL'de ID var ve Manifest'te karşılığı eşleşti (JIT Hydration)
            if (serviceData && serviceData.active) {
                this.hydrate(serviceData);
                return;
            }
        }
        
        // 2. Durum: URL boş, hatalı veya servis silinmiş (Fallback Shield)
        this.renderFallback();
    }

    hydrate(serviceData) {
        console.log(`[SOVEREIGN KERNEL]: Booking SPA Hydrated for ${serviceData.id}`);
        
        // HTML Dosyasındaki Legacy Global State'e Veriyi Zerk Et
        window.menuMemory = {
            ritual: serviceData.name.tr,
            price: serviceData.priceEUR
        };

        // DOM elementlerini anında bul ve güncelle
        const displayEl = document.getElementById('display-ritual');
        if(displayEl) {
            displayEl.innerText = `${serviceData.name.tr} (${serviceData.durationMinutes} Dk) ritüeliniz için anı seçin.`;
        }
        
        const summaryRitualEl = document.getElementById('summary-ritual');
        if(summaryRitualEl) {
            summaryRitualEl.innerText = `${serviceData.name.tr} (${serviceData.durationMinutes} Dk)`;
        }

        const upsellContainer = document.getElementById('summary-upsell-container');
        if(upsellContainer) {
            // Ana ritüel fiyatı olduğu için Upsell görünümünü temizle
            upsellContainer.classList.add('hidden');
        }

        // Fiyat detayını "Son Mühür" alanına ek bir info olarak ezelim (Zariflik)
        setTimeout(() => {
            const btnSeal = document.getElementById('btn-seal');
            if(btnSeal && !btnSeal.innerText.includes('€')) {
                btnSeal.innerHTML = `Ritüeli Onayla <span style="opacity:0.6; font-size:10px; display:block; margin-top:2px;">(Toplam: ${serviceData.priceEUR} € + Ekstralar)</span>`;
            }
        }, 500);

        // Native Storage'ı temizle (Geleceğin bug'larını engelle)
        localStorage.removeItem('santis_pending_booking');
    }

    renderFallback() {
        console.warn(`[SOVEREIGN KERNEL]: Service Mismatch/Missing! Graceful Fallback Shield Activated.`);
        
        // SPA Kökünü Bul (Mevcut Sihirbazın Kapsayıcısı)
        const rootElement = document.querySelector('.max-w-2xl');
        if (!rootElement) return;

        // Tüm aktif menünün listelendiği genel karşılama ekranı (Glassmorphism Tasarım)
        let allServicesHTML = SOVEREIGN_MENU.filter(s => s.active).map(svc => `
            <div class="selectable rounded-2xl p-4 text-left border border-white/5 hover:border-santisEmerald/50 hover:bg-santisEmerald/5 transition-all mb-3 flex items-center justify-between cursor-pointer group" onclick="window.location.href='?service=${svc.id}'">
                <div>
                    <h3 class="text-white font-serif text-lg group-hover:text-santisEmerald transition-colors">${svc.name.tr}</h3>
                    <span class="text-gray-400 text-sm tracking-wide">⏱ ${svc.durationMinutes} Dk • 💎 ${svc.category.split('_').join(' ').toUpperCase()}</span>
                </div>
                <span class="text-santisEmerald font-semibold bg-santisEmerald/10 px-3 py-1 rounded-full border border-santisEmerald/20">${svc.priceEUR} €</span>
            </div>
        `).join('');

        rootElement.innerHTML = `
            <div class="fallback-container fade-in-fast p-2 md:p-6 text-center">
                <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <svg class="w-8 h-8 text-santisGold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                </div>
                <h2 class="font-serif text-3xl text-white mb-2">Sovereign SPA'ya Hoş Geldiniz</h2>
                <h3 class="text-gray-400 text-sm mb-8 tracking-widest uppercase">Lütfen bir ritüel seçiniz</h3>
                
                <div class="max-h-[50vh] overflow-y-auto no-scrollbar pr-2 mb-6">
                    ${allServicesHTML}
                </div>
                
                <button onclick="window.location.href='/spa-menu.html'" class="w-full border border-white/10 text-gray-400 py-4 rounded-xl font-medium uppercase text-sm hover:bg-white/5 hover:text-white transition-colors">
                    Menüye Geri Dön
                </button>
            </div>
        `;
    }
}

// DOM tam yüklendiğinde motoru SPA köküne bağla
document.addEventListener('DOMContentLoaded', () => {
    new SovereignBookingSPA();
});
