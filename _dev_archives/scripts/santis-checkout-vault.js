/**
 * 🌍 [SANTIS_QUANTUM_OS] Phase 5: Sovereign Checkout Vault (HYBRID)
 * Combined Visual Illusion & Shopify Headless Redirect with Graceful Degradation
 */

window.CheckoutVault = (function () {
    let portal = null;
    let isInitialized = false;

    // Default Configuration Object for Shopify Headless
    // Needs valid tokens for real requests, mocking fallback included
    const config = {
        endpoints: { shopify: 'https://santis-club.myshopify.com/api/2023-10/graphql.json' },
        tokens: { storefront: 'API_TOKEN_XYZ' }
    };

    function injectUI() {
        if (isInitialized) return;

        const style = document.createElement('style');
        style.textContent = `
            /* SANTIS CHECKOUT VAULT - OVERLAY & PULSE */
            :root {
                --s-obsidian: #050505;
                --s-gold: #D4AF37;
            }
            .santis-vault-overlay {
                position: fixed;
                inset: 0;
                z-index: 99999;
                background: radial-gradient(circle at center, rgba(5,5,5,0.7) 0%, var(--s-obsidian) 100%);
                backdrop-filter: blur(0px);
                opacity: 0;
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
            }
            body.santis-vault-active .santis-vault-overlay {
                opacity: 1;
                backdrop-filter: blur(40px);
                pointer-events: all;
            }
            
            /* LITE ESSENTIAL FALLBACK */
            body.santis-vault-lite .santis-vault-overlay {
                background: rgba(5,5,5,0.98);
                backdrop-filter: none !important; /* GPU tasarrufu */
            }

            /* Lüks Nabız Animasyonu (The Golden Pulse) */
            .santis-vault-loader {
                width: 80px;
                height: 80px;
                border: 1px solid var(--s-gold);
                border-radius: 50%;
                position: relative;
                animation: vaultPulse 1.5s infinite ease-in-out;
            }
            .santis-vault-loader::after {
                content: 'SECURELY PREPARING RITUAL';
                position: absolute;
                top: 130%;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                font-size: 0.65rem;
                letter-spacing: 4px;
                color: var(--s-gold);
                opacity: 0.8;
                font-family: 'Inter', sans-serif;
            }
            @keyframes vaultPulse {
                0% { transform: scale(0.8); opacity: 0.3; box-shadow: 0 0 0 0 rgba(211, 175, 55, 0.4); }
                50% { transform: scale(1); opacity: 1; box-shadow: 0 0 40px 10px rgba(211, 175, 55, 0.2); }
                100% { transform: scale(0.8); opacity: 0.3; box-shadow: 0 0 0 0 rgba(211, 175, 55, 0); }
            }
        `;
        document.head.appendChild(style);

        portal = document.createElement('div');
        portal.className = 'santis-vault-overlay';
        portal.innerHTML = `
            <div class="santis-vault-loader"></div>
        `;
        document.body.appendChild(portal);

        isInitialized = true;
    }

    const CheckoutVaultAPI = {
        minAnimationTime: 1800, // En az 1.8sn lüks animasyon göster

        init() {
            injectUI();
            console.log("💎 [Sovereign Checkout] Hybrid Vault Initialized.");
        },

        // Butonlardan tetiklenen asıl giriş fonksiyonu (V7 Uyumlu Dinamik Nesne)
        openAvailabilityMatrix(serviceData) {
            this.initiateCheckout(serviceData);
        },
        open(serviceData) {
            if (!serviceData) return;
            this.currentService = serviceData;

            // 🧠 YAPAY ZEKA: Bu bir Ürün mü, yoksa Spa Ritüeli mi?
            const dateContainer = document.getElementById('vault-calendar-matrix');
            const datePicker = document.getElementById('vault-date-picker');

            if (serviceData.isProduct) {
                // KOZMETİK ÜRÜNÜYSE: Tarih Seçiciyi GİZLE! 
                if (dateContainer) dateContainer.style.display = 'none';
                // Stripe API hata vermesin diye hayali bir tarih atıyoruz
                if (datePicker) datePicker.value = "2099-01-01";
                if (this.checkoutBtn) this.checkoutBtn.innerHTML = 'Kargoya Ver (Satın Al)';
            } else {
                // SPA RİTÜELİYSE: Tarih Seçiciyi GÖSTER!
                if (dateContainer) dateContainer.style.display = 'block';
                //if (datePicker) datePicker.value = ""; // Yeni tarih için sıfırla
                if (this.checkoutBtn) this.checkoutBtn.innerHTML = 'Ritüeli Mühürle';
            }

            this.openAvailabilityMatrix(serviceData);
        },

        async initiateCheckout(serviceData) {
            if (!isInitialized) this.init();

            const service = typeof serviceData === 'object' ? serviceData : { id: serviceData, title: "Sovereign Ritüel", price_eur: 150 };

            // Tarih kontrolü (ürün değilse)
            const ritualDate = this.datePicker ? this.datePicker.value : new Date().toISOString().split('T')[0];
            if (!service.isProduct && !ritualDate) {
                alert("Lütfen asil bir tarih seçiniz Komutanım.");
                return;
            }

            const originalText = this.checkoutBtn ? this.checkoutBtn.innerHTML : '';
            if (this.checkoutBtn) {
                this.checkoutBtn.innerHTML = `<svg class="animate-spin h-5 w-5 mr-3 inline-block" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> <span>Sovereign Tüneli Açılıyor...</span>`;
                this.checkoutBtn.classList.add('opacity-80', 'cursor-not-allowed', 'pointer-events-none');
            }

            console.log(`🚀 [Stripe Vault] Fırlatılıyor: ${service.title} | Tarih: ${ritualDate}`);
            this.toggleOverlay(true);

            try {
                // Fiyat zırhı (string içinden sadece rakam al)
                let cleanPrice = 0;
                if (typeof service.price_eur === 'string') {
                    cleanPrice = parseFloat(service.price_eur.replace(/[^0-9.]/g, '')) || 0;
                } else {
                    cleanPrice = parseFloat(service.price_eur) || 0;
                }

                // God's Eye Ghost ID'sini payload'a ekle
                const ghostId = localStorage.getItem('santis_ghost_id') || 'UNKNOWN_VIP';

                const payload = {
                    ritual_id: service.id || service.slug || "sovereign-item",
                    ritual_name: service.title || "Sovereign Lüks Ürün",
                    price_eur: cleanPrice,
                    date: service.isProduct ? "2099-01-01" : ritualDate,
                    session_id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
                    ghost_id: ghostId
                };

                // FastAPI Sovereign Stripe Köprüsüne Vuruş!
                const response = await fetch('/api/v1/payments/checkout/sovereign-seal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error("Stripe Tüneli Yanıt Vermedi!");

                const data = await response.json();

                if (data.checkout_url) {
                    if (this.checkoutBtn) {
                        this.checkoutBtn.innerHTML = '✅ STRIPE AĞINA BAĞLANILDI';
                        this.checkoutBtn.classList.replace('from-[#D4AF37]', 'from-green-500');
                        this.checkoutBtn.classList.replace('to-[#AA8A2A]', 'to-green-700');
                    }
                    // 0.5 saniye lüks gecikmeyle Stripe'a ışınla
                    setTimeout(() => window.location.href = data.checkout_url, 500);
                } else {
                    throw new Error("Checkout URL bulunamadı.");
                }

            } catch (error) {
                console.error("🚨 [Sovereign Checkout] Hata:", error);
                if (this.checkoutBtn) {
                    this.checkoutBtn.innerHTML = '❌ BAĞLANTI KOPTU';
                    this.checkoutBtn.classList.replace('from-[#D4AF37]', 'from-red-600');
                    this.checkoutBtn.classList.replace('to-[#AA8A2A]', 'to-red-900');
                    setTimeout(() => {
                        this.checkoutBtn.innerHTML = originalText;
                        this.checkoutBtn.classList.replace('from-red-600', 'from-[#D4AF37]');
                        this.checkoutBtn.classList.replace('to-red-900', 'to-[#AA8A2A]');
                        this.checkoutBtn.classList.remove('opacity-80', 'cursor-not-allowed', 'pointer-events-none');
                    }, 3000);
                }
                setTimeout(() => {
                    this.toggleOverlay(false);
                    alert("Rezervasyon güvenli tüneli açılamadı. Lütfen direkt WhatsApp hattımızdan ulaşın.");
                }, 1500);
            }
        },


        toggleOverlay(active) {
            const body = document.body;
            body.classList.toggle('santis-vault-active', active);

            // Sentinel'den cihaz profilini çek (Fallback: ULTRA)
            let tier = 'ULTRA';
            if (window.SantisSentinel && typeof window.SantisSentinel.getTier === 'function') {
                tier = window.SantisSentinel.getTier();
            }

            if (active) {
                if (tier === 'BASIC' || tier === 'LITE_ESSENTIAL') {
                    // Zayıf cihaz: Blur iptal, saf karanlık. WebGL'i uyut.
                    body.classList.add('santis-vault-lite');
                    if (window.SantisForgeManager || window.GhostForge) {
                        console.log("[Vault] Lite Mode Aktif: Blur kapatıldı, GPU rahatlatıldı.");
                        // Yöntemler Quantum Core yapısına göre genişletilebilir
                    }
                } else {
                    // Güçlü cihaz: Görsel şölen devam
                    body.classList.remove('santis-vault-lite');
                }
            } else {
                // Ödeme iptal olursa veya hata verirse sistemi geri uyandır
                if (tier === 'BASIC' || tier === 'LITE_ESSENTIAL') {
                    console.log("[Vault] Lite Mode kapandı. Auralar uyanıyor.");
                }
            }
        },

        handleError(err) {
            console.error("[Vault] Tünel koptu:", err);

            // Asenkron hata anında da minimum geçiş süresini bekle ki jank olmasın
            setTimeout(() => {
                this.toggleOverlay(false);
                alert("Rezervasyon güvenli tüneli açılamadı. Lütfen direkt WhatsApp hattımızdan ulaşın.");
            }, 1000);
        }
    };

    return CheckoutVaultAPI;
})();

// Auto-init on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CheckoutVault.init());
} else {
    window.CheckoutVault.init();
}
