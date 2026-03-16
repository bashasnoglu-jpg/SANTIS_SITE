/**
 * ═══════════════════════════════════════════════════════════════
 * SANTIS ADMIN NAVIGATION v1.0 — "Sovereign Breadcrumb Engine"
 * ═══════════════════════════════════════════════════════════════
 * 
 * Bu script tüm admin sayfalarına otomatik olarak:
 *   1. Geri Dönüş butonu (← Back to Hub)
 *   2. Breadcrumb navigasyon çubuğu
 *   3. Hızlı sayfa geçiş dropdown menüsü
 * 
 * Kullanım: <script src="/admin/assets/js/admin-nav.js" defer></script>
 * Herhangi bir admin sayfasının <head> veya <body> sonuna eklenebilir.
 */

(function() {
    'use strict';

    // ── Sayfa Haritası ──────────────────────────────────────────
    const ADMIN_PAGES = [
        { name: 'Admin Hub',        href: '/admin/index.html',             icon: '⎈',  group: 'core' },
        { name: 'Command Center',   href: '/admin/command-center.html',    icon: '🎯', group: 'core' },
        { name: "God's Eye",        href: '/admin/gods-eye-vision.html',          icon: '👁️', group: 'core' },
        { name: "God's Eye Vision", href: '/admin/gods-eye-vision.html',   icon: '🔮', group: 'core' },
        { name: 'God Mode',         href: '/admin/god-mode.html',          icon: '⚡', group: 'core' },
        { name: 'Boardroom',        href: '/admin/boardroom.html',         icon: '♟️', group: 'intel' },
        { name: 'CRM',              href: '/admin/crm.html',              icon: '💎', group: 'intel' },
        { name: 'Revenue',          href: '/admin/revenue.html',           icon: '📈', group: 'intel' },
        { name: 'Bookings',         href: '/admin/bookings.html',          icon: '📋', group: 'intel' },
        { name: 'Hotels',           href: '/admin/hotels.html',            icon: '🏨', group: 'intel' },
        { name: 'Dashboard',        href: '/admin/dashboard.html',         icon: '📊', group: 'intel' },
        { name: 'Gallery Upload',   href: '/admin/gallery-upload.html',    icon: '🖼️', group: 'tools' },
        { name: 'Sovereign Lab',    href: '/admin/sovereign-lab.html',     icon: '🧪', group: 'tools' },
        { name: 'Black Room',       href: '/admin/black-room.html',        icon: '🦾', group: 'tools' },
    ];

    const GROUP_LABELS = {
        core:  'Komuta Merkezi',
        intel: 'İstihbarat',
        tools: 'Araçlar'
    };

    // ── Mevcut Sayfayı Bul ──────────────────────────────────────
    const currentPath = window.location.pathname;
    const normalizedPath = currentPath.endsWith('/') ? currentPath + 'index.html' : currentPath;
    const currentPage = ADMIN_PAGES.find(p => normalizedPath.endsWith(p.href));
    const currentName = currentPage ? currentPage.name : document.title.split(' – ')[0] || 'Sayfa';

    // Admin Hub'daysa navbar enjekte etme (zaten sidebar var)
    if (normalizedPath.endsWith('/admin/index.html') || currentName === 'Admin Hub') return;

    const buildAdminNav = () => {
        // ── Stil Enjeksiyonu ────────────────────────────────────────
        const style = document.createElement('style');
        style.textContent = `
            #sov-admin-breadcrumb {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 9999;
                height: 36px;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(201, 169, 110, 0.15);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                font-family: 'Inter', 'Segoe UI', sans-serif;
                font-size: 11px;
                color: #9ca3af;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            }

            #sov-admin-breadcrumb .sov-back-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #C9A96E;
                font-weight: 600;
                cursor: pointer;
                padding: 4px 10px;
                border-radius: 6px;
                border: 1px solid rgba(201, 169, 110, 0.3);
                background: rgba(201, 169, 110, 0.08);
                transition: all 0.15s ease;
                text-decoration: none;
                font-size: 11px;
                letter-spacing: 0.05em;
            }
            #sov-admin-breadcrumb .sov-back-btn:hover {
                background: rgba(201, 169, 110, 0.2);
                border-color: rgba(201, 169, 110, 0.5);
                color: #e0c88a;
            }

            #sov-admin-breadcrumb .sov-breadcrumb-trail {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            #sov-admin-breadcrumb .sov-breadcrumb-trail a {
                color: #6b7280;
                text-decoration: none;
                transition: color 0.15s;
            }
            #sov-admin-breadcrumb .sov-breadcrumb-trail a:hover {
                color: #C9A96E;
            }
            #sov-admin-breadcrumb .sov-breadcrumb-trail .sov-bc-current {
                color: #e5e7eb;
                font-weight: 600;
            }
            #sov-admin-breadcrumb .sov-breadcrumb-trail .sov-bc-sep {
                color: #374151;
                margin: 0 2px;
            }

            /* Hızlı Geçiş Dropdown */
            #sov-admin-breadcrumb .sov-quick-nav {
                position: relative;
            }
            #sov-admin-breadcrumb .sov-quick-nav-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 3px 8px;
                border-radius: 4px;
                border: 1px solid rgba(255,255,255,0.05);
                background: rgba(255,255,255,0.03);
                color: #9ca3af;
                cursor: pointer;
                font-size: 10px;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                transition: all 0.15s;
            }
            #sov-admin-breadcrumb .sov-quick-nav-btn:hover {
                background: rgba(255,255,255,0.08);
                color: #e5e7eb;
            }

            #sov-admin-breadcrumb .sov-quick-dropdown {
                display: none;
                position: absolute;
                top: 32px;
                right: 0;
                width: 220px;
                background: #111;
                border: 1px solid rgba(201,169,110,0.2);
                border-radius: 8px;
                box-shadow: 0 15px 50px rgba(0,0,0,0.8);
                padding: 6px;
                z-index: 10000;
                max-height: 400px;
                overflow-y: auto;
            }
            #sov-admin-breadcrumb .sov-quick-dropdown.open { display: block; }
            #sov-admin-breadcrumb .sov-quick-dropdown .sov-dd-label {
                padding: 6px 10px 2px;
                font-size: 9px;
                color: #4b5563;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                font-weight: 700;
            }
            #sov-admin-breadcrumb .sov-quick-dropdown a {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 7px 10px;
                border-radius: 5px;
                color: #9ca3af;
                text-decoration: none;
                font-size: 11px;
                transition: all 0.1s;
            }
            #sov-admin-breadcrumb .sov-quick-dropdown a:hover {
                background: rgba(201,169,110,0.1);
                color: #C9A96E;
            }
            #sov-admin-breadcrumb .sov-quick-dropdown a.sov-dd-active {
                background: rgba(201,169,110,0.15);
                color: #C9A96E;
                font-weight: 600;
            }

            /* Sayfa içeriğini aşağı it — breadcrumb yüksekliği kadar */
            body { padding-top: 36px !important; }
        `;
        document.head.appendChild(style);

        // ── Breadcrumb DOM ──────────────────────────────────────────
        const bar = document.createElement('div');
        bar.id = 'sov-admin-breadcrumb';

        // Sol: Geri Butonu + Breadcrumb
        const leftSide = document.createElement('div');
        leftSide.style.cssText = 'display:flex;align-items:center;gap:12px;';

        const backBtn = document.createElement('a');
        backBtn.className = 'sov-back-btn';
        backBtn.href = '/admin/index.html';
        backBtn.innerHTML = '← HUB';
        backBtn.title = 'Admin Hub\'a Dön';
        leftSide.appendChild(backBtn);

        const trail = document.createElement('div');
        trail.className = 'sov-breadcrumb-trail';
        trail.innerHTML = `
            <a href="/admin/index.html">Admin</a>
            <span class="sov-bc-sep">›</span>
            <span class="sov-bc-current">${currentName}</span>
        `;
        leftSide.appendChild(trail);
        bar.appendChild(leftSide);

        // Sağ: Hızlı Geçiş + Site Linki
        const rightSide = document.createElement('div');
        rightSide.style.cssText = 'display:flex;align-items:center;gap:8px;';

        // Hızlı Geçiş Dropdown
        const quickNav = document.createElement('div');
        quickNav.className = 'sov-quick-nav';

        const quickBtn = document.createElement('button');
        quickBtn.className = 'sov-quick-nav-btn';
        quickBtn.innerHTML = '⚡ Hızlı Geçiş ▾';
        quickNav.appendChild(quickBtn);

        const dropdown = document.createElement('div');
        dropdown.className = 'sov-quick-dropdown';

        let lastGroup = '';
        ADMIN_PAGES.forEach(page => {
            if (page.group !== lastGroup) {
                const label = document.createElement('div');
                label.className = 'sov-dd-label';
                label.textContent = GROUP_LABELS[page.group] || page.group;
                dropdown.appendChild(label);
                lastGroup = page.group;
            }
            const a = document.createElement('a');
            a.href = page.href;
            a.innerHTML = `<span>${page.icon}</span> ${page.name}`;
            if (currentPage && page.href === currentPage.href) {
                a.classList.add('sov-dd-active');
            }
            dropdown.appendChild(a);
        });
        quickNav.appendChild(dropdown);
        rightSide.appendChild(quickNav);

        // Site Linki
        const siteLink = document.createElement('a');
        siteLink.href = '/tr/index.html';
        siteLink.target = '_blank';
        siteLink.style.cssText = 'color:#6b7280;font-size:10px;padding:3px 8px;border:1px solid rgba(255,255,255,0.05);border-radius:4px;text-decoration:none;transition:all 0.15s;';
        siteLink.textContent = '🌍 Site';
        siteLink.onmouseover = () => { siteLink.style.color = '#10b981'; };
        siteLink.onmouseout = () => { siteLink.style.color = '#6b7280'; };
        rightSide.appendChild(siteLink);

        bar.appendChild(rightSide);

        // ── Body'ye Enjekte Et ──────────────────────────────────────
        document.body.prepend(bar);

        // Dropdown Toggle
        quickBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => dropdown.classList.remove('open'));

        // Keyboard shortcut: Alt+← = Geri dön
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                window.location.href = '/admin/index.html';
            }
        });

        console.log(`🧭 [Admin Nav] Breadcrumb mounted: ${currentName} — Alt+← for Hub`);
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(buildAdminNav);
    } else {
        setTimeout(buildAdminNav, 100);
    }
})();
