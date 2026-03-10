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

            // 2. Filtrelemeyi İşlemci Çekirdeğinde (Worker) yap!
            // Main Thread'i 1 ms bile bloke etmiyoruz.
            const filteredData = allData.filter(item =>
                item.category && item.category.toLowerCase().includes(targetPage.toLowerCase())
            );

            // 3. Altın külçelerini (Saf Data) yüzeye (Main Thread'e) fırlat!
            self.postMessage({
                type: 'MATRIX_READY',
                payload: filteredData
            });

        } catch (error) {
            self.postMessage({ type: 'FATAL_ERROR', payload: error.message });
        }
    }
};
