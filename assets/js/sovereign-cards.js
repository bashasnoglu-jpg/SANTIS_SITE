document.addEventListener("DOMContentLoaded", async () => {
  // 1. 3D Kartların içine ekleneceği ana kapsayıcıyı seçin
  const cardContainer = document.getElementById("sov-3d-stage");
  
  // Eğer bu sayfada kart kapsayıcısı yoksa kodu durdur
  if (!cardContainer) return;

  try {
    // 2. Backend'den güncel medya/ritüel verilerini çek
    const response = await fetch("/api/v1/media/assets");
    
    if (!response.ok) throw new Error("Veri köprüsü kurulamadı.");
    
    const data = await response.json();
    
    const assets = Array.isArray(data) ? data : data.items;

    if (!assets || assets.length === 0) return;

    // 3. Mevcut kartları temizle (tamamen backend tabanlı dinamik render için)
    cardContainer.innerHTML = '';

    // 4. Verileri dön ve statik V45 iskeletini dinamik olarak bas
    assets.forEach((asset, index) => {
      // DİKKAT: Buradaki HTML sınıf isimlerini kendi index.html'nizdeki "Santis Stack Card" ile birebir eşleştirildi.
      const cardHTML = `
          <div class="santis-stack-card" style="background-image: url('${asset.imageUrl || '/assets/img/cards/hammam.webp'}'); filter: ${asset.filter || 'grayscale(20%) sepia(30%)'};">
              <h3 data-morph="title">${asset.title || 'Sovereign Ritüeli'}</h3>
              <span class="santis-stack-meta">${asset.meta || 'Otonom Sistem'}</span>
          
              <div class="santis-reveal-data">
                  <h2 style="font-family: 'Playfair Display', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff;">${asset.title || 'Sovereign Ritüeli'}</h2>
                  <p style="font-size: 1.2rem; color: rgba(255,255,255,0.9); line-height: 1.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                      ${asset.description || 'Sovereign Club ayrıcalıklarıyla donatılmış premium bir dokunuş hissedeceksiniz.'}
                  </p>
                  <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 50px;">
                      <div style="background: rgba(0,0,0,0.4); padding: 15px 30px; border-radius: 12px; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px);">
                          <span style="display: block; font-size: 0.8rem; color: #D4AF37; letter-spacing: 2px;">SÜRE</span>
                          <strong style="font-size: 1.3rem;">${asset.duration || '60 Dk'}</strong>
                      </div>
                      <div style="background: rgba(0,0,0,0.4); padding: 15px 30px; border-radius: 12px; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px);">
                          <span style="display: block; font-size: 0.8rem; color: #D4AF37; letter-spacing: 2px;">BÖLGE</span>
                          <strong style="font-size: 1.3rem;">${asset.region || 'Tüm Beden'}</strong>
                      </div>
                  </div>
                  <button onclick="SovereignCart.addItem('${asset.id}', '${asset.title}', 0)" class="santis-btn santis-btn-primary santis-magnetic" style="padding: 16px 40px; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(212,175,55,0.2); border:none; cursor:pointer; font-family:inherit;">
                      REZERVE ET
                  </button>
              </div>
          </div>
      `;
      
      // Kartı bozmadan DOM'a enjekte et
      cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Eğer CoverFlow animasyonları sayfa yüklendiğinde zaten çalıştıysa, 
    // yeni HTML elementleri eklediğimiz için scripti yeniden tetikliyoruz:
    if (typeof window.initCoverFlowCarousel === 'function') {
        // Eski event listener'ları temizlemek ve yeniden hesaplamak için çağırıyoruz
        window.initCoverFlowCarousel();
    }

  } catch (error) {
    console.error("Sovereign Kalkanı: 3D kart verileri bütünleştirilemedi.", error);
  }
});
