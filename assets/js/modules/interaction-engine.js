/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ⚡ SANTIS INTERACTION ENGINE v1.0                          ║
 * ║  DOM Events · UI Effects · Living Card · Reservation Modal  ║
 * ║  "Aptal UI" Prensibi: Sadece DOM'u okur, EventBus'a yazar  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Kernel tarafından yüklenir: resolveModule('interaction')
 * Bağımlılık: yok (deps: [])
 */

/* ─── 1. BENTO CORE INJECTOR ─────────────────────────────────────────────── */
(function initBentoCore() {
    // editorial.css layer
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = '/assets/css/editorial.css';
    document.head.appendChild(link);

    // Grain overlay
    if (!document.querySelector('.santis-grain-overlay')) {
        const grain = document.createElement('div');
        grain.className = 'santis-grain-overlay';
        document.body.appendChild(grain);
    }

    // Ultra Motion feature detection (CSS Scroll Timeline)
    if (CSS.supports('animation-timeline: view()')) {
        document.documentElement.classList.add('ultra-motion');
        console.log('🚀 [Interaction] Ultra Motion: GPU animations aktif.');
    } else {
        console.log('⚠️ [Interaction] Ultra Motion: CSS Transitions fallback.');
    }

    // Instant hover prefetch — sadece gerçek mouse'lu cihazlarda
    if (window.matchMedia('(hover: hover)').matches) {
        document.body.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.bento-card');
            if (card && card.dataset.href && !card.dataset.prefetched) {
                let href = card.dataset.href;
                if (!href.startsWith('http') && !href.startsWith('../') && !href.startsWith('/')) {
                    const dRoot = window.SITE_ROOT || '/';
                    href = dRoot + href;
                    if (!href.endsWith('.html') && !href.includes('.')) {
                        href = href.endsWith('/') ? href + 'index.html' : href + '/index.html';
                    }
                }
                const pl = document.createElement('link');
                pl.rel  = 'prefetch';
                pl.href = href;
                document.head.appendChild(pl);
                card.dataset.prefetched = 'true';
                console.debug('⚡ [Interaction] Prefetch:', href);
            }
        }, { passive: true });
    }
})();

/* ─── 2. SAFE PRELOADER REMOVER ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const p = document.getElementById('preloader');
        if (p) p.classList.add('hidden');
    }, 500);
});

/* ─── 3. FINAL POLISH ENGINE ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // 3a. Erişilebilirlik: icon butonlarını isimlendir
    document.querySelectorAll('.icon-btn').forEach(btn => {
        if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Santis Action');
    });

    // 3b. SEO & Güvenlik: harici linkleri zırhla
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.setAttribute('rel', 'noopener noreferrer');
    });

    // 3c. CLS koruması: görsellere varsayılan boyut ekle
    document.querySelectorAll('img').forEach(img => {
        if (!img.getAttribute('width'))  img.setAttribute('width',  '600');
        if (!img.getAttribute('height')) img.setAttribute('height', '400');
    });

    // 3d. Canonical Link Tornado — eski /en/ /ru/ /de/ vb. → /tr/
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith('//')) {
            const newHref = href.replace(/^\/(en|ru|de|fr|sr)\//, '/tr/');
            if (href !== newHref) {
                link.setAttribute('href', newHref);
                console.debug('⚡ [Interaction] Canonical link forced:', href, '->', newHref);
            }
        }
    });

    console.log('🏆 [Interaction] Final Polish Engine: 10/10 Mükemmellik Mührü.');
});

/* ─── 4. IMAGE ERROR RECOVERY ────────────────────────────────────────────── */
window._imgRecoveryLog = window._imgRecoveryLog || new Set();
document.addEventListener('error', (e) => {
    if (e.target?.tagName?.toLowerCase() !== 'img') return;
    const origSrc = e.target.getAttribute('src') || '';
    if (origSrc.includes('luxury-placeholder') || origSrc.includes('placeholder.webp')) return;
    if (window._imgRecoveryLog.has(origSrc)) return;
    window._imgRecoveryLog.add(origSrc);
    console.debug('[Interaction] Görsel kurtarılıyor:', origSrc);
    e.target.src = '/assets/img/luxury-placeholder.webp';
    e.target.style.filter = 'grayscale(1) opacity(0.5)';
}, true);

