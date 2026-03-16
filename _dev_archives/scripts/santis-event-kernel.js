/**
 * 🛡️ SANTIS OS EVENT KERNEL & SHIELD v1.0
 * Enterprise-grade pub/sub with TTL, Pending Queue, Lazy Load support, Debounce and Memory Management.
 */
class EventBusShield {
    constructor(ttl = 30000) {
        this.queue = [];
        this.ttl = ttl;
        this.cleanupTimer = null;
        this.listeners = {};
    }

    // 1️⃣ Abone Ol (Subscribe)
    subscribe(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
        console.log(`[Shield] Abonelik eklendi: ${eventName}`);
    }

    // 2️⃣ Olay Yayınla (Emit)
    emit(eventName, payload, onFailure) {
        const timestamp = Date.now();
        const hasActiveListeners = this.listeners[eventName] && this.listeners[eventName].length > 0;

        if (hasActiveListeners) {
            // Dinleyici varsa anında fırlat
            this.listeners[eventName].forEach(cb => cb(payload));
        } else {
            // Dinleyici yoksa havaya atma, kalkanın kuyruğunda beklet (Lazy Load Güvenliği)
            this.queue.push({ eventName, payload, timestamp, onFailure });
            console.log(`[Shield] ⏳ Olay kuyruklandı (dinleyici bekleniyor): ${eventName}`);
        }

        if (!this.cleanupTimer) this.startCleanupLoop();
    }

    // 3️⃣ Asılı Kalan Olayları Temizle (Garbage Collection / TTL)
    startCleanupLoop() {
        this.cleanupTimer = setInterval(() => {
            const now = Date.now();
            this.queue = this.queue.filter(event => {
                if (now - event.timestamp > this.ttl) {
                    console.error(`[Shield] ❌ TTL Zaman Aşımı. İptal edilen olay: ${event.eventName}`);
                    if (typeof event.onFailure === 'function') {
                        event.onFailure(event.payload); // Fallback UI tetikleyici
                    }
                    return false;
                }
                return true;
            });

            // Kuyruk boşaldıysa döngüyü durdurarak işlemciyi (CPU) rahatlat
            if (this.queue.length === 0) {
                clearInterval(this.cleanupTimer);
                this.cleanupTimer = null;
            }
        }, Math.max(1000, this.ttl * 0.1)); // Performans dostu aralık belirleme
    }

    // 4️⃣ Bekleyen Olayları Tetikle (Modül yüklendiğinde - Kapsülleme korundu)
    triggerEvent(eventName) {
        this.queue = this.queue.filter(event => {
            if (event.eventName === eventName) {
                console.log(`[Shield] 🔓 Kuyruktaki olay serbest bırakıldı: ${event.eventName}`);
                if (this.listeners[eventName]) {
                    this.listeners[eventName].forEach(cb => cb(event.payload));
                }
                return false; // Tetiklenen olayı kuyruktan çıkar
            }
            return true; // Diğer olayları kuyrukta tutmaya devam et
        });
    }

    // 5️⃣ Bellek Sızıntısı Koruması (Kalkanı Kapatma)
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.queue = [];
        this.listeners = {};
        console.log('[Shield] Kalkan imha edildi. Döngüler (Intervals) durduruldu. 🛑');
    }
}

// =========================================================================
// 🚀 SANTIS OS "BIG PICTURE" SİMÜLASYONU
// =========================================================================

console.log("=== Santis OS Çekirdeği Başlatılıyor ===");

// Simülasyon için TTL parametresi 5 saniye belirlendi
const bus = new EventBusShield(5000);

// Sistemden animasyon tercihlerini oku (A11y - Erişilebilirlik)
// Not: Tarayıcı dışındaki bir Node.js ortamında test edilirse matchMedia undefined olacaktır, o yüzden güvenli bir polyfill kullanıyoruz.
const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

// ---------------------------------------------------------
// 🧠 CONCIERGE AI YÜKLENİYOR
// ---------------------------------------------------------
bus.subscribe('payment.success', (payload) => {
    if (prefersReducedMotion) {
        console.log('✨ [Concierge AI] Erişilebilirlik modu açık (Reduce Motion): Sade fade-in geçişle VIP Arayüz uyanıyor...');
    } else {
        console.log('🎉 [Concierge AI] Konfeti Patlatıldı ve Chime Sesi Çalındı! (Sıfır Gecikme - Lüks Servis)');
    }
    console.log(`👑 [Concierge AI] Sipariş onayı için kişiselleştirilmiş teklif sunuluyor: Model #${payload.userId}`);

    // Test bitiminden sonra sistemi otomatik kapatarak Garbage Collection doğrulamasını yap
    setTimeout(() => {
        console.log('--- Simülasyon Sonu ---');
        bus.destroy();
    }, 1000);
});

