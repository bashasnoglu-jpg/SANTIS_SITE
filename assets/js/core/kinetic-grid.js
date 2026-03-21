/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🎬 SANTIS KINETIC GRID v1.0 — GSAP ScrollTrigger          ║
 * ║  Katman 1: Viewport Entry · Katman 2: Parallax · Katman 3  ║
 * ║  gsap.matchMedia() → prefers-reduced-motion uyumlu         ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Bağımlılık: GSAP + ScrollTrigger (CDN'den yüklü: gsap.min.js)
 * Kernel:     interaction-engine.js → initKineticGrid()
 *
 * ⚠️  MİMARİ KURAL: ScrollTrigger ASLA nested timeline'a değil,
 *     sadece ANA trigger'a verilir (circular dependency önlemi).
 */

/* ─── GSAP Güvenlik Kontrolü ─────────────────────────────────────────────── */
function requireGSAP() {
    if (typeof gsap === 'undefined') {
        console.warn('[KineticGrid] GSAP bulunamadı. Animasyonlar atlandı.');
        return false;
    }
    if (typeof ScrollTrigger === 'undefined') {
        console.warn('[KineticGrid] ScrollTrigger bulunamadı. GSAP plugin kayıt edilmemiş.');
        return false;
    }
    return true;
}

/* ─── ScrollTrigger Plugin Kaydı ─────────────────────────────────────────── */
export function registerScrollTrigger() {
    if (!requireGSAP()) return false;
    gsap.registerPlugin(ScrollTrigger);
    console.log('[KineticGrid] ScrollTrigger plugin kayıt edildi.');

    // Sayfa görünürlüğü değişince ScrollTrigger'ı yenile
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) ScrollTrigger.refresh();
    });

    return true;
}

/* ─── ANA FONKSİYON ──────────────────────────────────────────────────────── */
export function initKineticGrid() {
    if (!registerScrollTrigger()) return;

    const mm = gsap.matchMedia();

    /* ────────────────────────────────────────────────────────────────────────
     *  TAM HAREKET: prefers-reduced-motion: no-preference
     *  Y + opacity + parallax + Katman 3 (stagger reveal)
     * ────────────────────────────────────────────────────────────────────── */
    mm.add('(prefers-reduced-motion: no-preference)', () => {

        // ── Katman 1: Bento Kartları Viewport Entry ──────────────────────
        const cards = gsap.utils.toArray(
            '.bento-card-v6, .bento-card-v7, .bento-card'
        );

        cards.forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger:       card,
                    start:         'top 88%',
                    end:           'top 60%',
                    toggleActions: 'play none none reverse',
                    // once: true  ← performans için açılabilir
                },
                y:        40,
                opacity:  0,
                duration: 0.65,
                delay:    i % 3 * 0.08,   // Yan yana kartlara stagger efekti
                ease:     'power2.out',
            });
        });

        // ── Katman 2: Hero Kart Parallax (Scrub) ─────────────────────────
        // ÖNEMLİ: scrub SADECE en üst ScrollTrigger'a verilir,
        // hiçbir zaman nested timeline'a eklenmez.
        const heroCard = document.querySelector(
            '.bento-card-v6.wide, .card-hero, [data-kinetic="hero"]'
        );

        if (heroCard) {
            const heroImg = heroCard.querySelector('.bento-card-media, .bento-img, img');

            // Hero container: hafif yukarı sürünme
            gsap.to(heroCard, {
                scrollTrigger: {
                    trigger: heroCard,
                    start:   'top top',
                    end:     'bottom top',
                    scrub:   1.2,     // smooth follow — 0 = sert, 2+ = gecikmeli
                },
                y:    -40,   // Viewport dışına kayma miktarı (px)
                ease: 'none',
            });

            // Hero görsel: kart geride kalırken görsel daha yavaş kayar
            if (heroImg) {
                gsap.to(heroImg, {
                    scrollTrigger: {
                        trigger: heroCard,
                        start:   'top 80%',
                        end:     'bottom top',
                        scrub:   1.8,
                    },
                    y:     30,    // Görsel karta göre daha yavaş → derinlik hissi
                    scale: 1.06,
                    ease:  'none',
                });
            }
        }

        // ── Katman 3: Section Header Stagger Reveal ───────────────────────
        gsap.utils.toArray('.santis-section-header, .reveal-up').forEach(header => {
            const children = header.children.length > 0
                ? [...header.children]
                : [header];

            gsap.from(children, {
                scrollTrigger: {
                    trigger:       header,
                    start:         'top 85%',
                    toggleActions: 'play none none reverse',
                },
                y:       24,
                opacity: 0,
                duration:  0.7,
                stagger:   0.12,   // Her çocuk 120ms arayla girer
                ease:     'power3.out',
            });
        });

        // ── Katman 3b: Spaos Card Stagger (Swiper öncesi) ────────────────
        const spaosCards = gsap.utils.toArray('.spaos-card');
        if (spaosCards.length > 0) {
            gsap.from(spaosCards, {
                scrollTrigger: {
                    trigger:       '#ritual-stack',
                    start:         'top 75%',
                    toggleActions: 'play none none reverse',
                },
                y:        60,
                opacity:  0,
                rotation: 6,
                duration: 0.8,
                stagger:  0.15,
                ease:     'back.out(1.4)',
            });
        }

        // Cleanup — gsap.matchMedia() bu fonksiyonu otomatik çağırır
        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
            console.log('[KineticGrid] Animasyonlar temizlendi (matchMedia revert).');
        };
    });

    /* ────────────────────────────────────────────────────────────────────────
     *  AZALTILMIŞ HAREKET: prefers-reduced-motion: reduce
     *  Sadece opacity — translateY, parallax, scale YOK
     * ────────────────────────────────────────────────────────────────────── */
    mm.add('(prefers-reduced-motion: reduce)', () => {
        const cards = gsap.utils.toArray(
            '.bento-card-v6, .bento-card-v7, .bento-card'
        );

        cards.forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger:       card,
                    start:         'top 92%',
                    toggleActions: 'play none none none', // reverse yok
                },
                opacity:  0,
                duration: 0.4,
                ease:     'none',
                // Y yok, parallax yok, scale yok → sadece opacity
            });
        });

        // Section headers
        gsap.utils.toArray('.santis-section-header, .reveal-up').forEach(header => {
            gsap.from(header, {
                scrollTrigger: { trigger: header, start: 'top 92%' },
                opacity: 0,
                duration: 0.3,
            });
        });

        return () => ScrollTrigger.getAll().forEach(t => t.kill());
    });

    console.log('[KineticGrid v1.0] ✅ 3 Katmanlı Animasyon Sistemi Aktif.');
    console.log('  Katman 1: Viewport Entry (opacity + y)');
    console.log('  Katman 2: Hero Parallax (scrub)');
    console.log('  Katman 3: Section Stagger (children reveal)');
}

/* ─── ScrollTrigger Yenileme Yardımcıları ────────────────────────────────── */
/**
 * Dinamik içerik eklendikten sonra çağrıl (Swiper init sonrası vb.)
 * @param {number} delay - ms cinsinden gecikme (layout'un oturması için)
 */
export function refreshKinetic(delay = 100) {
    if (typeof ScrollTrigger !== 'undefined') {
        setTimeout(() => ScrollTrigger.refresh(), delay);
    }
}
