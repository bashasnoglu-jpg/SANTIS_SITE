// SANTIS MASTER OS - GUEST ZEN LOGIC (V2.2.1)
// The Sovereign Skeleton & Dynamic Fetch Engine

// 1. Kartlar yüklenirken bozulmayı önleyen (Layout Shift engelleyici) Skeleton Tetikleyici
function showSovereignSkeleton() {
    const container = document.getElementById('ritual-container');
    if (container) {
        // Guest Zen veya ilgili bölümler için minimal rezervli "Glass Skin" iskeletleri
        container.innerHTML = '<div class="skeleton-card"></div>'.repeat(6);
    }
}

// 2. Data Fetch Operation (Simüle edilmiş veya API'den gelen asıl veriler)
async function loadSantisRituals() {
    showSovereignSkeleton();

    try {
        // Cache Busting via ?v parameter to avoid Fetch stalling
        const url = `/api/v1/rituals?v=${Date.now()}`;

        // Simüle API çağrısı (Buraya asıl API / json URL gelecektir, şimdilik mockup data ekleniyor)
        // const res = await fetch(url);
        // const data = await res.json();

        // Simüle Fetch Süresi (Yükleme Efektini Görmek İçin)
        setTimeout(() => {
            const container = document.getElementById('ritual-container');
            if (container) {
                container.innerHTML = `
                    <div class="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <h4 class="text-white font-bold">Deep Relax Hamam</h4>
                        <p class="text-xs text-gray-400 mt-2">Authentic purification ritual with luxury touch.</p>
                        <div class="mt-4 flex justify-between items-center">
                            <span class="text-cyan-400 font-mono">€180</span>
                            <button class="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition">Book</button>
                        </div>
                    </div>
                `.repeat(4);
            }
        }, 800);

    } catch (err) {
        console.error("Master OS Ritual Load Failed:", err);
    }
}

// 3. Init Logic
document.addEventListener('DOMContentLoaded', () => {
    // Sayfa ve modüller render olduğunda veri dökümünü başlat
    loadSantisRituals();
    console.log("Guest Zen Logic Initialized (v2.2.1) ✓");
});
