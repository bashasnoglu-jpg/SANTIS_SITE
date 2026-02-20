/**
 * SANTIS GALLERY LOADER (V3.0 - JSON PRO)
 * Logic: JSON-Managed Data with Scatter Layout & Live Sync
 */

console.log("🖼️ Santis Gallery Loader v3 (JSON Mode) Starting...");

// Global State
window.galleryState = {
    data: [],
    filter: 'all'
};

/* ===============================
   1️⃣ JSON'DAN GALERİYİ YÜKLE
================================ */
/* ===============================
   1️⃣ JSON'DAN GALERİYİ YÜKLE
================================ */
async function hydrateGalleryData() {
    try {
        // Use SITE_ROOT if available (subpages), matches standard Santis pattern
        // Fallback to simple relative path if needed for root index
        let root = window.SITE_ROOT || "";
        if (!root && window.location.pathname.split('/').length > 2) {
            root = "../";
        }

        // Try to fetch
        const targets = [
            "/assets/data/gallery-data.json",
            root + "assets/data/gallery-data.json"
        ];

        let loadedData = null;

        for (const url of targets) {
            try {
                const res = await fetch(url + "?t=" + Date.now());
                if (res.ok) {
                    loadedData = await res.json();
                    console.log(`🟢 [Gallery] Loaded from: ${url}`);
                    break;
                }
            } catch (e) { /* continue */ }
        }

        if (!loadedData) throw new Error("All JSON paths failed.");

        // Update State
        window.galleryState.data = loadedData;
        window.GALLERY_DATA = loadedData;

        console.log("🟢 [Gallery] Hydration Complete:", loadedData.length, "items");
    } catch (err) {
        console.warn("🟠 [Gallery] JSON load failed, trying legacy fallback...", err);

        // Legacy fallback (eski gallery-data.js varsa)
        if (window.GALLERY_DATA && Array.isArray(window.GALLERY_DATA)) {
            window.galleryState.data = window.GALLERY_DATA;
            console.log("🟡 [Gallery] Using legacy JS fallback:", window.GALLERY_DATA.length, "items");
        } else {
            console.error("🔴 [Gallery] No data source found. Ensure '/assets/data/gallery-data.json' exists.");
        }
    }
}

/* ===============================
   2️⃣ GALERİYİ EKRANA ÇİZ (SCATTER MODE)
================================ */
function renderGallery(filter = 'all') {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    // Filter Data
    const items = filter === 'all'
        ? window.galleryState.data
        : window.galleryState.data.filter(i => i.category === filter);

    // Always use absolute path — prevents /tr/assets/ prefix errors
    const rootPath = "/";

    // Clear
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:100px; color:#666;">Bu kategoride görsel bulunamadı.</div>';
        return;
    }

    items.forEach((item, index) => {
        // --- SCATTER LOGIC (The "Akıl" Part) ---
        // Cycle through 6-step pattern based on VISIBLE INDEX
        const i = index % 6;
        let layoutClass = '';

        if (i === 0) layoutClass = 'g-hero';
        else if (i === 1) layoutClass = 'g-detail';
        else if (i === 2) layoutClass = 'g-wide';
        else if (i === 3) layoutClass = 'g-overlap-left';
        else if (i === 4) layoutClass = 'g-overlap-right';
        else if (i === 5) layoutClass = 'g-spacer';

        // Element Creation
        const card = document.createElement('div');
        card.className = `gallery-item ${layoutClass}`;
        card.setAttribute('data-mood', item.mood || 'calm');

        const imgPath = `/assets/img/gallery/${item.file}`;

        card.innerHTML = `
            <img 
                src="${imgPath}" 
                alt="${item.caption || 'Santis Gallery'}" 
                loading="lazy" 
                decoding="async"
            >
            <div class="gallery-overlay">
                <span class="mood-badge">${item.category || 'SANTIS'}</span>
                <span class="caption-text">${item.caption || ''}</span>
            </div>
        `;

        // Lightbox Event
        if (typeof openLightbox === 'function') {
            card.addEventListener('click', () => openLightbox(imgPath, item.caption));
        }

        grid.appendChild(card);
    });

    console.log("🖼️ [Gallery] Rendered:", items.length, "items (Filter: " + filter + ")");
}