/* ─── 5. LIVING CARD — Mobile Touch UX v2 ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    if (!window.matchMedia('(hover: none)').matches && window.innerWidth >= 992) return;

    const cards = document.querySelectorAll('.mega-feature-card, .nv-card, .svc-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a, button, .nv-btn')) return; // actionable → geç
            e.preventDefault();
            e.stopPropagation();
            const wasFlipped = card.classList.contains('is-flipped');
            cards.forEach(c => c.classList.remove('is-flipped'));
            if (!wasFlipped) card.classList.add('is-flipped');
        });
    });

    // Boş alana dokununca tümünü sıfırla
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.mega-feature-card, .nv-card, .svc-card')) {
            cards.forEach(c => c.classList.remove('is-flipped'));
        }
    });
});

/* ─── 6. RESERVATION MODAL v1.1 (WhatsApp Entegre) ─────────────────────── */
window.openReservationModal = function(serviceName = 'Genel Rezervasyon') {
    const modal = document.getElementById('reservation-modal');
    if (modal) {
        modal.classList.add('active');
        const input = document.getElementById('res-service-input');
        if (input) input.value = serviceName;
    } else {
        const phone = window.NV_CONCIERGE_NUMBER || '905000000000';
        const msg   = encodeURIComponent(`Merhaba, ${serviceName} hakkında bilgi almak istiyorum.`);
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
    console.log(`[Interaction] Reservation Modal: ${serviceName}`);
};

/* ─── 7. KINETIC HOVER + SCROLL REVEAL (MutationObserver ile) ───────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Scroll Reveal Observer
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Kinetic Hover bağlayıcı
    const bindKineticHover = (card) => {
        if (card.dataset.kineticBound === 'true') return;
        card.dataset.kineticBound = 'true';

        let rafId;
        const onMouseMove = e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            const cx = rect.width  / 2;
            const cy = rect.height / 2;
            const mult = 0.03;
            const rotX = (cy - y) * mult;
            const rotY = (x  - cx) * mult;
            card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`;
        };

        card.addEventListener('mouseenter', () => {
            card.style.setProperty('--spotlight-opacity', '1');
            card.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
            card.addEventListener('mousemove', e => {
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => onMouseMove(e));
            });
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--spotlight-opacity', '0');
            card.style.transition = 'transform 0.6s cubic-bezier(.19,1,.22,1)';
            card.style.transform  = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
        });
    };

    // MutationObserver: dinamik eklenen kartları da yakala
    const domWatcher = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                const reveals = node.classList?.contains('santis-reveal')
                    ? [node] : [...node.querySelectorAll('.santis-reveal')];
                const kards = (node.classList?.contains('bento-card-v6') || node.classList?.contains('bento-card-v7'))
                    ? [node] : [...node.querySelectorAll('.bento-card-v7, .bento-card-v6')];
                reveals.forEach(el => revealObserver.observe(el));
                kards.forEach(card => bindKineticHover(card));
            });
        });
    });
    domWatcher.observe(document.body, { childList: true, subtree: true });

    // İlk yükleme: statik elemanları bağla
    document.querySelectorAll('.santis-reveal').forEach(el => revealObserver.observe(el));
    document.querySelectorAll('.bento-card-v7, .bento-card-v6').forEach(card => bindKineticHover(card));
});

/* ─── 8. DUMMY LOADER — Eksik Modül 404 Susturucu ───────────────────────── */
(function initDummyLoaders() {
    const dummyFn = (name) => () => console.debug(`[Santis] '${name}' modülü henüz aktif değil. Dummy fallback devrede.`);
    const missingModules = [
        'santis-booking', 'booking-wizard', 'cms-image-loader', 'nuclear-cards',
        'card-effects', 'lenis-init', 'hreflang-injector', 'hreflang-loader',
        'canonical-loader', 'schema-loader', 'santis-language-sync',
        'santis-ai-chatbot', 'santis-telemetry', 'santis-chameleon',
        'santis-persuader', 'aurelia-engine'
    ];
    missingModules.forEach(mod => {
        const camelCased = mod.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        if (!window[camelCased]) window[camelCased] = dummyFn(mod);
        if (!window[mod])        window[mod]        = dummyFn(mod);
    });
    console.log('✅ [Interaction] Dummy Loader aktif. Eksik modüller susturuldu.');
})();

/* ─── 9. KERNEL ENTEGRASYON SİNYALİ ─────────────────────────────────────── */
// Kernel yükleme tamamlandığında SantisEventBus'a bildir
if (typeof SantisEventBus !== 'undefined') {
    SantisEventBus.emit('interaction:ready', { ts: performance.now() });
} else if (typeof globalThis.__SANTIS__ !== 'undefined') {
    globalThis.__SANTIS__.services.bus?.emit('interaction:ready', { ts: performance.now() });
}
console.log('⚡ [Interaction Engine v1.0] Ready.');