// ---------------------------------------------------------
// 📊 GÖZLEMCİ (DASHBOARD) EKLENİYOR (BATCHING MECHANISM)
// ---------------------------------------------------------
let pendingDashboardEvents = [];
bus.subscribe('payment.success', (payload) => {
    pendingDashboardEvents.push(payload); // Olayı hemen ekrana basma, havuzda topla
});

// 250ms'de bir yığılmış olayları DOM'a çiz (Gözlemci Etkisi - Observer Effect kırıldı)
setInterval(() => {
    if (pendingDashboardEvents.length > 0) {
        const batch = pendingDashboardEvents.splice(0, pendingDashboardEvents.length);
        console.log(`📊 [Dashboard] Tüm olaylar UI'da Toplu Güncellendi (Batch Size: ${batch.length}) - CPU Tıkanması Önlenmiş Oldu.`);
    }
}, 250);

// ---------------------------------------------------------
// 👤 KULLANICI ETKİLEŞİMİ (RİTÜELİ MÜHÜRLÜYOR)
// ---------------------------------------------------------
console.log('---');
console.log('👤 [Kullanıcı] "Ritüeli Mühürle" butonuna bastı!');

// Bu olay anında Vault modülünü arıyor ama Vault henüz inmemiş! Olay zırhın içinde havada asılı kalacak.
bus.emit('ritual.book.clicked', {
    userId: 'VIP_1B0CE4EDA32D01',
    ritualId: 'hm_kese'
}, () => {
    // ☠️ onFailure Callback (Senaryo A: İnternet Koptu)
    console.error('⚠️ [Fallback UI] Çok üzgünüz, işlem sırasında Ağ Hatası oluştu. Lütfen tekrar deneyin.');
});

// ---------------------------------------------------------
// 💳 KASA (VAULT) LAZY LOAD SİMÜLASYONU VE ARAYÜZ KİLİDİ
// ---------------------------------------------------------
console.log('🌐 [Ağ] Kasa (Vault) ağı üzerinden indiriliyor. (Tahmini 3 sn)');

setTimeout(() => {
    console.log('📦 [Ağ] Vault modülü başarıyla indirildi ve sisteme JS olarak inject edildi!');

    // Kasa modülü sisteme abone oluyor
    bus.subscribe('ritual.book.clicked', (payload) => {
        console.log('💳 [Vault] Gelen ritüel siparişi yakalandı.', payload);

        // Form onaylandığı saniye arayüzü kilitle (UI Lock State & Pending)
        const animationType = prefersReducedMotion ? 'Statik Yükleniyor Yazısı' : 'Lüks İşlenen Altın Loader';
        console.log(`🔒 [UI Lock] Olay ateşlendi: 'vault.payment.pending' (${animationType})`);
        console.log('🔒 [UI Lock] Tüm Butonlar "Disabled", CSS "pointer-events: none" uygulandı. History API donduruldum (Geri Tuşu çalışmaz).');

        // Stripe Asenkron Süreci (Örn: 2 saniyelik ağ işlemi / Double Charge koruması aktif)
        console.log('🏦 [Stripe] Ödeme ağ çağrısı başlatıldı. Sunucudan onay bekleniyor...');
        setTimeout(() => {
            console.log('🔓 [UI Unlock] İşlem onaylandı. Arayüz kilitleri açılıyor...');
            // Stripe API başarılı sonucunu dönünce asıl başarı olayını ateşle:
            bus.emit('payment.success', {
                userId: payload.userId,
                amount: 250,
                currency: 'EUR'
            });
        }, 2000);
    });

    // 🎯 Kapsülleme (Encapsulation) Yasası: EventBus içindeki dışarıya kapalı kuyruğa müdahale etmeden,
    // kendi trigger komutu ile tetikle:
    bus.triggerEvent('ritual.book.clicked');

}, 3000); // 3 saniyelik ağ gecikmesi
