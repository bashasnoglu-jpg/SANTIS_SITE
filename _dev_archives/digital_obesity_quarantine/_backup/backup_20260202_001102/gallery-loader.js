/**
 * SANTIS GALLERY LOADER (v1.0)
 * Admin panelinden gelen veriyi (gallery-data.js) okur ve ekrana basar.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Veri Kontrolü
    if (typeof GALLERY_DATA === 'undefined') {
        console.warn("GALLERY_DATA bulunamadı. Fallback veya boş durum.");
        return;
    }

    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    // 2. Grid Temizle (Statik HTML varsa uçur)
    grid.innerHTML = '';

    // 3. Veriyi Döngüye Al ve Bas (CINEMATIC LAYOUT ENGINE v2.0)
    GALLERY_DATA.forEach((item, index) => {
        // Kategori Güvenliği
        const category = item.category || 'ambiance';
        const mood = item.mood || 'calm';

        // Element Oluştur
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.setAttribute('data-category', category);
        div.setAttribute('data-mood', mood);
        div.setAttribute('data-audio', item.audio || 'silence.mp3');

        // Layout Logic (Mood'a göre şekil ver)
        // Calm = Geniş (Wide), Mystic = Uzun (Tall), Diğerleri = Normal
        if (mood === 'calm') div.classList.add('w-2');
        if (mood === 'mystic') div.classList.add('h-2');

        // Path düzeltme
        const imgPath = `../../assets/img/gallery/${item.file}`;

        // MEDIA TYPE CHECKER (Video vs Image)
        const isVideo = item.file.toLowerCase().endsWith('.mp4') || item.file.toLowerCase().endsWith('.webm');

        let mediaHtml = '';
        if (isVideo) {
            mediaHtml = `<video src="${imgPath}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>`;
        } else {
            mediaHtml = `<img src="${imgPath}" alt="${item.caption}" loading="lazy">`;
        }

        div.innerHTML = `
            ${mediaHtml}
            <div class="gallery-overlay">
                <span class="caption-text">${item.caption}</span>
                <span class="mood-badge">${mood.toUpperCase()}</span>
            </div>
        `;

        // Click Event (Lightbox Logic for Video)
        // Click Event (Lightbox Logic)
        div.addEventListener('click', () => {
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightboxImg');
            const lightboxVideo = document.getElementById('lightboxVideo');
            const captionText = document.getElementById('caption');

            if (lightbox) {
                lightbox.style.display = "flex";
                document.body.style.overflow = "hidden";

                // Update Caption
                if (captionText) {
                    captionText.innerHTML = `
                        <div style="text-align:center">
                            <h2>${item.caption}</h2>
                            <p style="font-size:12px; color:#aaa; margin-top:5px; letter-spacing:2px;">MOOD: ${mood.toUpperCase()}</p>
                        </div>
                     `;
                }

                if (isVideo && lightboxVideo) {
                    // VIDEO MODE
                    if (lightboxImg) lightboxImg.style.display = 'none';
                    lightboxVideo.style.display = 'block';
                    lightboxVideo.src = imgPath;
                    lightboxVideo.play();
                } else if (lightboxImg) {
                    // IMAGE MODE
                    if (lightboxVideo) {
                        lightboxVideo.pause();
                        lightboxVideo.style.display = 'none';
                    }
                    lightboxImg.style.display = 'block';
                    lightboxImg.src = imgPath;
                }
            }
        });

        grid.appendChild(div);
    });

    // 4. Filtreleri Yeniden Tetikle (Eğer fonksiyon tanımlıysa)
    initFilters();
});

// Filtre Mantığı (index.html'dekini override eder veya yenisini kurar)
function initFilters() {
    const chips = document.querySelectorAll('.nv-chip');

    chips.forEach(chip => {
        // Clone element to remove old listeners if any
        const newChip = chip.cloneNode(true);
        chip.parentNode.replaceChild(newChip, chip);

        newChip.addEventListener('click', () => {
            // UI Update
            document.querySelectorAll('.nv-chip').forEach(c => c.classList.remove('is-active'));
            newChip.classList.add('is-active');

            const filter = newChip.getAttribute('data-filter');
            const items = document.querySelectorAll('.gallery-item');

            items.forEach(item => {
                const itemCat = item.getAttribute('data-category');

                // Show/Hide Logic
                if (filter === 'all' || itemCat === filter) {
                    item.style.display = 'block';
                    setTimeout(() => item.style.opacity = '1', 50);
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => item.style.display = 'none', 300);
                }
            });
        });
    });
}
