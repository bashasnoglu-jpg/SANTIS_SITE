// ========================================================================
// 🦅 SANTIS OMNI-OS V18 | THE KERNEL WORKER (YERALTI BEYNİ)
// ========================================================================

self.onmessage = async (event) => {
    const { type, payload } = event.data;

    if (type === 'BOOT_SEQUENCE') {
        const targetPage = payload.page; // Örn: 'massage'

        try {
            // 1. Ağdan devasa veriyi çek (Main thread tatil yaparken biz çalışıyoruz)
            const response = await fetch('/assets/data/services.json');
            const allData = await response.json();

            // 2. Filtrelemeyi UI katmanına (Matrix Engine) bırak! 
            // V18'de sayfa bazlı çoğul gridler desteklenir (Ana sayfa birden fazla kategori barındırır).
            // Altın külçelerini (Saf Data) yüzeye (Main Thread'e) fırlat!
            self.postMessage({
                type: 'MATRIX_READY',
                payload: allData
            });

        } catch (error) {
            self.postMessage({ type: 'FATAL_ERROR', payload: error.message });
        }
    }
};
