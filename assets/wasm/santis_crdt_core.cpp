/**
 * ==============================================================================
 * SANTIS SDCR - WASM DELTA-SYNC KERNEL (C++17)
 * ==============================================================================
 * Mimar: SANTIS Karargâh Yüksek Komutası
 * Doktrin: Sıfır-JSON, Mutlak Matematik, Otonom Çatışma Çözümü (Lamport Clocks)
 * İşlev: P2P ağından (WebRTC) gelen zaman yöneylerini kıyaslar ve Mutlak Doğruyu hesaplar.
 * ==============================================================================
 */

#include <stdint.h>

extern "C" {
    // V8 GC'sini uyandırmamak için dinamik bellek tahsisi (new/malloc) KESİNLİKLE YASAKTIR.
    // WebAssembly ile JS'in ortak kullanacağı 64KB Sabit Kuantum Bellek Havuzu (Linear Memory)
    uint8_t memory_arena[65536];

    // JS'in fısıltıları doğrudan RAM'e yazabilmesi için hafıza adresini dışa aç (Pointer)
    uint8_t* get_memory_pointer() {
        return memory_arena;
    }

    /**
     * THE ARBITRATOR (Çatışma Çözücü)
     * İki yönetici aynı anda aynı veriyi değiştirirse kim kazanır?
     * 
     * @param local_tick: Bu cihazın Zaman Yöneyi (Vector Clock)
     * @param local_node_id: Bu cihazın Kimlik Hash'i (Örn: L5 = 5, L1 = 1)
     * @param incoming_tick: Gelen paketin (Diğer yöneticinin) Zaman Yöneyi
     * @param incoming_node_id: Gelen yöneticinin Kimlik Hash'i
     * @return 1: Kabul (Gelen Fısıltı Kazanır / OVERRIDE), 0: Reddet (Yerel Gerçeklik Korunur / REJECT)
     */
    int resolve_conflict(uint32_t local_tick, uint32_t local_node_id, uint32_t incoming_tick, uint32_t incoming_node_id) {
        // SANTIS ANAYASASI 1. MADDE: "Zaman kimden yanaysa, hakikat onundur."
        if (incoming_tick > local_tick) {
            return 1; // OVERRIDE: Karşı tarafın verisi daha yeni. Yereli ez.
        } 
        // SANTIS ANAYASASI 2. MADDE: "Aynı milisaniyede çarpışan kılıçları, hiyerarşi böler."
        else if (incoming_tick == local_tick) {
            // TIE-BREAKER: Aynı milisaniyede mutasyon. Rütbesi (Node ID / Clearance) yüksek olan kazanır.
            if (incoming_node_id > local_node_id) {
                return 1; // Üst yöneticinin mutasyonu geçerlidir.
            }
        }
        
        // Gelen veri geçmişten (Stale Data) geliyorsa veya hiyerarşide yenildiyse reddet.
        return 0; // REJECT
    }
}
