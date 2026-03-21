/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🎭 SANTIS MOTION GUARD v1.0                               ║
 * ║  Küresel Hareket Azaltma (Reduced-Motion) Sarmalayıcısı    ║
 * ║  + GPU will-change Dinamik Yönetimi                        ║
 * ║  + content-visibility: auto Viewport Kapsülleme            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Referans: WCAG 2.1 §2.3.3 (AAA) — Animasyon erişilebilirliği
 * Kernel: SantisEventBus.emit('motion:preference', { reduced: bool })
 */

// ── 1. REDUCED MOTION SENTINEL ────────────────────────────────────────────────
const MOTION_QUERY = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Kullanıcının hareket tercihini döndürür
 * @returns {boolean} true = hareket azaltılsın
 */
export const prefersReducedMotion = () => MOTION_QUERY.matches;

/**
 * gsap.matchMedia() alternatifi — GSAP bağımlılığı olmadan
 * Hem CSS sınıfı hem JS callback ile çalışır
 * @param {{ full?: Function, reduced?: Function }} handlers
 * @returns {() => void} cleanup fonksiyonu
 */
export function motionGuard({ full = () => {}, reduced = () => {} } = {}) {
    const apply = (query) => {
        if (query.matches) {
            document.documentElement.classList.add('motion-reduced');
            document.documentElement.classList.remove('motion-full');
            reduced();
            console.log('[MotionGuard] ⚠️ Reduced-motion aktif. Ağır animasyonlar devre dışı.');
        } else {
            document.documentElement.classList.add('motion-full');
            document.documentElement.classList.remove('motion-reduced');
            full();
            console.log('[MotionGuard] ✅ Full-motion aktif. GPU animasyonlar etkin.');
        }

        // Kernel EventBus'a sinyal
        const bus = globalThis.__SANTIS__?.services?.bus ?? window.SantisEventBus;
        bus?.emit('motion:preference', { reduced: query.matches });
    };

    apply(MOTION_QUERY);
    MOTION_QUERY.addEventListener('change', apply);

    // Cleanup döndür
    return () => MOTION_QUERY.removeEventListener('change', apply);
}

// ── 2. GPU WILL-CHANGE DİNAMİK YÖNETİMİ ─────────────────────────────────────
/**
 * YANLIŞ: CSS'de statik `will-change: transform` → GPU bellek sızıntısı
 * DOĞRU: Animasyon/hover başında ekle, bitince kaldır
 *
 * @param {HTMLElement | NodeList | string} target
 */
export function bindWillChange(target) {
    const elements = resolveTarget(target);

    elements.forEach(el => {
        if (el.dataset.willChangeBound === 'true') return;
        el.dataset.willChangeBound = 'true';

        const enable  = () => { el.style.willChange = 'transform';  };
        const disable = () => { el.style.willChange = 'auto'; };

        el.addEventListener('mouseenter',  enable,  { passive: true });
        el.addEventListener('mouseleave',  disable, { passive: true });
        el.addEventListener('touchstart',  enable,  { passive: true });
        el.addEventListener('touchend',    disable, { passive: true });
        el.addEventListener('animationstart', enable);
        el.addEventListener('animationend',   disable);
        el.addEventListener('transitionend',  disable, { passive: true });
    });
}

// ── 3. CONTENT VISIBILITY AUTO (Viewport Kapsülleme) ─────────────────────────
/**
 * Viewport dışındaki elementlerin render'ını ertele
 * → CLS riski olmadan %60'a kadar render süresi azalır
 * @param {string} selector - Uygulanacak elementler
 * @param {{ containIntrinsicSize?: string }} options
 */
export function applyContentVisibility(selector = '.bento-card, .svc-card', options = {}) {
    const { containIntrinsicSize = '0 400px' } = options;

    // prefers-reduced-motion'da content-visibility daha da önemli
    const style = document.createElement('style');
    style.id    = 'santis-cv-auto';
    style.textContent = `
        ${selector} {
            content-visibility: auto;
            contain-intrinsic-size: ${containIntrinsicSize};
            contain: layout paint style;
        }
    `;

    // Duplicate kontrolü
    if (!document.getElementById('santis-cv-auto')) {
        document.head.appendChild(style);
        console.log(`[MotionGuard] 📦 content-visibility:auto → ${selector}`);
    }
}

// ── 4. TOPLU BAŞLATICI ────────────────────────────────────────────────────────
/**
 * Tüm MotionGuard sistemlerini tek çağrıyla başlat
 * Kernel'den çağrılır: resolveModule('interaction') → initMotionGuard()
 */
export function initMotionGuard() {
    // Reduced motion handler
    motionGuard({
        full:    () => bindWillChange('.bento-card-v7, .bento-card-v6, .santis-card'),
        reduced: () => {
            // Ağır animasyonları CSS sınıfıyla sustur
            document.querySelectorAll('[data-will-change-bound]').forEach(el => {
                el.style.willChange = 'auto';
                el.removeAttribute('data-will-change-bound');
            });
        }
    });

    // Viewport kapsülleme
    applyContentVisibility('.bento-card, .bento-card-v6, .bento-card-v7, .svc-card, .santis-card', {
        containIntrinsicSize: '0 360px'
    });

    console.log('[MotionGuard v1.0] ✅ GPU will-change + content-visibility + motion guard aktif.');
}

// ── Helper ────────────────────────────────────────────────────────────────────
function resolveTarget(target) {
    if (typeof target === 'string')         return [...document.querySelectorAll(target)];
    if (target instanceof NodeList)         return [...target];
    if (target instanceof HTMLElement)      return [target];
    if (Array.isArray(target))              return target;
    return [];
}
