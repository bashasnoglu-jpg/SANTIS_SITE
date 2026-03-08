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

        async initiate(variantId, ghostId) {
            if (!isInitialized) this.init();
            console.log(`[Vault] Ritual ${ghostId} için Kuantum Tüneli açılıyor...`);

            // 1. Görsel Kilidi Aktif Et (Neuro-Focus)
            this.toggleOverlay(true);
            const startTime = Date.now();

            try {
                // 2. Asenkron Shopify Handshake (Arka planda)
                // Hali hazırda Shopify variant ID'si gerektirir. Eğer yoksa simulated fallback çalışır.
                const checkoutPromise = this.fetchShopifyURL(variantId);

                // 3. Yarışı Başlat: API cevabı vs Minimum Animasyon Süresi
                const checkoutUrl = await checkoutPromise;
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, this.minAnimationTime - elapsedTime);

                // 4. Animasyon Bitişiyle Kusursuz Geçiş
                setTimeout(() => {
                    console.log("[Vault] Geçiş Mühürlendi. Shopify'a akış başlıyor.");
                    window.location.href = checkoutUrl;
                }, remainingTime);

            } catch (error) {
                this.handleError(error);
            }
        },

        // Butonlardan tetiklenen asıl giriş fonksiyonu
        openAvailabilityMatrix(ritualId) {
            // RitualID'den Shopify Variant ID türetecek bir mantık eklenebilir. Şimdilik dummy variant
            const dummyVariantId = btoa("gid://shopify/ProductVariant/1234567890");
            this.initiate(dummyVariantId, ritualId);
        },
        open(ritualId) {
            this.openAvailabilityMatrix(ritualId);
        },

        async fetchShopifyURL(variantId) {
            // Bu kısım gerçek prod ortamında Shopify'dan token ile fetch atar.
            // Santis.config global değilse lokal fallback alıyoruz.
            const apiEndpoint = (window.Santis && window.Santis.config) ? window.Santis.config.endpoints.shopify : config.endpoints.shopify;
            const apiToken = (window.Santis && window.Santis.config) ? window.Santis.config.tokens.storefront : config.tokens.storefront;

            const query = `mutation { checkoutCreate(input: { lineItems: [{ variantId: "${variantId}", quantity: 1 }] }) { checkout { webUrl } } }`;

            // EĞER SADECE DEMO ORTAMIYSA ASYNC TIMEOUT İLE SIMULE ET (Domain veya HTTPS hazır olmayabilir)
            if (apiToken === 'API_TOKEN_XYZ') {
                console.warn("[Vault] Demo Mode: Gerçek API bağlantısı yok, yönlendirme simülasyonu çalışıyor.");
                return new Promise(resolve => {
                    setTimeout(() => resolve("#checkout-success"), 600);
                });
            }

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': apiToken
                },
                body: JSON.stringify({ query })
            });

            const { data } = await response.json();
            if (!data || !data.checkoutCreate || !data.checkoutCreate.checkout) {
                throw new Error("Geçersiz API Yanıtı");
            }
            return data.checkoutCreate.checkout.webUrl;
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
