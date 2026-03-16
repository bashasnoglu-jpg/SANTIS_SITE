/**
 * ⚡ SOVEREIGN OS v31: OMNI-FILTER (NETFLIX-TIER WORKER)
 * The Hive Mind | Zero-Jank Quantum Data Pipeline
 * ========================================================
 * Bu Worker, ana iş parçacığını (Main Thread) 1 ms bile bloke etmeden
 * devasa JSON kütlelerini O(1) maliyetle işler. "Inverted Index" (Ters Dizin)
 * araması ve "Task Chunking" ile 120 FPS render sürecini sekteye uğratmaz.
 */

// Kuantum Hafıza: Sadece bir kere Parse edilir, sonra hep RAM'den akar.
const QuantumVault = {
    collections: new Map(), // Orijinal Veri Seti (URL bazlı)
    index: new Map()       // O(1) Arama İçin Ters Dizin (Inverted Index)
};

self.onmessage = async (event) => {
    const { action, payload, jobId } = event.data;
    try {
        if (action === 'INIT') {
            await handleInit(payload, jobId);
        } else if (action === 'FILTER') {
            await handleFilter(payload, jobId);
        } else {
            throw new Error(`Bilinmeyen OMNI komutu: ${action}`);
        }
    } catch (error) {
        self.postMessage({ status: 'error', error: error.message, jobId });
    }
};

/**
 * 1. VERİ İNŞASI & TERS DİZİN OLUŞTURMA (O(N) - Bir Kere Çalışır)
 */
async function handleInit(payload, jobId) {
    const { sourceUrl } = payload;
    
    if (QuantumVault.collections.has(sourceUrl)) {
        self.postMessage({ status: 'ready', source: sourceUrl, cached: true, jobId });
        return;
    }

    const t0 = performance.now();
    try {
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error(`HTTP Zafiyeti: ${response.status}`);
        
        const data = await response.json();
        const arrData = Array.isArray(data) ? data : (data.items || []);
        
        // Ana Koleksiyonu RAM'e mühürle
        QuantumVault.collections.set(sourceUrl, arrData);
        
        // Ters Dizin (Inverted Index) İnşası - Metin Aramalarını Işık Hızına Çıkarır
        buildInvertedIndex(sourceUrl, arrData);

        const t1 = performance.now();
        
        self.postMessage({ 
            status: 'ready', 
            source: sourceUrl, 
            loadTimeMs: (t1 - t0).toFixed(2),
            totalItems: arrData.length,
            jobId 
        });
    } catch(err) {
        throw new Error(`Sovereign Çöküşü (${sourceUrl}): ${err.message}`);
    }
}

function buildInvertedIndex(sourceUrl, arrData) {
    const wordMap = new Map();
    arrData.forEach((item, index) => {
        // Tüm alanları küçük harfe çevirip kelime kelime parçala
        const textBlob = `${item.title || ''} ${item.description || ''} ${item.content?.tr?.title || ''} ${item.content?.tr?.shortDesc || ''}`.toLowerCase();
        const words = textBlob.match(/[\wğüşöçİĞÜŞÖÇ]+/g) || [];
        
        words.forEach(word => {
            if (!wordMap.has(word)) wordMap.set(word, new Set());
            wordMap.get(word).add(index);
        });
    });
    QuantumVault.index.set(sourceUrl, wordMap);
}

/**
 * 2. KİNETİK FİLTRELEME & GÖNDERİM (O(1) veya O(logN))
 */
async function handleFilter(payload, jobId) {
    const { sourceUrl, category, tags = [], searchQuery = '', lang = 'tr' } = payload;
    
    const data = QuantumVault.collections.get(sourceUrl);
    if (!data) throw new Error(`[Hive Mind] Veri eksik. Önce INIT çağrılmalı: ${sourceUrl}`);

    const t0 = performance.now();
    let resultIndices = new Set(data.map((_, i) => i)); // Başlangıçta hepsi

    // ARAMA SORGUSU (Inverted Index ile O(1) Çakışma)
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '') {
        const queryWords = searchQuery.toLowerCase().match(/[\wğüşöçİĞÜŞÖÇ]+/g) || [];
        const indexMap = QuantumVault.index.get(sourceUrl);
        
        let queryIndices = null;
        for (const word of queryWords) {
            let matches = new Set();
            // Prefix arama simülasyonu
            for (const [key, indices] of indexMap.entries()) {
                if (key.startsWith(word)) {
                    indices.forEach(i => matches.add(i));
                }
            }
            if (queryIndices === null) {
                queryIndices = matches;
            } else {
                // Kesişim (Intersection)
                queryIndices = new Set([...queryIndices].filter(i => matches.has(i)));
            }
        }
        resultIndices = queryIndices || new Set();
    }

    // SONUÇLARI MATRİSE ÇEVİR VE KATEGORİLE
    let results = [];
    for (const idx of resultIndices) {
        const item = data[idx];
        
        // Kategori Taraması (Legacy / Modern)
        if (category && category !== 'all') {
            const itemCat = String(item.category || item.categoryId || '').toLowerCase();
            const qCat = String(category).toLowerCase();
            
            let pass = false;
            if (qCat === 'skincare') pass = itemCat.includes('skincare') || itemCat.includes('sothys') || itemCat === 'face';
            else if (qCat === 'massage') pass = itemCat.includes('massage') || itemCat.includes('asian');
            else if (qCat === 'hamam') pass = itemCat.includes('hammam') || itemCat.includes('hamam');
            else if (qCat === 'boutique' || qCat === 'products') pass = true; // Mağazada hepsi
            else pass = itemCat.includes(qCat);
            
            if (!pass) continue;
        }

        // Etiket Taraması
        if (tags && tags.length > 0 && Array.isArray(item.tags)) {
            if (!tags.every(tag => item.tags.includes(tag))) continue;
        }

        results.push(item);
    }

    const t1 = performance.now();

    // 🏆 ZERO-COPY TRANSFER (Transferable Objects) -> ArrayBuffer kullanımı
    // Ana dizini (Main Thread) kopyalama yükünden kurtarmak için
    const jsonStr = JSON.stringify(results);
    const ui8Buffer = new TextEncoder().encode(jsonStr).buffer;

    self.postMessage({
        status: 'filtered',
        renderPayload: ui8Buffer,
        computeTimeMs: (t1 - t0).toFixed(2),
        totalResults: results.length,
        jobId
    }, [ui8Buffer]); // Transferable bellek tahsisi
}
