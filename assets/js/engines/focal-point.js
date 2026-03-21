/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🖼️ SANTIS FOCAL POINT JS ENGINE v1.0                     ║
 * ║  data-focal attribute → CSS --focal-x / --focal-y          ║
 * ║  Responsive object-position · LCP above-fold preload       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * HTML kullanım:
 *   <img data-focal="0.45 0.20" class="bento-card-media" .../>
 *   → object-position: 45% 20%
 *
 *   <img data-focal-x="35" data-focal-y="15" .../>
 *   → object-position: 35% 15%
 *
 * motion-guard.js'den sonra, DOMContentLoaded'da çağrılır.
 */

/* ── 1. FOCAL POINT UYGULAYICI ───────────────────────────────────────────── */
function applyFocalPoint(img) {
    // Format 1: data-focal="0.45 0.20" (normalize 0–1)
    if (img.dataset.focal) {
        const parts = img.dataset.focal.trim().split(/\s+/);
        if (parts.length >= 2) {
            const x = (parseFloat(parts[0]) * 100).toFixed(1) + '%';
            const y = (parseFloat(parts[1]) * 100).toFixed(1) + '%';
            img.style.setProperty('--focal-x', x);
            img.style.setProperty('--focal-y', y);
            return;
        }
    }

    // Format 2: data-focal-x="35" data-focal-y="15" (direkt %)
    if (img.dataset.focalX !== undefined) {
        img.style.setProperty('--focal-x', img.dataset.focalX + '%');
    }
    if (img.dataset.focalY !== undefined) {
        img.style.setProperty('--focal-y', img.dataset.focalY + '%');
    }
}

/* ── 2. TOPLU UYGULAMA ───────────────────────────────────────────────────── */
export function initFocalPoints(root = document) {
    const imgs = root.querySelectorAll('[data-focal], [data-focal-x], [data-focal-y]');
    imgs.forEach(applyFocalPoint);
    console.log(`[FocalPoint] ${imgs.length} görsel için odak noktası uygulandı.`);
}

/* ── 3. MUTATİON OBSERVER — Dinamik kartlar için ─────────────────────────── */
export function watchFocalPoints(root = document.body) {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                // Eklenen node'un kendisi mi?
                if (node.matches?.('[data-focal],[data-focal-x],[data-focal-y]')) {
                    applyFocalPoint(node);
                }
                // İçindeki görseller
                node.querySelectorAll?.('[data-focal],[data-focal-x],[data-focal-y]')
                    .forEach(applyFocalPoint);
            });
        });
    });
    observer.observe(root, { childList: true, subtree: true });
    return observer;
}

/* ── 4. LCP: Above-the-fold görselleri preload ekle ─────────────────────── */
/**
 * Hero kartı görseli için dinamik <link rel="preload"> ekler.
 * Sayfa başında çağrılan statik preload'a ek olarak JS fallback.
 * @param {string} selector - Hero görsel seçici
 */
export function preloadHeroImage(selector = '.cin-visual-img, [data-lcp]') {
    const hero = document.querySelector(selector);
    if (!hero?.src) return;

    // Zaten preload var mı?
    const existing = document.querySelector(`link[rel="preload"][href="${hero.src}"]`);
    if (existing) return;

    const link    = document.createElement('link');
    link.rel      = 'preload';
    link.as       = 'image';
    link.href     = hero.src;
    link.setAttribute('fetchpriority', 'high');
    document.head.prepend(link); // <head>'in en başına
    console.log('[FocalPoint] LCP preload eklendi:', hero.src);
}

/* ── 5. RESPONSIVE BREAKPOINT GÖZLEMCİSİ ────────────────────────────────── */
/**
 * Ekran boyutu değişince focal-point'leri yeniden hesapla.
 * (CSS zaten responsive ama bazı kartlarda override gerekebilir)
 */
export function refreshOnResize() {
    let rafId;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => initFocalPoints());
    }, { passive: true });
}
