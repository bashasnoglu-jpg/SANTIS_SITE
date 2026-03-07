/**
 * santis-soul.js v9.1
 * SANTIS SOUL ENGINE — Atmospheric Page Renderer
 * "The site literally breathes."
 *
 * Handles:
 *  - Fog layer atmospheric effect
 *  - Manifesto item scroll-reveal (data-delay)
 *  - Page mood classes (MIDNIGHT, DAWN, etc.)
 *  - Subtle breathing / pulse animations on silence pages
 */
(function () {
    'use strict';

    // ── 1. IntersectionObserver: manifesto-item reveal ──────────
    function initManifestoReveal() {
        var items = document.querySelectorAll('.manifesto-item');
        if (!items.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
                setTimeout(function () {
                    el.classList.add('is-visible');
                }, delay);
                observer.unobserve(el);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

        items.forEach(function (el) { observer.observe(el); });
    }

    // ── 2. Fog layer: subtle parallax on mousemove ───────────────
    function initFogLayer() {
        var fog = document.querySelector('.fog-layer');
        if (!fog) return;

        var _raf = null;
        document.addEventListener('mousemove', function (e) {
            if (_raf) return;
            _raf = requestAnimationFrame(function () {
                var cx = window.innerWidth / 2;
                var cy = window.innerHeight / 2;
                var dx = (e.clientX - cx) / cx;   // -1 … 1
                var dy = (e.clientY - cy) / cy;
                fog.style.transform =
                    'translate(' + (dx * 12) + 'px, ' + (dy * 8) + 'px)';
                _raf = null;
            });
        });
    }

    // ── 3. Page mood: body class from data-page-mood attr ────────
    function applyPageMood() {
        var mood = document.documentElement.getAttribute('data-page-mood');
        if (mood) {
            document.body.classList.add('mood-' + mood.toLowerCase());
        }
    }

    // ── 4. Signature breathing pulse ────────────────────────────
    function initSignaturePulse() {
        var sig = document.querySelector('.signature');
        if (!sig) return;
        sig.classList.add('soul-pulse');
    }

    // ── 5. Silence soundscape (optional — only if header present)
    function initSilenceAmbience() {
        // Reserved for future audio integration — no-op for now
    }

    // ── Boot ─────────────────────────────────────────────────────
    function boot() {
        applyPageMood();
        initFogLayer();
        initManifestoReveal();
        initSignaturePulse();
        initSilenceAmbience();

        if (window.SantisDebug) {
            console.log('🌫️ [Soul Engine] Initialized. Mood:', document.documentElement.getAttribute('data-page-mood'));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

}());
