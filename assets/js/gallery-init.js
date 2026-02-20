/* ==========================================================================
   SANTIS GALLERY INIT v1.0
   Extracted from tr/galeri/index.html inline scripts (Phase 7B CSP cleanup).
   Handles: SITE_ROOT config, navbar/footer loader, filter chips, lightbox.
   ========================================================================== */

// 1. DYNAMIC ROOT DEFINITION
window.SITE_ROOT = '/';

// 2. NAVBAR & FOOTER LOADER
const navPath = '/components/navbar.html';
const footPath = '/components/footer.html';

document.addEventListener("DOMContentLoaded", () => {

    // Load nav + footer components
    if (typeof loadComp === "function") {
        if (document.getElementById("navbar-container")) loadComp(navPath, "navbar-container");
        if (document.getElementById("footer-container")) loadComp(footPath, "footer-container");
    }

    // 3. FILTER CHIP LOGIC
    const chips = document.querySelectorAll('.nv-chip');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('is-active'));
            chip.classList.add('is-active');
            const filter = chip.getAttribute('data-filter');

            const items = document.querySelectorAll('.gallery-item');
            items.forEach(item => {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.style.display = 'block';
                    setTimeout(() => item.style.opacity = '1', 50);
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => item.style.display = 'none', 300);
                }
            });
        });
    });

    // 4. LIGHTBOX CLOSURE LOGIC
    const lightbox = document.getElementById('lightbox');
    const lightboxVideo = document.getElementById('lightboxVideo');
    const closeBtn = document.querySelector('.lightbox-close');

    const closeLightbox = () => {
        lightbox.style.display = "none";
        document.body.style.overflow = "auto";
        if (lightboxVideo) {
            lightboxVideo.pause();
            lightboxVideo.currentTime = 0;
            lightboxVideo.style.display = 'none';
        }
        const img = document.getElementById('lightboxImg');
        if (img) img.style.display = 'block';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") closeLightbox();
    });

});
