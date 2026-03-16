/**
 * SMART CTA ENGINE v1.0 — Conversion Optimization
 * Dynamic CTA behavior based on time, language, scroll depth, and return visits.
 *
 * Features:
 *   - Time-based CTA text (evening → "Akşam Ritüeli Planla")
 *   - Language-aware CTA (RU → "VIP Private Hammam")
 *   - Scroll-depth floating CTA trigger (60%)
 *   - Return visitor detection via localStorage
 *   - Smooth reveal animations
 */

(function () {
    'use strict';

    // ──────────────── CONFIG ────────────────
    const CONFIG = {
        scrollThreshold: 0.6, // 60% scroll triggers floating CTA
        floatingDelay: 2000,  // ms before floating CTA can appear
        cookieKey: 'nv_visitor',
        ctaSelector: '[data-smart-cta]',
        floatingId: 'nv-floating-cta'
    };

    // ──────────────── CTA TEXT MATRIX ────────────────
    const CTA_MATRIX = {
        tr: {
            morning: { text: 'Güne Ritüelle Başla', icon: '☀️' },
            afternoon: { text: 'Deneyimi Planla', icon: '🌿' },
            evening: { text: 'Akşam Ritüeli Planla', icon: '🌙' },
            returning: { text: 'Tekrar Hoş Geldiniz — Ritüelinizi Seçin', icon: '✨' }
        },
        en: {
            morning: { text: 'Start Your Day with a Ritual', icon: '☀️' },
            afternoon: { text: 'Plan Your Experience', icon: '🌿' },
            evening: { text: 'Book an Evening Ritual', icon: '🌙' },
            returning: { text: 'Welcome Back — Choose Your Ritual', icon: '✨' }
        },
        de: {
            morning: { text: 'Starten Sie den Tag mit einem Ritual', icon: '☀️' },
            afternoon: { text: 'Planen Sie Ihr Erlebnis', icon: '🌿' },
            evening: { text: 'Abend-Ritual buchen', icon: '🌙' },
            returning: { text: 'Willkommen zurück — Wählen Sie Ihr Ritual', icon: '✨' }
        },
        fr: {
            morning: { text: 'Commencez la journée par un rituel', icon: '☀️' },
            afternoon: { text: 'Planifiez votre expérience', icon: '🌿' },
            evening: { text: 'Réservez un rituel du soir', icon: '🌙' },
            returning: { text: 'Bienvenue — Choisissez votre rituel', icon: '✨' }
        },
        ru: {
            morning: { text: 'Начните день с ритуала', icon: '☀️' },
            afternoon: { text: 'VIP Private Hammam', icon: '🏛️' },
            evening: { text: 'Забронировать вечерний ритуал', icon: '🌙' },
            returning: { text: 'С возвращением — выберите ритуал', icon: '✨' }
        }
    };

    // ──────────────── UTILITIES ────────────────

    function detectLang() {
        const path = window.location.pathname;
        const match = path.match(/^\/(tr|en|de|fr|ru)\//);
        return match ? match[1] : 'en';
    }

    function getTimeSlot() {
        const h = new Date().getHours();
        if (h >= 6 && h < 12) return 'morning';
        if (h >= 12 && h < 18) return 'afternoon';
        return 'evening';
    }

    function isReturningVisitor() {
        const visited = localStorage.getItem(CONFIG.cookieKey);
        if (visited) return true;
        localStorage.setItem(CONFIG.cookieKey, Date.now().toString());
        return false;
    }

    function getScrollPercent() {
        const h = document.documentElement;
        const b = document.body;
        const st = h.scrollTop || b.scrollTop;
        const sh = h.scrollHeight || b.scrollHeight;
        const ch = h.clientHeight;
        return st / (sh - ch);
    }

    // ──────────────── CTA TEXT RESOLVER ────────────────

    function resolveCTA(lang) {
        const matrix = CTA_MATRIX[lang] || CTA_MATRIX.en;
        const returning = isReturningVisitor();

        if (returning && matrix.returning) {
            return matrix.returning;
        }

        const slot = getTimeSlot();
        return matrix[slot] || matrix.afternoon;
    }

    // ──────────────── STATIC CTA UPDATE ────────────────

    function updateStaticCTAs() {
        const lang = detectLang();
        const cta = resolveCTA(lang);
        const elements = document.querySelectorAll(CONFIG.ctaSelector);

        elements.forEach(el => {
            if (el.dataset.smartCtaApplied) return;
            el.dataset.smartCtaApplied = 'true';

            const originalText = el.textContent;
            el.textContent = cta.text;
            el.title = originalText; // Keep original as tooltip

            // Add subtle entrance animation
            el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            el.style.opacity = '0';
            el.style.transform = 'translateY(4px)';
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        });
    }

    // ──────────────── FLOATING CTA ────────────────

    function createFloatingCTA() {
        if (document.getElementById(CONFIG.floatingId)) return;

        const lang = detectLang();
        const cta = resolveCTA(lang);

        const el = document.createElement('a');
        el.id = CONFIG.floatingId;
        el.href = '/booking.html';
        el.textContent = `${cta.icon} ${cta.text}`;
        el.setAttribute('aria-label', cta.text);

        // Styles — premium floating pill
        Object.assign(el.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: '9990',
            background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)',
            color: '#e8dfd0',
            padding: '14px 28px',
            borderRadius: '50px',
            fontSize: '14px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
            transform: 'translateY(100px)',
            opacity: '0',
            transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(232,223,208,0.1)'
        });

        // Hover effect
        el.addEventListener('mouseenter', () => {
            el.style.background = 'linear-gradient(135deg, #3a3a3a 0%, #4a4a4a 100%)';
            el.style.transform = 'translateY(0) scale(1.05)';
            el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
        });
        el.addEventListener('mouseleave', () => {
            el.style.background = 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)';
            el.style.transform = 'translateY(0) scale(1)';
            el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)';
        });

        document.body.appendChild(el);
        return el;
    }

    function showFloatingCTA() {
        const el = document.getElementById(CONFIG.floatingId);
        if (el) {
            el.style.transform = 'translateY(0)';
            el.style.opacity = '1';
        }
    }

    function hideFloatingCTA() {
        const el = document.getElementById(CONFIG.floatingId);
        if (el) {
            el.style.transform = 'translateY(100px)';
            el.style.opacity = '0';
        }
    }

    // ──────────────── SCROLL WATCHER ────────────────

    let floatingReady = false;
    let floatingVisible = false;
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const pct = getScrollPercent();

                if (pct >= CONFIG.scrollThreshold && floatingReady && !floatingVisible) {
                    showFloatingCTA();
                    floatingVisible = true;
                } else if (pct < CONFIG.scrollThreshold * 0.8 && floatingVisible) {
                    hideFloatingCTA();
                    floatingVisible = false;
                }

                ticking = false;
            });
            ticking = true;
        }
    }

    // ──────────────── INIT ────────────────

    function init() {
        // Update static CTAs
        updateStaticCTAs();

        // Create floating CTA (hidden)
        createFloatingCTA();

        // Enable floating after delay
        setTimeout(() => {
            floatingReady = true;
        }, CONFIG.floatingDelay);

        // Listen to scroll
        window.addEventListener('scroll', onScroll, { passive: true });

        console.log('[Smart CTA] v1.0 initialized — lang:', detectLang(),
            '| time:', getTimeSlot(),
            '| returning:', isReturningVisitor());
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
