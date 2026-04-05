// assets/js/modules/santis-collection-builder.js
// SDCR V85.0 - THE RITUAL ENGINE (Tesla-Class Configurator Brain)

const CATALOG = {
    A: {
        name: 'Arınma (Hamam)',
        items: {
            'A1': { name: 'Santis Signature Kese', price: 80, duration: '45 Dk' },
            'A2': { name: 'Medical Tuz Peeling', price: 110, duration: '60 Dk' }
        }
    },
    B: {
        name: 'Dokunuş (Masaj)',
        items: {
            'B1': { name: 'Deep Tissue', price: 140, duration: '60 Dk' },
            'B2': { name: 'Bali Ritüeli', price: 190, duration: '90 Dk' }
        }
    },
    C: {
        name: 'Işıltı (Yüz Bakımı)',
        items: {
            'C1': { name: '24K Altın Yüz Bakımı', price: 150, duration: '45 Dk' },
            'C2': { name: 'Hydra-Glow Terapi', price: 120, duration: '60 Dk' }
        }
    }
};

export function mount() {
    console.log("💎 [RITUAL ENGINE] Tesla-Sınıfı Konfigüratör Motoru Ateşlendi.");

    // Likit Hafızaya (SovereignState) Konfigüratör Damarlarını Ekle
    if (window.SovereignState && !window.SovereignState.ritual) {
        window.SovereignState.ritual = {
            selections: { A: null, B: null, C: null }, // Tesla mantığı: Her kategoriden max 1 seçim
            baseTotal: 0,          // İndirimsiz Ham Fiyat
            discountPercent: 0,    // Güncel İndirim Oranı (0, 10, 15, 20)
            discountAmount: 0,     // İndirilen Tutar
            finalTotal: 0,         // Ödenecek Tutar
            vipUnlocked: false,    // %5 Ekstra Kilit
            activeCategories: 0    // A, B, C çeşitliliği
        };
    }

    // Global API (Arayüzden tetiklenecek)
    window.RitualBuilder = {
        toggleItem: (categoryId, itemId) => {
            const state = window.SovereignState.ritual;
            // Eğer aynı ürün seçiliyse çıkar (Toggle Off), değilse yeni ürünü seç (Replace)
            if (state.selections[categoryId] === itemId) {
                state.selections[categoryId] = null;
            } else {
                state.selections[categoryId] = itemId;
            }
            calculateMatrix();
        },
        unlockVIP: (phone) => {
            if (phone && phone.length >= 10) {
                window.SovereignState.ritual.vipUnlocked = true;
                calculateMatrix();
                
                // Kovan'a Asenkron İletim (Sürtünmesiz Lead Yakalama)
                console.log(`🚀 [HIVE NEXUS] Sürtünmesiz VIP Lead Arka Planda Mühürlendi: ${phone}`);
                return true;
            }
            return false;
        }
    };
    
    // İlk hesaplamayı tetikle
    calculateMatrix();
}

// 🧮 THE ALCHEMY (Dinamik Fiyat ve Oyunlaştırma Motoru)
function calculateMatrix() {
    if (!window.SovereignState) return;
    const state = window.SovereignState.ritual;
    
    let baseTotal = 0;
    let activeCats = 0;

    // Fiyat ve Kategori Sayımı
    Object.keys(state.selections).forEach(cat => {
        const itemId = state.selections[cat];
        if (itemId) {
            baseTotal += CATALOG[cat].items[itemId].price;
            activeCats++;
        }
    });

    state.activeCategories = activeCats;

    // İndirim Basamakları (Dopamine Ladder)
    let percent = 0;
    if (activeCats === 2) percent = 10;
    if (activeCats === 3) percent = 15;

    // VIP Velvet Rope (+%5 Ekstra)
    if (state.vipUnlocked && activeCats > 0) {
        percent += 5; // Maksimum %20'ye ulaşır
    }

    // Atomik Matematik İnfazı
    const discountAmount = Math.floor(baseTotal * (percent / 100));
    const finalTotal = baseTotal - discountAmount;

    // Likit Hafızayı Güncelle (DOM data-neural sayesinde otomatik titreyecek)
    state.baseTotal = baseTotal;
    state.discountPercent = percent;
    state.discountAmount = discountAmount;
    state.finalTotal = finalTotal;

    console.log(`🧮 [ENGINE] Kombinasyon: ${activeCats}/3 | İndirim: %${percent} | Final: €${finalTotal}`);
    
    // UI animasyonları için event fırlat
    document.dispatchEvent(new CustomEvent('RitualMatrixUpdated'));
}

export function unmount() {
    console.log("🧹 [RITUAL ENGINE] Apoptosis: Konfigüratör belleği silindi.");
    delete window.RitualBuilder;
}
