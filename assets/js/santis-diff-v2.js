/**
 * SANTIS OS - SOVEREIGN DIFF ENGINE V2 (The Quantum Scalpel)
 * O(N) Keyed Reconciliation, Hash Bail-out, Zero-Domino DOM Updater.
 * 
 * Bu Cerrahi Aracı, tarayıcının DOM elementlerini yeniden yaratmasını (Domino Yıkımı)
 * engellemek için tasarlanmıştır. "Sessiz Lüks" prensibine uygun olarak sadece 
 * değişmesi gereken özellikleri (class, data-*) ve sığ metinleri günceller.
 */

export class SantisDiffEngine {
    constructor() {
        this.version = "Sovereign 2.0";
        console.log("🦅 [Santis Diff] Kuantum Mühür (Hash Bail-out) Motoru Aktif.");
    }

    /**
     * Eski VDOM ile Yeni VDOM (DOMParser'dan gelen) ağacını eşitler.
     * @param {HTMLElement} oldContainer Mevcut (Canlı) Liste Kapsayıcısı
     * @param {HTMLElement} newContainer Virtual DOM (DOMParser) Liste Kapsayıcısı
     */
    patchContainer(oldContainer, newContainer) {
        if (!oldContainer || !newContainer) return;

        // Kuantum Haritalandırması (Eski Aile Ağacı)
        const oldChildren = Array.from(oldContainer.children);
        const newChildren = Array.from(newContainer.children);

        const oldMap = new Map();

        // 1. HARİTA OLUŞTUR
        // O(N) zamanda tüm eski düğümleri anahtarlarıyla (data-key) kaydet
        oldChildren.forEach(node => {
            const key = node.getAttribute('data-key');
            if (key) {
                oldMap.set(key, node);
            } else {
                console.warn("[Santis Diff] Kritik Hata: 'data-key' bulunmayan Sovereign Card tespit edildi:", node);
            }
        });

        // 2. AVLANMA VE TAŞIMA (The Hunt & Move)
        // Yeni listedeki sıraya göre eski düğümleri bulup doğru sıraya oturt
        newChildren.forEach((newNode, index) => {
            const key = newNode.getAttribute('data-key');
            if (!key) return;

            // Haritada VARSA (Mevcut Kart)
            if (oldMap.has(key)) {
                const oldNode = oldMap.get(key);

                // --- AŞAMA 1: KUANTUM MÜHRÜ (Hash Bail-out) ---
                const oldHash = oldNode.getAttribute('data-hash');
                const newHash = newNode.getAttribute('data-hash');

                // Eğer Hash değişmişse (veya yoksa), içini yama (Aşama 2 & 3)
                if (!oldHash || !newHash || oldHash !== newHash) {
                    this.patchAttributes(oldNode, newNode);
                    this.patchShallowText(oldNode, newNode);
                }

                // Node sırasını koru veya DOM'da yeniden konumlandır (InsertBefore)
                // Bu operasyon "Move" (Taşıma) olduğu için çok ucuzdur. Yeniden Render (Paint) gerektirmez.
                if (oldContainer.children[index] !== oldNode) {
                    oldContainer.insertBefore(oldNode, oldContainer.children[index]);
                }

                // Yok edilmemesi için haritadan çıkar (Kurtarılanlar)
                oldMap.delete(key);
            }
            // Haritada YOKSA (Yepyeni Kart)
            else {
                // DOMParser'dan gelen saf düğümü (cloneNode ile temizleyip) mevcut listeye tak
                const insertedNode = newNode.cloneNode(true);
                if (index < oldContainer.children.length) {
                    oldContainer.insertBefore(insertedNode, oldContainer.children[index]);
                } else {
                    oldContainer.appendChild(insertedNode);
                }
            }
        });

        // 3. TEMİZLİK (The Purge)
        // Haritada hala kalan düğümler varsa, bunlar yeni menüde artık YOK demektir! Cımbızla çek.
        oldMap.forEach(obsoleteNode => {
            oldContainer.removeChild(obsoleteNode);
        });
    }

    /**
     * Sadece hedefli Dış Kabuk (Attributes) yamaması.
     * class, data-effect, data-aura gibi GPU'yu ve stili tetikleyen özellikleri eşitler.
     */
    patchAttributes(oldNode, newNode) {
        const newAttrs = Array.from(newNode.attributes);
        const oldAttrs = Array.from(oldNode.attributes);

        // Yeni özellikleri ekle veya güncelle
        newAttrs.forEach(attr => {
            if (oldNode.getAttribute(attr.name) !== attr.value) {
                oldNode.setAttribute(attr.name, attr.value);
            }
        });

        // Eskisinde kalan ama yenisinde çöpe gitmiş özellikleri sil
        oldAttrs.forEach(attr => {
            if (!newNode.hasAttribute(attr.name)) {
                oldNode.removeAttribute(attr.name);
            }
        });
    }

    /**
     * Sığ Metin Taraması (Shallow Text Diffing)
     * Alt elementlerin iskeletine dokunmadan sadece "Düz Metin" (textContent) değişimlerini mühürler.
     */
    patchShallowText(oldNode, newNode) {
        // En basit ve agresif yöntem: Tüm innerHTML'i kopyala.
        // Daha modüler mimari için (sadece Text Node taraması), ilerde burası optimize edilebilir.
        // "Sessiz Lüks" vizyonunda kartların iskeleti genelde bozulmaz, sadece iç metinler (fiyat, başlık) değişir.

        // Eğer karmaşık bir iç yapı varsa, içindeki (data-text) özellikli düğümleri bulup yama:
        const oldTexts = oldNode.querySelectorAll('[data-text]');
        const newTexts = newNode.querySelectorAll('[data-text]');

        if (oldTexts.length > 0 && newTexts.length > 0 && oldTexts.length === newTexts.length) {
            oldTexts.forEach((el, i) => {
                if (el.textContent !== newTexts[i].textContent) {
                    el.textContent = newTexts[i].textContent;
                }
            });
        } else {
            // Eğer yapı kökten değişmişse Balyoz Yöntemi (Sadece bu kartı feda et):
            if (oldNode.innerHTML !== newNode.innerHTML) {
                oldNode.innerHTML = newNode.innerHTML;
            }
        }
    }
}

window.SantisDiffEngine = SantisDiffEngine;
