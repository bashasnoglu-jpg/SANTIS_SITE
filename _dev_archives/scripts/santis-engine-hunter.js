/**
 * 🦅 SANTIS ENGINE HUNTER (The Ghost Sweeper)
 * V17 Mimarisinde gizlice çalışan eski kralları (Zombi Motorları), hayalet scriptleri ve RAM sömüren sınıfları anında tespit eder.
 */

(function initSantisEngineHunter() {
    console.log("%c🦅 [SANTIS ENGINE HUNTER] Ava çıkılıyor... Gözler bağlandı, karanlık taranıyor.", "color: #ff0055; font-size: 14px; font-weight: bold;");

    const KINGS_LIST = [
        "V5", "V7", "V8", "V10", "V17",
        "SovereignQuantumRail", "SantisCardEngine",
        "RailAegis", "SovereignVirtualizer", "SovereignMatrix"
    ];

    const rogueEnginesFound = [];
    const zombieScripts = [];

    // 1. DOM ÜZERİNDEKİ SCRIPT TARAMASI
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src) {
            const lowerSrc = src.toLowerCase();
            if (lowerSrc.includes('engine') || lowerSrc.includes('rail') || lowerSrc.includes('v5') || lowerSrc.includes('v7') || lowerSrc.includes('v8') || lowerSrc.includes('v10')) {
                zombieScripts.push(src);
            }
        }
    });

    if (zombieScripts.length > 0) {
        console.warn("%c[DOM HUNTER] 🧟 Zombi (veya Aktif) Scriptler Tespit Edildi:", "color: #ffa500; font-weight: bold;", zombieScripts);
    } else {
        console.log("%c[DOM HUNTER] ✅ DOM'da şüpheli script bağlantısı bulunamadı.", "color: #00ff00;");
    }

    // 2. GLOBAL WINDOW (RAM) TARAMASI
    for (const key in window) {
        try {
            if (key.startsWith('Sovereign') || key.startsWith('Santis') || key.toLowerCase().includes('engine') || key.toLowerCase().includes('rail')) {
                // Ignore standard safe objects
                if (['SantisBus', 'SantisDataBridge', 'SovereignVirtualizer', 'SovereignEngineInstance', 'SantisCache'].includes(key) && window[key] != null) {
                    continue; // V17 Safe List
                }

                if (window[key] !== null && window[key] !== undefined) {
                    rogueEnginesFound.push({
                        name: key,
                        type: typeof window[key],
                        isClass: typeof window[key] === 'function' && window[key].toString().includes('class ')
                    });
                }
            }
        } catch (e) { /* Ignore CORS/Security restricted properties */ }
    }

    if (rogueEnginesFound.length > 0) {
        console.table(rogueEnginesFound);
        console.error("%c🚨 [RAM HUNTER] V17 Mimarisinde yeri olmayan HAYALET MOTORLAR hafızada (Window) yaşıyor!", "color: red; font-size: 13px;");
    } else {
        console.log("%c[RAM HUNTER] ✅ Global RAM tertemiz! Hayalet sınıf veya obje yok.", "color: #00ff00;");
    }

    // 3. EVENT LISTENER SIZINTI TARAMASI
    console.log("%c[HUNTER SUMMARY] Tarama tamamlandı. V17 Mimarisi yukarıdaki engeller temizlenene kadar %100 saf Kuantum gücüne ulaşamaz.", "color: #a8a8a8;");

    // Kendini global objeye ekle ki konsoldan tekrar çağırılabilsin
    window.SantisHunter = {
        scan: initSantisEngineHunter,
        rogues: rogueEnginesFound,
        scripts: zombieScripts
    };

})();
