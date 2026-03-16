// ============================================================================
// 🧠 SANTIS MOOD ENGINE V1.0 — Smart Funnel & Package Recommendation
// ============================================================================
// Architecture:
//   Stage 1: Mood Selector (Arınma / Enerji / Şefkat / İhtişam)
//   Stage 2: Filtered Service Cards (DOM filter on existing cards)
//   Stage 3: Package Banner (curated story + CTA overlay)
//
// Integration:
//   Listens for `santis:cards-rendered` event from massage-matrix.js
//   Then injects mood selector and package recommendation system
// ============================================================================

(function SantisMoodEngine() {
    'use strict';

    const ENGINE_ID = 'santis-mood-engine';
    const LOG_PREFIX = '🧠 [Mood Engine]';
    let moodData = null;
    let activeMood = null;
    let allCards = [];

    // ══════════════════════════════════════════════════════════════
    // BOOT
    // ══════════════════════════════════════════════════════════════
    async function boot() {
        console.log(`${LOG_PREFIX} Initializing SANTIS Mood Engine V1.0...`);

        try {
            const res = await fetch('/assets/data/mood-engine.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            moodData = await res.json();
            console.log(`${LOG_PREFIX} ${moodData.moods.length} mood profiles loaded.`);
        } catch (err) {
            console.error(`${LOG_PREFIX} Failed to load mood-engine.json:`, err);
            return;
        }

        // Wait for cards to be rendered by massage-matrix.js
        document.addEventListener('santis:cards-rendered', () => {
            console.log(`${LOG_PREFIX} Cards rendered signal received — injecting mood selector.`);
            collectCards();
            injectMoodSelector();
        });

        // If cards are already in DOM (fallback)
        setTimeout(() => {
            if (allCards.length === 0) {
                collectCards();
                if (allCards.length > 0) {
                    console.log(`${LOG_PREFIX} Late-boot: cards found in DOM — injecting.`);
                    injectMoodSelector();
                }
            }
        }, 3000);
    }

    // ══════════════════════════════════════════════════════════════
    // COLLECT EXISTING CARDS FROM DOM
    // ══════════════════════════════════════════════════════════════
    function collectCards() {
        allCards = Array.from(document.querySelectorAll('.matrix-service-card, .nv-matrix-card'));
        console.log(`${LOG_PREFIX} Collected ${allCards.length} cards from DOM.`);
    }

    // ══════════════════════════════════════════════════════════════
    // STAGE 1: MOOD SELECTOR UI
    // ══════════════════════════════════════════════════════════════
    function injectMoodSelector() {
        // Don't inject twice
        if (document.getElementById(ENGINE_ID)) return;

        // Find target: inject BEFORE the first .santis-matrix-container
        const target = document.querySelector('.santis-matrix-container, #santis-data-matrix-grid');
        if (!target) {
            console.warn(`${LOG_PREFIX} No matrix container found — aborting injection.`);
            return;
        }

        const container = document.createElement('section');
        container.id = ENGINE_ID;
        container.setAttribute('aria-label', 'Ruh Halinizi Seçin');

        // Styles
        container.style.cssText = `
            padding: 40px 20px 30px;
            text-align: center;
            position: relative;
            z-index: 3;
        `;

        // Title
        const title = document.createElement('h2');
        title.style.cssText = `
            font-family: 'Playfair Display', serif;
            font-size: 1.8rem;
            font-weight: 400;
            color: #d4af37;
            margin: 0 0 8px 0;
            letter-spacing: 1px;
        `;
        title.textContent = 'Bugün Kendinizi Nasıl Hissetmek İstiyorsunuz?';
        container.appendChild(title);

        // Subtitle
        const subtitle = document.createElement('p');
        subtitle.style.cssText = `
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            color: rgba(255,255,255,0.5);
            margin: 0 0 28px 0;
            letter-spacing: 0.5px;
        `;
        subtitle.textContent = 'Ruh halinize göre size özel bakım önerileri sunuyoruz.';
        container.appendChild(subtitle);

        // Buttons
        const btnGrid = document.createElement('div');
        btnGrid.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
            max-width: 700px;
            margin: 0 auto;
        `;

        // "Tümü" reset button
        const resetBtn = createMoodButton({ id: 'all', mood: 'Tümü', emoji: '✨', color: '#6b7280', gradient: 'linear-gradient(135deg, #1f2937, #6b7280)' }, true);
        btnGrid.appendChild(resetBtn);

        // Mood buttons
        moodData.moods.forEach(mood => {
            btnGrid.appendChild(createMoodButton(mood, false));
        });

        container.appendChild(btnGrid);

        // Package recommendation banner (hidden initially)
        const packageBanner = document.createElement('div');
        packageBanner.id = 'mood-package-banner';
        packageBanner.style.cssText = `
            max-width: 700px;
            margin: 32px auto 0;
            padding: 28px 32px;
            border-radius: 16px;
            background: rgba(212, 175, 55, 0.04);
            border: 1px solid rgba(212, 175, 55, 0.12);
            text-align: left;
            opacity: 0;
            max-height: 0;
            overflow: hidden;
            transition: opacity 0.6s ease, max-height 0.6s cubic-bezier(0.16, 1, 0.3, 1), margin 0.4s ease, padding 0.4s ease;
        `;
        container.appendChild(packageBanner);

        target.parentNode.insertBefore(container, target);
        console.log(`${LOG_PREFIX} Mood selector injected with ${moodData.moods.length + 1} buttons.`);
    }

    function createMoodButton(mood, isActive) {
        const btn = document.createElement('button');
        btn.setAttribute('data-mood-id', mood.id);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        btn.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 22px;
            border-radius: 50px;
            border: 1px solid ${isActive ? mood.color : 'rgba(255,255,255,0.08)'};
            background: ${isActive ? mood.gradient || `linear-gradient(135deg, ${mood.color}22, ${mood.color}44)` : 'rgba(255,255,255,0.03)'};
            color: ${isActive ? '#fff' : 'rgba(255,255,255,0.6)'};
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            letter-spacing: 0.5px;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: ${isActive ? `0 4px 20px ${mood.color}33` : 'none'};
        `;

        btn.innerHTML = `<span style="font-size:1.1rem;">${mood.emoji}</span> ${mood.mood}`;

        btn.addEventListener('mouseenter', () => {
            if (btn.getAttribute('aria-pressed') !== 'true') {
                btn.style.borderColor = mood.color;
                btn.style.color = '#fff';
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = `0 4px 16px ${mood.color}22`;
            }
        });

        btn.addEventListener('mouseleave', () => {
            if (btn.getAttribute('aria-pressed') !== 'true') {
                btn.style.borderColor = 'rgba(255,255,255,0.08)';
                btn.style.color = 'rgba(255,255,255,0.6)';
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            }
        });

        btn.addEventListener('click', () => {
            if (mood.id === 'all') {
                resetFilter();
            } else {
                activateMood(mood);
            }
            updateButtonStates(mood.id);
        });

        return btn;
    }

    // ══════════════════════════════════════════════════════════════
    // STAGE 2: FILTER CARDS BY MOOD
    // ══════════════════════════════════════════════════════════════
    function activateMood(mood) {
        activeMood = mood;
        const serviceIds = mood.recommended_services || [];
        const slugs = mood.recommended_slugs || [];

        console.log(`${LOG_PREFIX} 🎯 Mood activated: "${mood.mood}" → filtering for ${serviceIds.length} services`);

        let matchCount = 0;

        allCards.forEach(card => {
            const ghostTrace = card.getAttribute('data-ghost-trace') || '';
            const cardId = ghostTrace.replace('card-', '');
            const href = card.getAttribute('href') || '';

            // Match by service ID or by slug in URL
            const isMatch = serviceIds.some(sid => cardId === sid) ||
                           slugs.some(s => href.includes(s));

            if (isMatch) {
                card.style.opacity = '1';
                card.style.transform = 'translate3d(0, 0, 0) scale(1)';
                card.style.filter = 'none';
                card.style.order = '-1'; // Bring to front
                card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                // Gold border highlight
                card.style.outline = `2px solid ${mood.color}44`;
                card.style.outlineOffset = '4px';
                matchCount++;
            } else {
                card.style.opacity = '0.15';
                card.style.transform = 'translate3d(0, 0, 0) scale(0.95)';
                card.style.filter = 'grayscale(0.8) blur(1px)';
                card.style.order = '999';
                card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.outline = 'none';
            }
        });

        console.log(`${LOG_PREFIX} ${matchCount}/${allCards.length} cards highlighted for mood "${mood.mood}".`);

        // Show package recommendation
        showPackageBanner(mood);
    }

    function resetFilter() {
        activeMood = null;
        console.log(`${LOG_PREFIX} Filter reset — showing all cards.`);

        allCards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translate3d(0, 0, 0) scale(1)';
            card.style.filter = 'none';
            card.style.order = '0';
            card.style.outline = 'none';
            card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        });

        hidePackageBanner();
    }

    function updateButtonStates(activeId) {
        const buttons = document.querySelectorAll(`#${ENGINE_ID} button[data-mood-id]`);
        buttons.forEach(btn => {
            const moodId = btn.getAttribute('data-mood-id');
            const isActive = moodId === activeId;
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

            let moodInfo = moodId === 'all'
                ? { color: '#6b7280', gradient: 'linear-gradient(135deg, #1f2937, #6b7280)' }
                : moodData.moods.find(m => m.id === moodId);

            if (!moodInfo) return;

            if (isActive) {
                btn.style.borderColor = moodInfo.color;
                btn.style.background = moodInfo.gradient || `linear-gradient(135deg, ${moodInfo.color}22, ${moodInfo.color}44)`;
                btn.style.color = '#fff';
                btn.style.boxShadow = `0 4px 20px ${moodInfo.color}33`;
                btn.style.transform = 'translateY(-2px)';
            } else {
                btn.style.borderColor = 'rgba(255,255,255,0.08)';
                btn.style.background = 'rgba(255,255,255,0.03)';
                btn.style.color = 'rgba(255,255,255,0.6)';
                btn.style.boxShadow = 'none';
                btn.style.transform = 'translateY(0)';
            }
        });
    }

    // ══════════════════════════════════════════════════════════════
    // STAGE 3: PACKAGE RECOMMENDATION BANNER
    // ══════════════════════════════════════════════════════════════
    function showPackageBanner(mood) {
        const banner = document.getElementById('mood-package-banner');
        if (!banner || !mood.package) return;

        const pkg = mood.package;

        banner.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 20px;">
                <div style="flex-shrink: 0; width: 52px; height: 52px; border-radius: 14px;
                     background: ${mood.gradient}; display: flex; align-items: center;
                     justify-content: center; font-size: 1.5rem; box-shadow: 0 4px 16px ${mood.color}33;">
                    ${mood.emoji}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        <span style="font-family: 'Inter', sans-serif; font-size: 0.65rem;
                               font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
                               color: ${mood.color}; background: ${mood.color}18; padding: 3px 10px;
                               border-radius: 20px;">${mood.tag}</span>
                        <span style="font-family: 'Inter', sans-serif; font-size: 0.65rem;
                               font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
                               color: #d4af37; background: rgba(212,175,55,0.1); padding: 3px 10px;
                               border-radius: 20px;">💎 ${pkg.discount_label}</span>
                    </div>
                    <h3 style="font-family: 'Playfair Display', serif; font-size: 1.4rem;
                         font-weight: 400; color: #fff; margin: 0 0 6px 0; line-height: 1.3;">
                        ${pkg.name_tr || pkg.name}
                    </h3>
                    <p style="font-family: 'Inter', sans-serif; font-size: 0.85rem;
                        color: rgba(255,255,255,0.5); margin: 0 0 4px 0;
                        font-weight: 400; line-height: 1.4;">
                        ${pkg.benefit}
                    </p>
                    <p style="font-family: 'Inter', sans-serif; font-size: 0.8rem;
                        color: rgba(255,255,255,0.35); margin: 0 0 16px 0;
                        font-style: italic; line-height: 1.6;">
                        "${pkg.story}"
                    </p>
                    <a href="#nv-reservation-modal" onclick="document.getElementById('nv-reservation-modal')?.classList.add('active'); return false;"
                       style="display: inline-flex; align-items: center; gap: 8px;
                        padding: 12px 28px; border-radius: 50px;
                        background: ${mood.gradient};
                        color: #fff; font-family: 'Inter', sans-serif;
                        font-size: 0.85rem; font-weight: 600; text-decoration: none;
                        letter-spacing: 0.5px;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 20px ${mood.color}33;">
                        ${pkg.cta} &rarr;
                    </a>
                </div>
            </div>
        `;

        banner.style.borderColor = `${mood.color}22`;
        banner.style.background = `rgba(${hexToRgb(mood.color)}, 0.04)`;

        // Animate in
        requestAnimationFrame(() => {
            banner.style.opacity = '1';
            banner.style.maxHeight = '600px';
            banner.style.padding = '28px 32px';
            banner.style.marginTop = '32px';
        });

        console.log(`${LOG_PREFIX} 📦 Package banner shown: "${pkg.name_tr || pkg.name}"`);
    }

    function hidePackageBanner() {
        const banner = document.getElementById('mood-package-banner');
        if (!banner) return;

        banner.style.opacity = '0';
        banner.style.maxHeight = '0';
        banner.style.padding = '0 32px';
        banner.style.marginTop = '0';
    }

    // ══════════════════════════════════════════════════════════════
    // UTILITIES
    // ══════════════════════════════════════════════════════════════
    function hexToRgb(hex) {
        const c = hex.replace('#', '');
        const r = parseInt(c.substr(0, 2), 16);
        const g = parseInt(c.substr(2, 2), 16);
        const b = parseInt(c.substr(4, 2), 16);
        return `${r}, ${g}, ${b}`;
    }

    // ══════════════════════════════════════════════════════════════
    // AUTO-BOOT
    // ══════════════════════════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // Expose for external control (God's Eye, Boardroom etc.)
    window.SantisMoodEngine = {
        activateMood: (moodId) => {
            if (!moodData) return;
            const mood = moodData.moods.find(m => m.id === moodId);
            if (mood) {
                collectCards();
                activateMood(mood);
                updateButtonStates(moodId);
            }
        },
        reset: () => {
            collectCards();
            resetFilter();
            updateButtonStates('all');
        },
        getActiveMood: () => activeMood
    };

})();
