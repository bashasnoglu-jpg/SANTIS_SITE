/**
 * ═══════════════════════════════════════════════════════════════
 * 🍎 SANTIS LIQUID MEGA MENU V1.0 — Apple/Tesla Style Navbar
 * ═══════════════════════════════════════════════════════════════
 *
 * Smooth dropdown mega menu for nav items with [data-menu] attr.
 * Each menu slot shows category-specific content with a
 * full-width glassmorphic panel.
 *
 * CSS: santis.legacy-compat.css (lines 2063-2156) already defines
 *      .santis-liquid-menu-container, .active, .reveal classes.
 *
 * Trigger: hover on [data-menu] nav links
 * Container: #santis-liquid-menu → #liquid-menu-content
 * Overlay: #liquid-nav-overlay
 */

(function SantisLiquidMenu() {
    'use strict';

    if (window._SANTIS_LIQUID_LOADED) return;
    window._SANTIS_LIQUID_LOADED = true;

    const LOG = '🍎 [Liquid Menu]';

    // ═══════════════════════════════════════════════════════
    // MENU SLOT DEFINITIONS
    // ═══════════════════════════════════════════════════════

    const MenuSlots = {
        hamam: {
            title: 'Hamam Ritüelleri',
            subtitle: 'Osmanlı geleneğinin lüks yorumu',
            links: [
                { label: 'Klasik Hamam', href: '/hamam.html', icon: '♨️' },
                { label: 'Sultan Hamamı', href: '/hamam.html#sultan', icon: '👑' },
                { label: 'Köpük Masajı', href: '/hamam.html#kopuk', icon: '🫧' },
                { label: 'Kese Ritüeli', href: '/hamam.html#kese', icon: '✋' }
            ],
            accent: '#D4AF37'
        },
        masajlar: {
            title: 'Dünya Masajları',
            subtitle: 'Uzak Doğu\'dan Akdeniz\'e uzanan dokunuş',
            links: [
                { label: 'Tüm Masajlar', href: '/masaj.html', icon: '🌍' },
                { label: 'Bali Masajı', href: '/masaj.html#bali', icon: '🌺' },
                { label: 'Hot Stone', href: '/masaj.html#hotstone', icon: '🪨' },
                { label: 'Aromaterapi', href: '/masaj.html#aroma', icon: '🌿' }
            ],
            accent: '#D4AF37'
        },
        cilt: {
            title: 'Cilt Bakımı',
            subtitle: 'Sothys Paris ile profesyonel bakım',
            links: [
                { label: 'Tüm Bakımlar', href: '/cilt-bakimi.html', icon: '✨' },
                { label: 'Anti-Age', href: '/cilt-bakimi.html#antiage', icon: '💎' },
                { label: 'Nemlendirme', href: '/cilt-bakimi.html#hydra', icon: '💧' },
                { label: 'Detox Bakımı', href: '/cilt-bakimi.html#detox', icon: '🌿' }
            ],
            accent: '#D4AF37'
        },
        hakkimizda: {
            title: 'Hakkımızda',
            subtitle: 'Santis Spa & Wellness deneyimi',
            links: [
                { label: 'Hikayemiz', href: '/hakkimizda.html', icon: '📖' },
                { label: 'Sessizlik Manifestosu', href: '/code-of-silence.html', icon: '🤫' },
                { label: 'Spa Menüsü (PDF)', href: '/assets/docs/santis-spa-menu.pdf', icon: '📋', external: true },
                { label: 'İletişim', href: '/hakkimizda.html#contact', icon: '📍' }
            ],
            accent: '#D4AF37'
        }
    };

    // ═══════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════

    let activeMenu = null;
    let hideTimeout = null;
    let menuContainer = null;
    let menuContent = null;
    let overlay = null;

    // ═══════════════════════════════════════════════════════
    // RENDER — Uses existing .liquid-menu-grid, .liquid-link
    // CSS classes from santis.legacy-compat.css
    // ═══════════════════════════════════════════════════════

    function renderSlot(slotKey) {
        const slot = MenuSlots[slotKey];
        if (!slot) return '';

        const linksHTML = slot.links.map(link => `
            <a href="${link.href}" class="flex liquid-link"
               ${link.external ? 'target="_blank" rel="noopener"' : ''}
               style="align-items: center; gap: 12px; font-size: 1.1rem;">
                <span class="text-center" style="font-size: 1.2rem; width: 28px;">${link.icon}</span>
                <span>${link.label}</span>
            </a>
        `).join('');

        return `
            <div class="liquid-menu-grid" style="grid-template-columns: 280px 1fr; gap: 3rem;">
                <div>
                    <p class="liquid-col-title" style="color: ${slot.accent};">✦ ${slot.title}</p>
                    <p style="font-size: 0.82rem; color: rgba(255,255,255,0.35); line-height: 1.6; margin-top: 8px;">
                        ${slot.subtitle}
                    </p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0;">
                    ${linksHTML}
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════
    // SHOW / HIDE — Uses .active and .reveal classes
    // matching existing CSS in santis.legacy-compat.css
    // ═══════════════════════════════════════════════════════

    function showMenu(slotKey) {
        if (!menuContainer || !menuContent) return;
        clearTimeout(hideTimeout);

        if (activeMenu === slotKey) return;
        activeMenu = slotKey;

        // Render content
        menuContent.innerHTML = renderSlot(slotKey);

        // Show container (uses scaleY transform from legacy CSS)
        menuContainer.classList.add('active');
        if (overlay) overlay.classList.add('active');

        // Reveal content with delay
        requestAnimationFrame(() => {
            menuContent.classList.add('reveal');
        });

        // Highlight active trigger
        document.querySelectorAll('.sovereign-link-item[data-menu]').forEach(el => {
            el.classList.toggle('is-mega-active', el.dataset.menu === slotKey);
        });

        console.log(`${LOG} Opened: ${slotKey}`);
    }

    function hideMenu() {
        hideTimeout = setTimeout(() => {
            if (!menuContainer) return;

            // Hide content first, then container
            menuContent.classList.remove('reveal');

            setTimeout(() => {
                menuContainer.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            }, 150);

            document.querySelectorAll('.sovereign-link-item.is-mega-active').forEach(el => {
                el.classList.remove('is-mega-active');
            });

            activeMenu = null;
        }, 200); // 200ms grace period for mouse travel
    }

    function cancelHide() {
        clearTimeout(hideTimeout);
    }

    // ═══════════════════════════════════════════════════════
    // INJECT MINIMAL CSS (only for new elements not in legacy)
    // ═══════════════════════════════════════════════════════

    function injectStyles() {
        if (document.getElementById('liquid-menu-styles')) return;

        const style = document.createElement('style');
        style.id = 'liquid-menu-styles';
        style.textContent = `
            /* Active nav trigger highlight */
            .sovereign-link-item.is-mega-active {
                color: #D4AF37 !important;
            }

            /* Mobile: hide mega menu */
            @media (max-width: 1024px) {
                .santis-liquid-menu-container { display: none !important; }
                #liquid-nav-overlay { display: none !important; }
            }
        `;
        document.head.appendChild(style);
    }

    // ═══════════════════════════════════════════════════════
    // BIND
    // ═══════════════════════════════════════════════════════

    function bind() {
        menuContainer = document.getElementById('santis-liquid-menu');
        menuContent = document.getElementById('liquid-menu-content');
        overlay = document.getElementById('liquid-nav-overlay');

        if (!menuContainer || !menuContent) {
            console.warn(`${LOG} Menu container not found — aborting.`);
            return;
        }

        // Bind hover triggers (nav items with data-menu)
        const triggers = document.querySelectorAll('.sovereign-link-item[data-menu]');
        if (triggers.length === 0) {
            console.warn(`${LOG} No [data-menu] triggers found.`);
            return;
        }

        triggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', () => {
                showMenu(trigger.dataset.menu);
            });

            trigger.addEventListener('mouseleave', () => {
                hideMenu();
            });
        });

        // Keep menu open while hovering over it
        menuContainer.addEventListener('mouseenter', cancelHide);
        menuContainer.addEventListener('mouseleave', hideMenu);

        // Close on overlay click
        if (overlay) {
            overlay.addEventListener('click', () => {
                clearTimeout(hideTimeout);
                menuContent.classList.remove('reveal');
                menuContainer.classList.remove('active');
                overlay.classList.remove('active');
                document.querySelectorAll('.is-mega-active').forEach(el => el.classList.remove('is-mega-active'));
                activeMenu = null;
            });
        }

        console.log(`${LOG} 🦅 Liquid Mega Menu bound to ${triggers.length} triggers.`);
    }

    // ═══════════════════════════════════════════════════════
    // BOOT
    // ═══════════════════════════════════════════════════════

    function boot() {
        injectStyles();

        // Try immediately
        if (document.getElementById('santis-liquid-menu')) {
            bind();
        } else {
            // Wait for dynamic navbar load
            const observer = new MutationObserver((mutations, obs) => {
                if (document.getElementById('santis-liquid-menu')) {
                    bind();
                    obs.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // Fallback timeout
            setTimeout(() => {
                observer.disconnect();
                if (document.getElementById('santis-liquid-menu')) bind();
            }, 5000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
