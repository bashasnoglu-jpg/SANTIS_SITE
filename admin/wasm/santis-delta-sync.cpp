/**
 * ==============================================================================
 * 🧬 SANTIS SDCR - SOVEREIGN WASM DELTA-SYNC ENGINE
 * ==============================================================================
 * Dil: C++ (WebAssembly hedefine derlenir)
 * Derleme Komutu: 
 *   emcc santis-delta-sync.cpp -O3 -s WASM=1 -s EXPORTED_FUNCTIONS="['_init_matrix', '_mutate_entity', '_apply_peer_delta', '_get_entity_state']" -o santis-delta-sync.wasm --no-entry
 * ==============================================================================
 * Amaç: JS JSON.parse() ve Obje zincirlerini tamamen yok etmek. 
 * İki yönetici aynı anda bir rezervasyon saatini/notunu değiştirirse,
 * "CRDT (Conflict-free Replicated Data Type)" Last-Write-Wins (LWW) 
 * algoritmasına göre Vektör Saatlerini (Vector Clocks) C++ bellek havuzunda birleştirir.
 * ==============================================================================
 */

#include <stdint.h>

extern "C" {

    #define MAX_ENTITIES 1024
    #define ENTITY_STATE_SIZE 256

    // WASM Bellek Havuzu (JS tarafından Uint8Array ile doğrudan okunabilir)
    // Garbage Collector buraya ASLA dokunamaz (Zero-GC Vault).
    uint8_t memory_pool[MAX_ENTITIES * ENTITY_STATE_SIZE];
    uint32_t vector_clocks[MAX_ENTITIES];

    void init_matrix() {
        for(int i=0; i < MAX_ENTITIES; i++) {
            vector_clocks[i] = 0;
            for(int j=0; j < ENTITY_STATE_SIZE; j++) {
                memory_pool[(i * ENTITY_STATE_SIZE) + j] = 0;
            }
        }
    }

    /**
     * Yerel (Local) yöneticinin UI üzerinden yaptığı mutasyon
     * @return 1 (Başarılı), -1 (Hata)
     */
    int mutate_entity(int entity_id, int offset, uint8_t new_value, uint32_t current_tick) {
        if (entity_id >= MAX_ENTITIES || offset >= ENTITY_STATE_SIZE) return -1;
        
        // Bellek adresine bit düzeyinde (Uint8) müdahale
        memory_pool[(entity_id * ENTITY_STATE_SIZE) + offset] = new_value;
        vector_clocks[entity_id] = current_tick;
        
        return 1;
    }

    /**
     * Kovan Ağından (P2P WebRTC / WebTransport) gelen Fısıltının C++ tarafından birleştirilmesi.
     * @return 1 (Merge edildi), 0 (Eski Veri, Reddedildi), -1 (Hata)
     */
    int apply_peer_delta(int entity_id, int offset, uint8_t peer_value, uint32_t peer_tick) {
        if (entity_id >= MAX_ENTITIES || offset >= ENTITY_STATE_SIZE) return -1;
        
        uint32_t local_tick = vector_clocks[entity_id];
        int memory_address = (entity_id * ENTITY_STATE_SIZE) + offset;
        
        // 1. ZAMAN YÖNEYİ GALİBİYETİ (Peer daha güncel)
        if (peer_tick > local_tick) {
            memory_pool[memory_address] = peer_value;
            vector_clocks[entity_id] = peer_tick;
            return 1;
        } 
        // 2. ÇATIŞMA (Conflict TIE) - Her ikisi de MS düzeyinde aynı anda değiştirdi
        else if (peer_tick == local_tick) {
            // LWW (Last-Write-Wins / Deterministic Tie-Breaker): En yüksek ASCI değeri / Bit kazanır
            uint8_t local_value = memory_pool[memory_address];
            if (peer_value > local_value) {
                memory_pool[memory_address] = peer_value;
                return 1;
            }
        }
        
        // 3. Peer'in yolladığı veri bayat (Stale). C++ belleği muhafaza edildi.
        return 0; 
    }

    /**
     * JS Main Thread'inin saniyede 60 kez UI'ı güncellemek için çektiği bellek işaretçisi (Pointer)
     */
    uint8_t* get_entity_state(int entity_id) {
        if (entity_id >= MAX_ENTITIES) return 0;
        return &memory_pool[entity_id * ENTITY_STATE_SIZE];
    }
}
