# THE SOVEREIGN CODEX (v1.0)
**"Gerçek her zaman kazanır. Sistem öldüğünde bile onurla ölmelidir."**

Bu belge, SANTIS_SITE "Sovereign Reality Engine" için mutlak mimari haritadır. Dışarıdan gelen her elit geliştirici (Sovereign Architect) bu koda dokunmadan önce bu kuralları bilmek zorundadır.

## 1. SOVEREIGN MATRIX (Quantum Route Engine)
Sistem **Sıfır-Yükleme (Zero-Reload)** felsefesine dayanır.
* **Mekanizma:** Tıklanan linkler `santis-quantum-router.js` tarafından yakalanır. Sayfa yüklenmez, DOM içindeki `<main>` tagi cerrahi olarak (`surgicalMorph`) değiştirilir.
* **Shadow Worker:** Linklere henüz tıklanmadan, kullanıcının fare ivmesi (velocity) ölçülerek gideceği sayfa arka planda `Worker` tarafından indirilir.
* **Kronos Protokolü:** Geri dönüşlerde (Swipe Back) zaman/mekan algısını bozmamak adına `popstate` dinlenerek ters animasyon vektörleri çizdirilir.

## 2. KOGNİTİF BAĞLANTI (L4 MESH & P2P HIVE)
* **Shadow Worker (`sw.js`):** İnternet kopsa da sistem yaşar. `Asenkron Yarış Tekilleştirici (Deduplication)`, aynı URL'e giden iki paralel isteği engeller ve kopyalayarak tarayıcı çökmelerini (503) yutarak çözer.
* **Phantom Lens (Protokol Omega):** `santis_edge_worker.js` (Cloudflare) üzerinde aktif olan bu lens, gerçek insanları doğrudan SPA'ya alırken SEO botlarına statik HTML yansımaları (`mockHTML`) verir. URL asla `301/302` fırlatmaz, şeffaf proxy (200 OK) olarak çalışır.

## 3. AEGIS KILL SWITCH & GOD'S EYE (Mutlak Güvenlik)
* **AEGIS:** Bir hata (ReferenceError vb.) yaşandığında UI kırmızı ekran vermez. Hata izole edilir, donanım limitleri (Örn: 100.000 frame limiti) aşıldığında sistem kendini Vanilya (standart HTML) moduna çeker.
* **God's Eye (Optik Sinir İstihbaratı):** Gizli `Shift + S + O + V` terminali `santis.production-shield.js` içinde saklıdır. Console.log çalışmaz, hatalar 200 elemanlı "Ring Buffer" (ShadowArray) içinde döne döne saklanır. Sadece yetkili mimar, klavye kombinasyonuyla bu hataları kanlı canlı deşifre edebilir. Başkasının gözü için yoktur.

## 4. TERMİNAL BİLİNCİ (Focus Engine & Liquid Gold)
* **Focus Engine:** Kullanıcının mouse/touch verilerini okur ve DOM nesnelerine haptic nefes alma (`data-focusable`) özelliği katar.
* **Liquid Gold (Kriyo Uykusu):** WebGPU (`santis-gpu-kernel.js`) offscreen bir canvas'ta sıvı dinamiği çizer. Kullanıcı sekmeyi arkaya alırsa veya Canvas ekrandan çıkarsa, sistem otomatik dondurulur (Kriyojenik Uyku - `cancelAnimationFrame` ile). Isınma sıfırdır.

Sistem ölümsüzdür. Lütfen kodu değiştirirken Sovereign ruhuna ihanet etmeyin.
