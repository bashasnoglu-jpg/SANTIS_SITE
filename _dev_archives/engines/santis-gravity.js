/**
 * SANTIS GRAVITY JS (PROTOCOL 28)
 * Zero-Gravity Scroll + Blur-Up + Lazy Injection + RAM Caching
 */

// Helper: requestAnimationFrame Throttle to prevent main thread blocking
const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
        if (!ticking) {
            requestAnimationFrame(() => {
                fn(...args);
                ticking = false;
            });
            ticking = true;
        }
    };
};

// 1. ZIRHLI CANVAS SCROLL (Frame Caching ile Sifir Gecikme)
const initCanvasHero = () => {
    const canvas = document.querySelector('[data-canvas-hero]');
    if (!canvas) return;

    // Disable alpha for performance if canvas is fully opaque
    const ctx = canvas.getContext('2d', { alpha: false });
    const rawSeq = canvas.dataset.canvasSeq;
    if (!rawSeq) return;

    const framesUrls = rawSeq.split(',');
    const totalFrames = framesUrls.length;
    if (totalFrames === 0) return;

    // Frame Cache
    const frameCache = new Array(totalFrames);

    // Arka planda indirmeyi baslat
    const preloadFrames = () => {
        // Protocol 26: requestIdleCallback kullanarak ana thread'i yormayiz
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => doPreload());
        } else {
            setTimeout(doPreload, 200);
        }
    };

    const doPreload = () => {
        framesUrls.forEach((url, index) => {
            const img = new Image();
            img.src = url;
            frameCache[index] = img;
        });
    };

    const drawFrame = (index) => {
        const img = frameCache[index];
        // Sadece resim tamamen RAM'e indiyse ciz
        if (img && img.complete) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
    };

    const onScroll = rafThrottle(() => {
        const scrollY = window.scrollY;
        // Hero alaninin yuzde kacini scroll ettik?
        const maxScroll = canvas.offsetHeight * 1.5;
        const scrollFraction = Math.max(0, Math.min(scrollY / maxScroll, 1));

        const frameIndex = Math.min(
            totalFrames - 1,
            Math.floor(scrollFraction * totalFrames)
        );

        drawFrame(frameIndex);
    });

    // Baslatiyoruz
    preloadFrames();

    const firstFrame = new Image();
    firstFrame.src = framesUrls[0];
    firstFrame.onload = () => {
        ctx.drawImage(firstFrame, 0, 0, canvas.width, canvas.height);
    };

    // Passive event listener (Tarayiciyi kilitlemez)
    window.addEventListener('scroll', onScroll, { passive: true });
};

// 2. THE OBSIDIAN BLUR-UP (Progressive Luks Yukleme)
const initBlurUp = () => {
    document.querySelectorAll('.santis-blur-wrap').forEach((el) => {
        const highResUrl = el.dataset.src;
        if (!highResUrl) return;

        const highRes = new Image();
        highRes.src = highResUrl;
        highRes.onload = () => {
            el.style.backgroundImage = `url(${highRes.src})`;
            el.classList.add('loaded'); // CSS opacity transition tetikler
        };
    });
};

// 3. SENTINEL LAZY INJECTOR (DOM Izolasyonu)
const initLazyInjector = () => {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const tmpl = entry.target.querySelector('template');
                    if (tmpl) {
                        entry.target.appendChild(tmpl.content);
                        observer.unobserve(entry.target);
                    }
                }
            });
        },
        { rootMargin: '300px' } // 300px onceden tetikle
    );

    document.querySelectorAll('.santis-lazy').forEach((el) => observer.observe(el));
};

// Otonom Baslatma
document.addEventListener('DOMContentLoaded', () => {
    initCanvasHero();
    initBlurUp();
    initLazyInjector();
});
