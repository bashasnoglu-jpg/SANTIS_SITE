/**
 * SANTIS CLUB - HOME PRODUCTS RENDERER
 * Ana sayfadaki "The Digital Atelier" bölümünü doldurur.
 * Kaynak: assets/js/product-data.js (productCatalog)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Veri Kontrolü
    if (typeof productCatalog === "undefined" || !Array.isArray(productCatalog)) {
        console.warn("[HomeProducts] productCatalog bulunamadı. Lütfen product-data.js dosyasının yüklendiğinden emin olun.");
        return;
    }

    // 2. Hedef Element Kontrolü
    const grid = document.getElementById("productsGrid");
    if (!grid) {
        // Eğer grid yoksa sessizce çık (Belki başka sayfadayız)
        return;
    }

    // 3. Render İşlemi (İlk 4 Ürün)
    const featuredProducts = productCatalog.slice(0, 4);

    // Temizle
    grid.innerHTML = "";

    featuredProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "prod-card-v2";
        card.dataset.id = product.id;

        const imgPath = `assets/img/cards/${product.img}`;

        // Handle badge if data exists (home products usually don't have explicit tier/badge logic in data, but we can verify)
        // product.cat might be used

        card.innerHTML = `
            <div class="prod-img-box">
                <img src="${imgPath}" alt="${product.name}" loading="lazy" width="300" height="300">
                <div class="quick-actions">
                    <button class="qa-btn">Hızlı Bakış</button>
                </div>
            </div>
            <div class="prod-details">
                <span class="prod-cat">${product.cat || 'Santis Atelier'}</span>
                <h4>${product.name}</h4>
                <p class="prod-desc" style="display:none;">${product.desc || ''}</p> 
                <div class="prod-bottom">
                    <span class="prod-price">${product.price === 'Bilgi Al' ? 'İncele' : product.price + '₺'}</span>
                    <a href="tr/urunler/detay.html?id=${product.id}" class="prod-btn">İncele</a>
                </div>
            </div>
        `;

        // Click delegation handles Quick View via class qa-btn

        grid.appendChild(card);
    });

    console.log(`[HomeProducts] ${featuredProducts.length} ürün ana sayfaya eklendi.`);
});
