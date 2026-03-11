/**
 * assets/js/cms-image-loader.js
 * Santis CMS — Universal Image Loader v1.0
 * Scans page for [data-cms-slot] elements, fetches matching assets from API,
 * and swaps src with a smooth fade-in transition.
 * Falls back gracefully to default src if no CMS image is found.
 */
(function () {
    'use strict';

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = window.__API_BASE__ || (isLocal ? 'http://localhost:8080/api/v1' : 'https://api.sovereign-os.com/api/v1');
    const API = `${API_BASE}/media/assets`;

    async function init() {
        const elements = document.querySelectorAll('[data-cms-slot]');
        if (elements.length === 0) return;

        // Collect unique slot names
        const slotMap = {};
        elements.forEach(el => {
            const slot = el.getAttribute('data-cms-slot');
            if (slot) {
                if (!slotMap[slot]) slotMap[slot] = [];
                slotMap[slot].push(el);
            }
        });

        const slotNames = Object.keys(slotMap);
        if (slotNames.length === 0) return;

        try {
            const res = await fetch(`${API}?slots=${slotNames.join(',')}`);
            if (!res.ok) return;
            const data = await res.json();
            const assets = data.assets || [];

            // Build a lookup: slot -> most recent asset
            const slotAssets = {};
            assets.forEach(asset => {
                if (asset.slot && !slotAssets[asset.slot]) {
                    slotAssets[asset.slot] = asset;
                }
            });

            // Apply images with smooth transition
            Object.entries(slotAssets).forEach(([slot, asset]) => {
                const targets = slotMap[slot];
                if (!targets || !asset.url) return;

                targets.forEach(el => {
                    // For <img> elements
                    if (el.tagName === 'IMG') {
                        el.style.transition = 'opacity 0.5s ease';
                        el.style.opacity = '0';
                        const newImg = new Image();
                        newImg.onload = () => {
                            el.src = asset.url;
                            requestAnimationFrame(() => {
                                el.style.opacity = '1';
                                setTimeout(() => { el.style.opacity = ''; }, 550);
                            });
                        };
                        newImg.onerror = () => { el.style.opacity = ''; }; // Keep default
                        newImg.src = asset.url;
                    }
                    // For elements with background-image (trend cards etc.)
                    else if (el.style.backgroundImage || el.dataset.cmsSlotBg) {
                        el.style.transition = 'opacity 0.5s ease';
                        el.style.opacity = '0';
                        const newImg = new Image();
                        newImg.onload = () => {
                            el.style.backgroundImage = `url('${asset.url}')`;
                            requestAnimationFrame(() => {
                                el.style.opacity = '1';
                                setTimeout(() => { el.style.opacity = ''; }, 550);
                            });
                        };
                        newImg.onerror = () => { el.style.opacity = ''; };
                        newImg.src = asset.url;
                    }
                });
            });
        } catch (err) {
            console.warn('[Santis CMS] Fallback images active.', err);
        }
    }

    // ─── Phase 8.7: Live Preview WebSocket Listener ────────────────
    function listenForLiveUpdates() {
        if (window.SANTIS_API_ONLINE === false) return; // KILL SWITCH

        // ── Phase 16: Singleton guard — prevent duplicate WS / PULSE loop
        if (window._nvBridgeConnected) {
            console.log('[Santis Bridge] WS already active — skipping duplicate.');
            return;
        }
        window._nvBridgeConnected = true;

        const protocol = document.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const wsHost = (window.__API_BASE__) ? new URL(window.__API_BASE__).host : (isLocal ? 'localhost:8080' : 'api.sovereign-os.com');
        const ws = new WebSocket(`${protocol}//${wsHost}/ws?client_type=site&client_id=live`);

        ws.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);

                // ── CMS Live Image Swap ──────────────────────────────
                if (data.type === 'CMS_ASSET_UPDATED' && data.slot && data.url) {
                    console.log(`⚡ [CMS Live] Slot "${data.slot}" updated → ${data.url}`);
                    const targets = document.querySelectorAll(`[data-cms-slot="${data.slot}"]`);
                    targets.forEach(function (el) { goldenFadeSwap(el, data.url); });
                }

                // ── Phase 9.5-E: Urgency Banner (Autonomous Flash Offer) ─
                if (data.type === 'URGENCY_BANNER' && data.action === 'FLASH_OFFER') {
                    const params = data.params || {};
                    showUrgencyBanner({
                        text: params.banner_text || 'Özel Teklif: Sınırlı Süre İndirimi',
                        discount: params.discount_pct || 10,
                        duration: (params.banner_duration_sec || 120) * 1000,
                        aiConfirmed: data.ai_backed === true
                    });
                }

                // ── Phase 13: Autonomous Surge Indicator ─────────────────
                if (data.type === 'SURGE_ACTIVE') {
                    const pct = Math.round((data.multiplier - 1) * 100);
                    // Remove any existing surge badge
                    const old = document.getElementById('nv-surge-badge');
                    if (old) old.remove();
                    const badge = document.createElement('div');
                    badge.id = 'nv-surge-badge';
                    badge.setAttribute('role', 'status');
                    badge.style.cssText = [
                        'position:fixed;top:80px;right:16px;z-index:9990',
                        'background:linear-gradient(135deg,#2a1f0e,#3d2c18)',
                        'border:1px solid #c9a96e;border-radius:8px',
                        'padding:8px 14px;font-family:monospace;font-size:11px',
                        'color:#c9a96e;box-shadow:0 4px 20px rgba(201,169,110,0.2)',
                        'animation:fadeInRight 0.4s ease',
                        'cursor:pointer'
                    ].join(';');
                    badge.innerHTML = `<span style="opacity:0.6;font-size:9px;display:block;letter-spacing:0.1em">⚡ SURGE ACTIVE</span>+%${pct} Yoğun Talep Fiyatı`;
                    badge.onclick = function () { badge.remove(); };
                    document.body.appendChild(badge);
                    setTimeout(function () { if (badge.parentNode) badge.remove(); }, 60000);
                    console.log(`⚡ [Santis Surge] Autonomous price surge: +${pct}%`);
                }

            } catch (e) { /* ignore non-JSON */ }
        };


        ws.onclose = function () {
            window._nvBridgeConnected = false;  // Reset — allow clean reconnect
            setTimeout(listenForLiveUpdates, 3000);
        };
        ws.onerror = function () { window._nvBridgeConnected = false; };
    }

    // ─── Phase 9.5-E: Urgency Banner Engine ────────────────────────
    function injectBannerStyles() {
        if (document.getElementById('nv-urgency-banner-style')) return;
        const style = document.createElement('style');
        style.id = 'nv-urgency-banner-style';
        style.textContent = `
            #nv-urgency-banner {
                position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
                background: linear-gradient(135deg, #1a1208 0%, #2d1f05 50%, #1a1208 100%);
                border-bottom: 1px solid #c9a96e;
                color: #f5e6c8;
                font-family: 'Inter', sans-serif;
                padding: 0;
                transform: translateY(-100%);
                transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 4px 30px rgba(201,169,110,0.25);
            }
            #nv-urgency-banner.nv-banner-visible {
                transform: translateY(0);
            }
            #nv-urgency-banner .nv-banner-inner {
                display: flex; align-items: center; justify-content: center;
                gap: 16px; padding: 12px 24px;
                max-width: 1200px; margin: 0 auto;
            }
            #nv-urgency-banner .nv-banner-pulse {
                width: 8px; height: 8px; border-radius: 50%;
                background: #c9a96e; animation: nv-ping 1.2s infinite;
                flex-shrink: 0;
            }
            #nv-urgency-banner .nv-banner-text {
                font-size: 13px; letter-spacing: 0.05em; color: #f5e6c8;
            }
            #nv-urgency-banner .nv-banner-discount {
                font-size: 15px; font-weight: 700;
                color: #c9a96e; letter-spacing: 0.08em;
            }
            #nv-urgency-banner .nv-banner-timer {
                font-size: 12px; font-family: monospace;
                background: rgba(201,169,110,0.15);
                border: 1px solid rgba(201,169,110,0.3);
                padding: 2px 8px; border-radius: 4px;
                color: #c9a96e; min-width: 44px; text-align: center;
            }
            #nv-urgency-banner .nv-banner-close {
                position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
                background: none; border: none; color: #6b5c3e;
                cursor: pointer; font-size: 18px; line-height: 1;
                transition: color 0.2s;
            }
            #nv-urgency-banner .nv-banner-close:hover { color: #c9a96e; }
            #nv-urgency-banner .nv-ai-badge {
                font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
                color: #6b5c3e; border: 1px solid #3a2e1a; padding: 1px 6px;
                border-radius: 99px;
            }
            @keyframes nv-ping {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
    }

    function showUrgencyBanner({ text, discount, duration, aiConfirmed, eventId }) {
        injectBannerStyles();

        const old = document.getElementById('nv-urgency-banner');
        if (old) old.remove();

        // ── H2: Log Impression ──────────────────────────
        const sessionId = (window._nvGhostId || localStorage.getItem('nv_sid') || 'anon');
        let impressionId = null;
        fetch(`${API_BASE}/ai/banner-impression`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, event_id: eventId || '', action: 'FLASH_OFFER', discount_pct: discount })
        }).catch(() => { });

        const banner = document.createElement('div');
        banner.id = 'nv-urgency-banner';
        banner.setAttribute('role', 'alert');
        banner.style.cursor = 'pointer';
        banner.innerHTML = `
            <div class="nv-banner-inner">
                <span class="nv-banner-pulse"></span>
                <span class="nv-banner-text">${text}</span>
                <span class="nv-banner-discount">%${discount} İNDİRİM</span>
                <span class="nv-banner-timer" id="nv-urgency-countdown">2:00</span>
                ${aiConfirmed ? '<span class="nv-ai-badge">⚡ AI Onaylı</span>' : ''}
                <button class="nv-banner-close" aria-label="Kapat">×</button>
            </div>
        `;
        document.body.prepend(banner);

        // ── H2: Click Tracking ──────────────────────────
        banner.querySelector('.nv-banner-inner').addEventListener('click', function (e) {
            if (e.target.classList.contains('nv-banner-close')) {
                banner.classList.remove('nv-banner-visible');
                setTimeout(() => { if (banner.parentNode) banner.remove(); }, 600);
                return;
            }
            // Log the click
            fetch(`${API_BASE}/ai/banner-click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, impression_id: impressionId, converted: 1 })
            }).catch(() => { });

            // ── Phase 15: Create Promo Token & store in sessionStorage ──
            fetch(`${API_BASE}/ai/promo-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, discount_pct: discount, action: 'FLASH_OFFER' })
            }).then(r => r.json()).then(data => {
                if (data.token) {
                    sessionStorage.setItem('nv_promo_token', data.token);
                    sessionStorage.setItem('nv_promo_discount', String(discount));
                    sessionStorage.setItem('nv_promo_display', data.display || ('NV-' + data.token));
                    console.log('%c🎁 [Santis Promo] Token aktif: ' + data.display, 'color:#d4af37;font-weight:bold');
                }
            }).catch(() => { });

            // Navigate to booking section
            const bookEl = document.getElementById('reservation') || document.getElementById('booking') || document.getElementById('wizardModal');
            if (bookEl) bookEl.scrollIntoView({ behavior: 'smooth' });
            // Open booking wizard if available
            if (window.BOOKING_WIZARD) window.BOOKING_WIZARD.open();
        });


        requestAnimationFrame(() => {
            requestAnimationFrame(() => { banner.classList.add('nv-banner-visible'); });
        });

        let remaining = Math.floor(duration / 1000);
        const timerEl = banner.querySelector('#nv-urgency-countdown');
        const tick = setInterval(() => {
            remaining--;
            if (timerEl) {
                const m = Math.floor(remaining / 60);
                const s = remaining % 60;
                timerEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
            }
            if (remaining <= 0) {
                clearInterval(tick);
                banner.classList.remove('nv-banner-visible');
                setTimeout(() => { if (banner.parentNode) banner.remove(); }, 600);
            }
        }, 1000);
    }

    function goldenFadeSwap(el, newUrl) {
        el.style.transition = 'filter 0.6s ease, opacity 0.6s ease';
        el.style.filter = 'blur(8px) brightness(0.5)';

        var img = new Image();
        img.onload = function () {
            if (el.tagName === 'IMG') {
                el.src = newUrl;
            } else {
                el.style.backgroundImage = "url('" + newUrl + "')";
            }
            requestAnimationFrame(function () {
                el.style.filter = 'blur(0) brightness(1)';
            });
        };
        img.onerror = function () {
            el.style.filter = 'blur(0) brightness(1)';
        };
        img.src = newUrl;
    }

    // Run after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init();
            listenForLiveUpdates();
        });
    } else {
        init();
        listenForLiveUpdates();
    }
})();
