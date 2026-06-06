import { formatSovereignPrice } from '/assets/js/core/currency-formatter.js';
/**
 * SANTIS OS - THE SOVEREIGN SEAL [PHASE 35]
 * WebAuthn Passkeys, Biometric Checkout & Neuro-Pricing
 * Architect: Hakan
 */

class SantisBiometricSeal {
    constructor() {
        // Tarayıcı donanımsal biyometriyi destekliyor mu?
        this.isBiometricsAvailable = window.PublicKeyCredential !== undefined;
    }

    async initiateRitual(ritualData) {
        console.log(`🌌 [Sovereign Seal] "${ritualData.title}" için Kuantum Biyometrik Mühür sekansı başlatıldı...`);
        
        // 1. NÖRO-FİYATLANDIRMA (Emotional Pricing Engine)
        let currentFrictionStr = localStorage.getItem('santis_emotional_cache') || '0';
        let currentFriction = parseInt(currentFrictionStr, 10);
        
        if (currentFriction >= 80) {
            console.log(`⚖️ [Neuro-Pricing] Kritik Stres Tespit Edildi (${currentFriction}). Otonom 'Zen Şifası' indirimi yansıtılıyor!`);
            // %20 Otonom İndirim
            if (ritualData.price) ritualData.price = Math.round(ritualData.price * 0.8);
            
            if (window.SantisVoice && typeof window.SantisVoice.speak === 'function') {
                window.SantisVoice.speak("Zihninizin yorgun olduğunu hissediyorum. Bugünlük bu ritüeli size özel bir Zen Şifası ile sunmama izin verin.");
            }
            
            // Fiyatı UI üzerinde otonom değiştir (Phantom DOM Update)
            document.querySelectorAll('[data-santis-bind="price"]').forEach(el => {
                el.style.transition = "color 1s ease, text-shadow 1s ease";
                el.style.color = "#d4af37"; // Vanta Gold
                el.style.textShadow = "0 0 10px rgba(212,175,55,0.5)";
                el.innerHTML = `${formatSovereignPrice(ritualData.price)} (Zen Şifası)`;
            });
            
            // Wait for Aurelia to finish speaking roughly
            await new Promise(r => setTimeout(r, 4000));
        }

        // 2. Akustik ve Haptik Hazırlık (Phase 34 Entegrasyonu)
        this.triggerTensionFeedback(currentFriction);

        if (!this.isBiometricsAvailable) {
            console.warn("📍 [Sovereign Shield] Biyometrik donanım (FaceID/TouchID) bulunamadı. Legacy Form devrede.");
            return this.fallbackToLegacyCheckout(ritualData);
        }

        try {
            // 2. OTONOM WEBAUTHN ÇAĞRISI (FaceID / TouchID Tetiklenir)
            // Sistem, misafirin cihazındaki donanımsal kimlik çipine (Secure Enclave) erişir
            const publicKeyCredentialCreationOptions = {
                challenge: this.generateQuantumChallenge(),
                rp: { name: "Santis Sovereign Spa", id: window.location.hostname },
                user: {
                    id: this.generateQuantumChallenge(),
                    name: window.SantisEventBus ? "vip@santis.os" : "guest",
                    displayName: "Santis VIP Misafiri"
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Sadece cihazın kendi yüz/parmak okuyucusu
                    userVerification: "required" // Biyometrik doğrulama ZORUNLU
                },
                timeout: 60000
            };

            // 🚨 SİHİR BURADA GERÇEKLEŞİR: Cihazın Biyometrik ekranı açılır!
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            // 3. BİYOMETRİK ONAY BAŞARILI! (Tören Tamamlandı)
            this.sealApproved(ritualData, credential);

        } catch (error) {
            console.error("🚨 [Sovereign Seal] Mühür Reddedildi veya İptal Edildi!", error);
            this.sealRejected();
        }
    }

    fallbackToLegacyCheckout(ritualData) {
        if (window.SantisEventBus) {
            window.SantisEventBus.emit('ui:open_legacy_modal', ritualData);
        } else {
            console.log("👉 WhatsApp Yönlendirmesi (Standalone):", ritualData.title);
            window.open('https://wa.me/905348350169?text=' + encodeURIComponent(`Merhaba, ${ritualData.title} rezervasyonu yapmak istiyorum.`), '_blank');
        }
    }

    triggerTensionFeedback(friction) {
        // Mühür anına yaklaşırken kalp atışını hızlandır
        if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]);
        if (window.SantisAcoustics && typeof window.SantisAcoustics.triggerFlashAcoustics === 'function') {
            // Optional tension audio modification
        }
        
        // Eğer zaten Zen Şifası vermediysek standart konuşma
        if (friction < 80 && window.SantisVoice && typeof window.SantisVoice.speak === 'function') {
            window.SantisVoice.speak("Lütfen rezervasyonu biyometrik kimliğinizle mühürleyin.");
        }
    }

    sealApproved(ritualData, credential) {
        console.log("👑 [Sovereign Seal] MÜHÜR VURULDU! Kriptografik Kanıt:", credential.id);
        
        // Dev Şok Dalgası (Haptic + Audio Climax)
        if (navigator.vibrate) navigator.vibrate([200, 50, 400]);
        if (window.SantisAcoustics && typeof window.SantisAcoustics.triggerFlashAcoustics === 'function') {
            window.SantisAcoustics.triggerFlashAcoustics(); // Tetikler 528Hz şok dalgasını
        }
        
        // Aurelia'nın Kapanışı
        setTimeout(() => {
            if (window.SantisVoice && typeof window.SantisVoice.speak === 'function') {
                window.SantisVoice.speak("Törensel kaydınız mühürlendi. Fiziksel biletiniz cüzdanınıza aktarılıyor.");
            }
        }, 800);

        // Otonom Wallet Sıçraması (Phase 27 - Phygital Manifestation)
        if (window.SantisEventBus) window.SantisEventBus.emit('wallet:generate_pass', ritualData);
    }

    sealRejected() {
        // Misafir vazgeçerse Friction skoru artır ve titreşimle uyar (Phase 33 Stres Motoru)
        if (window.SantisFrictionEngine) {
            // +30 puan ceza
            let currentStr = localStorage.getItem('santis_emotional_cache') || '0';
            localStorage.setItem('santis_emotional_cache', parseInt(currentStr) + 30);
        }
        if (navigator.vibrate) navigator.vibrate([500]); // Uzun bir hayal kırıklığı titreşimi
    }

    generateQuantumChallenge() {
        const randomBuffer = new Uint8Array(32);
        window.crypto.getRandomValues(randomBuffer);
        return randomBuffer;
    }
}

// Çekirdeği Matrise Bağla
document.addEventListener('DOMContentLoaded', () => {
    window.SantisSealCore = new SantisBiometricSeal();
});

