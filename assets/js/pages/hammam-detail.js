/**
 * HAMMAM DETAIL PAGE LOGIC
 * - Handles visual effects (Parallax, Sticky)
 * - Manages Accordions
 * - Does NOT fetch data (Data is static/SSR)
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("🛁 Hamam Detail Logic Loaded");

    // 1. Initialize Lenis (Smooth Scroll)
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.0, // Reduced from 1.2 for snappier feel
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 2.5, // Increased from 1 to make scrolling easier
            smoothTouch: false, // Ensure native feel on touch
            touchMultiplier: 2,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        console.log("🌀 Lenis initialized (Hamam Mode)");
    }

    // 2. Parallax Hero Image
    const heroImg = document.querySelector('.cin-visual-img');
    const contentStage = document.querySelector('.cin-content-stage');

    // 2. Parallax & Gallery Loader
    const heroImgs = document.querySelectorAll('.cin-visual-img');

    if (heroImgs.length > 0) {
        // Staggered Fade In
        heroImgs.forEach((img, index) => {
            setTimeout(() => {
                img.style.opacity = '1';
                img.style.transform = 'scale(1)';
            }, 100 + (index * 200));
        });

        // Simple Parallax for Main Image
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            if (scrolled < window.innerHeight && heroImgs[0]) {
                heroImgs[0].style.transform = `scale(${1 + scrolled * 0.0001}) translateY(${scrolled * 0.05}px)`;
            }
        });
    }

    // 3. Accordion Logic (FAQ / Steps)
    const accordions = document.querySelectorAll('.nv-accordion-item');
    accordions.forEach(acc => {
        const header = acc.querySelector('.nv-accordion-header');
        header.addEventListener('click', () => {
            const isActive = acc.classList.contains('active');

            // Close all others (optional - can be removed for multi-open)
            accordions.forEach(item => {
                if (item !== acc) item.classList.remove('active');
            });

            if (isActive) {
                acc.classList.remove('active');
            } else {
                acc.classList.add('active');
            }
        });
    });

    // 4. Booking Button (WhatsApp)
    const bookBtn = document.getElementById('btn-whatsapp');
    if (bookBtn) {
        bookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Open Santis Booking Modal or WhatsApp
            if (typeof openBookingModal === 'function') {
                openBookingModal();
            } else {
                window.location.href = "/tr/rezervasyon/index.html";
            }
        });
    }

    // 5. Init Nuclear Cards for "Related"
    if (typeof initNuclearCards === 'function') {
        // Find current ID from meta or body
        const currentServiceId = document.body.getAttribute('data-service-id');
        if (currentServiceId) {
            initNuclearCards({
                containerId: 'related-rituals',
                filterHelper: (item) => {
                    return item.categoryId === 'ritual-hammam' && item.id !== currentServiceId;
                },
                limit: 3
            });
        }
    }


    // 6. Lightbox Logic
    const lightbox = document.createElement('div');
    lightbox.id = 'cin-lightbox';
    const lbImg = document.createElement('img');
    lightbox.appendChild(lbImg);
    document.body.appendChild(lightbox);

    setTimeout(() => {
        const zoomables = document.querySelectorAll('.cin-visual-img, .cin-inline-img');
        zoomables.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                if (img.src) {
                    lbImg.src = img.src;
                    lightbox.classList.add('active');
                }
            });
        });
    }, 1000);

    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });
});
