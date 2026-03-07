/**
 * SANTIS GALLERY LOADER (v2.0)
 * Logic: JS-Driven Layout (Masonry/Scatter) for Robust Filtering
 */

function initGallery() {
    // 1. Guard
    if (!window.GALLERY_DATA) {
        if (!window.__GALLERY_RETRY) {
            window.__GALLERY_RETRY = true;
            setTimeout(initGallery, 500);
            return;
        }
        return;
    }

    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    // 2. Setup State
    window.galleryState = {
        filter: 'all',
        data: window.GALLERY_DATA
    };

    // 3. Render Initial
    renderGallery(window.galleryState.data);

    // 4. Generate Filter UI (Smart)
    generateFilters();
}

function generateFilters() {
    const filterContainer = document.querySelector('.filter-bar');
    if (!filterContainer) return; // Hook into existing container if present

    // Extract unique categories
    const categories = ['all', ...new Set(window.GALLERY_DATA.map(i => i.category))];

    // Auto-translate labels
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
            const filter = e.target.dataset.filter;

            // UI Toggle
            filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Logic
            filterGallery(filter);
        });
    });
}

function filterGallery(category) {
    const grid = document.getElementById('gallery-grid');

    // 1. Fade Out
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(20px)';

    setTimeout(() => {
        // 2. Filter Data
        const filtered = category === 'all'
            ? window.GALLERY_DATA
            : window.GALLERY_DATA.filter(i => i.category === category);

        // 3. Re-Render
        renderGallery(filtered);

        // 4. Fade In
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
    }, 300); // Wait for transition
}

function renderGallery(items) {
    const grid = document.getElementById('gallery-grid');
    const rootPath = window.SITE_ROOT || '';

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

        const imgPath = `${rootPath}assets/img/gallery/${item.file}`;

        card.innerHTML = `
            <img 
                src="${imgPath}" 
                alt="${item.caption}" 
                loading="lazy" 
                decoding="async"
            >
            <div class="gallery-overlay">
                <span class="mood-badge">${item.category || 'SANTIS'}</span>
                <span class="caption-text">${item.caption}</span>
            </div>
        `;

        // Lightbox Event
        card.addEventListener('click', () => openLightbox(imgPath, item.caption));

        grid.appendChild(card);
    });
}

function openLightbox(src, cap) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const txt = document.getElementById('caption');

    if (lb && img) {
        img.src = src;
        if (txt) txt.innerText = cap || '';
        lb.style.display = 'flex';
    }
}

// Lightbox Close Logic
document.addEventListener('DOMContentLoaded', () => {
    const lb = document.getElementById('lightbox');
    if (lb) {
        lb.querySelector('.lightbox-close').addEventListener('click', () => {
            lb.style.display = 'none';
        });
        lb.addEventListener('click', (e) => {
            if (e.target === lb) lb.style.display = 'none';
        });
    }

    initGallery();
});
