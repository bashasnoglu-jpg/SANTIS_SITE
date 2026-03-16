/**
 * SANTIS CINEMATIC DETAIL CONTROLLER v1.0
 * Handles the "Quiet Luxury" scrolling experience, visual stickiness, and interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
    initCinematicExperience();
});

function initCinematicExperience() {
    console.log("💎 Cinematic Experience Initialized");

    // 1. Init Accordion
    if (window.SantisAccordion) {
        window.SantisAccordion.init({ mode: 'single' });
    }

    // 2. Scroll Animations (Reveal on Scroll)
    initScrollReveal();

    // 3. Lightbox Logic
    initLightbox();

    // 4. Parallax Effect for Visual Stage (Desktop Only)
    // Note: CSS position:fixed handles the main stickiness on desktop. 
    // JS adds subtle parallax or opacity changes if desired.
    if (window.innerWidth > 1024) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const visual = document.querySelector('.cin-visual-img');
            if (visual) {
                // Subtle slow-motion scroll for the image inside the fixed container
                visual.style.transform = `translateY(${scrolled * 0.05}px) scale(${1 + scrolled * 0.0005})`;
            }
        }, { passive: true });
    }
}

function initScrollReveal() {
    const targets = document.querySelectorAll('.cin-title, .cin-desc, .cin-meta-grid, .cin-quote, .cin-inline-visual, .nv-accordion, .cin-actions');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('cin-reveal-active');
                observer.unobserve(entry.target); // Reveal once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before element is fully in view
    });

    targets.forEach(target => {
        target.classList.add('cin-reveal-init'); // Add CSS class to set initial opacity 0
        observer.observe(target);
    });
}

function initLightbox() {
    const images = document.querySelectorAll('.cin-inline-img');
    const lightbox = document.getElementById('cin-lightbox');
    const lbImg = lightbox ? lightbox.querySelector('img') : null;

    if (!lightbox || !lbImg) return;

    // Open
    images.forEach(img => {
        img.addEventListener('click', () => {
            lbImg.src = img.src;
            lightbox.classList.add('active');
            document.body.classList.add('no-scroll');
        });
    });

    // Close
    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
        document.body.classList.remove('no-scroll');
    });
}
