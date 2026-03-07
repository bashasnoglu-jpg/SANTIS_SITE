/**
 * SANTIS SCORE ENGINE V1.5 (PROXIED TO WEB WORKER)
 * Phase 61: Web Worker Offload. Main thread is now a lightweight proxy.
 */

(function () {
    'use strict';

    if (window.SantisScore) return;

    // ─── THE GHOST EXORCISM (V15.6 AUTO-WIPE) ──────────────────────────────
    const CURRENT_GHOST_VERSION = '15.6';
    if (localStorage.getItem('santis_ghost_version') !== CURRENT_GHOST_VERSION) {
        console.warn('🧹 [Auto-Exorcism] Zehirli Ghost önbelleği tespit edildi. Hafıza siliniyor...');
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('santis_ghost_version', CURRENT_GHOST_VERSION);
    }

    const _initialScore = parseInt(sessionStorage.getItem('santis_ghost_score') || '0', 10);
    const _persona = sessionStorage.getItem('santis_persona') || 'default';
    let _currentScoreLocal = _initialScore; // used for sync getters

    // Initialize the autonomous brain worker
    const brainWorker = new Worker('/assets/js/core/santis-brain-worker.js');

    brainWorker.postMessage({
        type: 'INIT',
        payload: { initialScore: _initialScore, persona: _persona }
    });

    // ─── EVENT RECEIVER (From Worker) ───────────────────────────────────────
    brainWorker.onmessage = function (e) {
        const data = e.data;
        switch (data.type) {
            case 'SCORE_UPDATE':
                _currentScoreLocal = data.score;
                sessionStorage.setItem('santis_ghost_score', Math.round(data.score).toString());

                const sign = data.delta >= 0 ? '+' : '';
                console.log(`💰 [Score Engine] ${data.action} ${sign}${data.delta} → Total: ${Math.round(data.score)}`);

                if (window.SantisGhost && typeof window.SantisGhost.track === 'function') {
                    window.SantisGhost.track(data.action, data.action, data.delta, data.extraPayload);
                }
                if (window.SantisOS && typeof window.SantisOS.emitEvent === 'function') {
                    window.SantisOS.emitEvent('score_update', { score: data.score, delta: data.delta, action: data.action, prev: data.prev, ...data.extraPayload });
                }
                if (window.SANTIS) window.SANTIS.score = Math.round(data.score);

                window.dispatchEvent(new CustomEvent('santis:score_update', {
                    detail: { score: data.score, delta: data.delta, action: data.action, prev: data.prev }
                }));
                break;

            case 'RESCUE_HIT':
                console.log(`🚁 [Score Engine] RESCUE THRESHOLD HIT! Score: ${Math.round(data.score)}`);
                window.dispatchEvent(new CustomEvent('santis:aurelia_wakeup', {
                    detail: { score: data.score, trigger: 'ghost_score_threshold' }
                }));
                if (window.SantisOS && typeof window.SantisOS.emitEvent === 'function') {
                    window.SantisOS.emitEvent('aurelia_wakeup', { score: data.score, trigger: 'ghost_score_threshold' });
                    window.SantisOS.emitEvent('rescue_trigger', { score: data.score });
                }
                break;

            case 'SURGE_HIT':
                console.log(`📈 [Score Engine] SURGE THRESHOLD HIT!`);
                sessionStorage.setItem('santis_surge_multiplier', data.multiplier.toString());
                window.dispatchEvent(new CustomEvent('santis-surge-active', { detail: { multiplier: data.multiplier } }));
                if (window.SantisOS && typeof window.SantisOS.emitEvent === 'function') {
                    window.SantisOS.emitEvent('surge_active', { multiplier: data.multiplier, score: data.score });
                }
                break;

            case 'AURELIA_WAKEUP':
                window.dispatchEvent(new CustomEvent('santis:aurelia_wakeup', { detail: { score: data.score } }));
                if (window.SantisOS && window.SantisOS.emitEvent) window.SantisOS.emitEvent('aurelia_wakeup', { trigger: data.trigger });
                break;

            case 'RESCUE_TRIGGER':
                window.dispatchEvent(new CustomEvent('santis:rescue_trigger', {
                    detail: { score: data.score, persona: data.persona }
                }));
                if (window.SantisOS && window.SantisOS.emitEvent) window.SantisOS.emitEvent('rescue_trigger', { trigger: data.trigger });
                break;
        }
    };

    function addScoreProxy(eventKey, extraPayload = {}) {
        if (window.SantisOS && window.SantisOS.SAFE_MODE) {
            console.warn(`🛡️ [Kill Switch] Otonom puanlama devredışı. (Target: ${eventKey})`);
            return;
        }
        brainWorker.postMessage({ type: 'ADD_SCORE', payload: { eventKey, extraPayload } });
    }

    // ─── COLLECTOR 1: TIME-ON-SITE (15sn × max 5) ──────────────────────────
    const TIME_BONUS_MAX = 5;
    let _timeBonusCount = 0;
    let _timeInterval = setInterval(() => {
        if (document.visibilityState === 'hidden') return;
        if (_timeBonusCount >= TIME_BONUS_MAX) {
            clearInterval(_timeInterval);
            return;
        }
        _timeBonusCount++;
        addScoreProxy('time_15s', { bonus_count: _timeBonusCount });
    }, 15000);

    // ─── COLLECTOR 2: SCROLL DEPTH (debounce + Set) ────────
    let _scrollDebounce = null;
    const scrollMilestones = new Set();
    window.addEventListener('scroll', () => {
        if (_scrollDebounce) return;
        _scrollDebounce = setTimeout(() => {
            _scrollDebounce = null;
            const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (pct >= 90 && !scrollMilestones.has(90)) {
                scrollMilestones.add(90);
                addScoreProxy('scroll_90', { depth: 90 });
            } else if (pct >= 75 && !scrollMilestones.has(75)) {
                scrollMilestones.add(75);
                addScoreProxy('scroll_75', { depth: 75 });
            } else if (pct >= 50 && !scrollMilestones.has(50)) {
                scrollMilestones.add(50);
                addScoreProxy('scroll_50', { depth: 50 });
            } else if (pct >= 25 && !scrollMilestones.has(25)) {
                scrollMilestones.add(25);
                addScoreProxy('scroll_25', { depth: 25 });
            }
        }, 250);
    }, { passive: true });

    // ─── COLLECTOR 3: HİZMET KARTI GÖRÜNÜRLÜĞÜ ──────
    function _observeCards() {
        const cards = document.querySelectorAll('.nv-card-tarot, .nv-card, .ritual-card, .bento-card');
        if (!cards.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    addScoreProxy('card_view', { card: entry.target.dataset.id || 'unknown' });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        cards.forEach(card => observer.observe(card));
    }

    // ─── COLLECTOR 4: CTA TIKLAMA ───────────────────────────────────────────
    document.addEventListener('click', (e) => {
        const isCTA = e.target.closest('.card__action, .nv-btn-cta, [data-score-cta]');
        if (isCTA) addScoreProxy('cta_click', { target: isCTA.textContent?.trim().slice(0, 40) });
    });

    // ─── COLLECTOR 5 & 6: MODAL / GALERİ ─────────────────────────────
    window.addEventListener('santis:modal_open', () => addScoreProxy('modal_open'));
    window.addEventListener('santis:gallery_open', () => addScoreProxy('gallery_open'));

    // ─── COLLECTOR 7: EXIT INTENT ───────────────
    let _exitBridgeFired = false;
    let _exitIntentThrottled = false;
    document.addEventListener('mouseleave', (e) => {
        if (_exitIntentThrottled) return;
        _exitIntentThrottled = true;

        requestAnimationFrame(() => {
            if (e.clientY < 5 && !_exitBridgeFired) {
                _exitBridgeFired = true;
                console.log(`🚁 [Score Engine] Exit Intent detected.`);
                brainWorker.postMessage({ type: 'EXIT_INTENT' });

                setTimeout(() => { _exitBridgeFired = false; }, 15000);
            }
            _exitIntentThrottled = false;
        });
    }, { passive: true });

    // ─── COLLECTOR 8: DEEP HOVER ───────────────────────────────
    let _hoverTimer = null;
    const _deepHoveredCards = new Set();
    document.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.nv-card-tarot, .nv-card, .ritual-card, .bento-card');
        if (card) {
            const cardId = card.dataset.id || card.id || card.querySelector('h3')?.innerText || 'unknown_item';
            if (!_deepHoveredCards.has(cardId)) {
                _hoverTimer = setTimeout(() => {
                    _deepHoveredCards.add(cardId);
                    addScoreProxy('hover_deep', { card: cardId });
                }, 2000);
            }
        }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.nv-card-tarot, .nv-card, .ritual-card, .bento-card')) {
            clearTimeout(_hoverTimer);
        }
    }, { passive: true });

    // ─── PUBLIC API ─────────────────────────────────────────────────────────
    window.SantisScore = {
        get: () => Math.round(_currentScoreLocal),
        add: (key) => addScoreProxy(key),
        reset: () => {
            scrollMilestones.clear();
            sessionStorage.setItem('santis_ghost_score', '0');
            brainWorker.postMessage({ type: 'RESET' });
        },
        matrix: {
            time_15s: 10, hover_deep: 15, scroll_25: 5, scroll_50: 10, scroll_75: 15, scroll_90: 20, card_view: 5, cta_click: 20, modal_open: 30, gallery_open: 15, hover_long: 8
        },
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _observeCards);
    } else {
        _observeCards();
    }
    window.addEventListener('product-data:ready', () => setTimeout(_observeCards, 500));

    console.log(`🧮 [Score Engine Proxy V1.5] Online. Core Engine deployed to Web Worker.`);
})();