/* ===============================
   3️⃣ FİLTRE OLUŞTURUCU
================================ */
function generateFilters() {
    const filterContainer = document.querySelector('.filter-bar');
    if (!filterContainer || window.galleryState.data.length === 0) return;

    const categories = ['all', ...new Set(window.galleryState.data.map(i => i.category))];
    const labels = {
        'all': 'Tümü',
        'hamam': 'Hamam Ritüelleri',
        'massage': 'Masaj Terapileri',
        'skincare': 'Cilt & Yüz',
        'ambiance': 'Mekan & Atmosfer',
        'yoga': 'Yoga & Denge'
    };

    filterContainer.innerHTML = categories.map(cat => `
        <button class="filter-btn ${cat === 'all' ? 'active' : ''}" data-filter="${cat}">
            ${labels[cat] || cat.toUpperCase()}
        </button>
    `).join('');

    // Bind Click
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('data-filter');

            // UI Toggle
            filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update State
            window.galleryState.filter = filter;

            // Trigger Animation
            const grid = document.getElementById('gallery-grid');
            if (grid) {
                smoothFilterTransition(grid, filter);
            } else {
                renderGallery(filter);
            }
        });
    });
}

// ✨ SMOOTH FILTER ENGINE
function smoothFilterTransition(grid, filter) {
    // 1. Fade Out
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(15px)';

    setTimeout(() => {
        // 2. Re-Render
        renderGallery(filter);

        // 3. Fade In (with slight delay for DOM paint)
        requestAnimationFrame(() => {
            grid.style.opacity = '1';
            grid.style.transform = 'translateY(0)';
        });
    }, 300);
}

/* ===============================
   4️⃣ SİSTEMİ BAŞLAT
================================ */
async function initGallerySystem() {
    await hydrateGalleryData();
    renderGallery();
    generateFilters();

    // Setup Lightbox if needed
    setupLightbox();
}

function setupLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) {
        // Close event
        lb.querySelector('.lightbox-close')?.addEventListener('click', () => lb.style.display = 'none');
        lb.addEventListener('click', (e) => {
            if (e.target === lb) lb.style.display = 'none';
        });
    }
}

// Global hook for lightbox
// Global hook for lightbox
window.openLightbox = function (src, cap) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const txt = document.getElementById('caption');

    if (lb && img) {
        // Reset State
        img.style.transform = 'scale(0.9)';
        img.style.opacity = '0';
        lb.style.display = 'flex'; // Make visible first

        // Load Image
        img.src = src;
        if (txt) txt.innerText = cap || '';

        // Animate In
        setTimeout(() => {
            lb.classList.add('is-active'); // Add class for backdrop blur transition
            img.style.transform = 'scale(1)';
            img.style.opacity = '1';
        }, 10);
    }
}

// Close Logic
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        const lb = document.getElementById('lightbox');
        if (lb) lb.style.display = 'none';
    }
});

document.addEventListener("DOMContentLoaded", initGallerySystem);

/* ===============================
   5️⃣ LIVE SYNC LISTENER
================================ */
if (window.SantisBrain && typeof window.SantisBrain.listen === "function") {

    // Listen for Generic File Updates
    window.SantisBrain.listen("update", async (payload) => {
        // payload = { type: 'update', file: '/assets/data/gallery-data.json' } or flattened
        const file = payload.file || (typeof payload === 'string' ? payload : '');

        if (file.includes("gallery-data.json")) {
            console.log("♻️ [Gallery] Live update detected, reloading...");

            // Show Hologram Toast
            showHoloToast();

            // Re-Hydrate & Re-Render
            await hydrateGalleryData();
            renderGallery(window.galleryState.filter);
        }
    });
}

// Visual Toast Helper
function showHoloToast() {
    const toast = document.createElement('div');
    toast.className = 'holo-toast';
    toast.innerHTML = `<span style="font-size:20px;">📡</span> <strong>CANLI GALERİ GÜNCELLENDİ</strong>`;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '30px', right: '30px',
        background: 'rgba(20, 20, 20, 0.9)', border: '1px solid #d4af37',
        color: '#fff', padding: '15px 25px', borderRadius: '8px',
        zIndex: '9999', backdropFilter: 'blur(10px)',
        transform: 'translateY(100px)', opacity: '0', transition: 'all 0.5s'
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
