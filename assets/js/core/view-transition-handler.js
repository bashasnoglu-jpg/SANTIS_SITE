/**
 * SANTIS OS - View Transition MPA Injector (Phase 20)
 * Prepares the DOM metadata right before cross-document navigation.
 * "Zero-Jank" Morph Engine.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Dinamik Bento Grid veya statik A tag tıklamalarını yakala
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href) return; // Sadece sayfa geçişlerinden önce çalış

        // Host/Origin farklıysa dışarı çıkıştır, animasyon yapılmaz
        if (!link.href.startsWith(window.location.origin)) return;

        // Tıklanan eleman bir servis kartı mı?
        const card = e.target.closest('.santis-card, .santis-card, .matrix-card, .bento-item, .service-link-card, .card');
        
        if (card) {
            // Önce sayfadaki eski vt-* sınıflarını temizle (Yanlış morph'u engellemek için)
            document.querySelectorAll('.vt-hero-image').forEach(el => el.classList.remove('vt-hero-image'));
            document.querySelectorAll('.vt-hero-title').forEach(el => el.classList.remove('vt-hero-title'));

            // Resim Morph Kilidi
            const img = card.querySelector('img, .cin-visual-img, .bento-image');
            if (img) {
                img.classList.add('vt-hero-image');
            }

            // Başlık Morph Kilidi
            const title = card.querySelector('h3, h2, h1, .cin-title, .bento-title, .card-title');
            if (title) {
                title.classList.add('vt-hero-title');
            }
        }
    });

    // Sayfa Geriye (Back) gelindiğinde BFCache'ten dolayı sınıflar kalabilir, temizle
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) { // Back/Forward cache'ten yüklendiyse
            document.querySelectorAll('.vt-hero-image').forEach(el => el.classList.remove('vt-hero-image'));
            document.querySelectorAll('.vt-hero-title').forEach(el => el.classList.remove('vt-hero-title'));
        }
    });
});
