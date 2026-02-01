/**
 * SANTIS CONTROL CENTER - CORE LOGIC
 * Manages product data and creates downloadable file.
 */

let localCatalog = [];

// 1. INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    if (typeof productCatalog !== 'undefined') {
        localCatalog = [...productCatalog]; // Clone Data
        renderTable();
        updateStats();
    } else {
        alert("Ürün verisi yüklenemedi! product-data.js dosyasını kontrol edin.");
    }
});

// 2. RENDER TABLE
function renderTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    // Sort by ID descending (Newest first)
    const sorted = [...localCatalog].sort((a, b) => b.id - a.id);

    sorted.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="../assets/img/cards/${p.img}" onerror="this.src='https://placehold.co/40x40?text=?'"></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.cat}</td>
            <td>${p.price}</td>
            <td>${p.badge ? `<span style="color:#d4af37">${p.badge}</span>` : '-'}</td>
            <td>
                <button class="btn btn-outline" style="padding:4px 8px; font-size:11px" onclick="editProduct(${p.id})">✏️</button>
                <button class="btn btn-danger" style="padding:4px 8px; font-size:11px" onclick="deleteProduct(${p.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateStats() {
    document.getElementById('total-count').innerText = localCatalog.length;
    const cats = new Set(localCatalog.map(p => p.cat));
    document.getElementById('cat-count').innerText = cats.size;
}

// 3. EDIT & ADD
let editingId = null;

function openModal() {
    editingId = null; // New Mode
    document.getElementById('modal-title').innerText = "Yeni Ürün Ekle";
    document.getElementById('modal').classList.add('active');

    // Clear Form
    document.querySelectorAll('input, select, textarea').forEach(el => el.value = '');

    // Default cat selection
    document.getElementById('inp-cat').value = 'face-youth';
}

function editProduct(id) {
    editingId = id;
    const p = localCatalog.find(item => item.id == id);
    if (!p) return;

    document.getElementById('modal-title').innerText = "Ürün Düzenle: #" + id;
    document.getElementById('modal').classList.add('active');

    // Fill Form
    document.getElementById('inp-name').value = p.name;
    document.getElementById('inp-cat').value = p.cat;
    document.getElementById('inp-price').value = p.price;
    document.getElementById('inp-img').value = p.img;
    document.getElementById('inp-badge').value = p.badge || "";
    document.getElementById('inp-desc').value = p.desc;
    document.getElementById('inp-benefit').value = p.benefit || "";
    document.getElementById('inp-usage').value = p.usage || "";
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function saveProduct() {
    const data = {
        name: document.getElementById('inp-name').value,
        cat: document.getElementById('inp-cat').value,
        price: document.getElementById('inp-price').value,
        img: document.getElementById('inp-img').value,
        badge: document.getElementById('inp-badge').value,
        desc: document.getElementById('inp-desc').value,
        benefit: document.getElementById('inp-benefit').value,
        usage: document.getElementById('inp-usage').value
    };

    if (!data.name || !data.img) {
        alert("Ürün adı ve görsel zorunludur!");
        return;
    }

    if (editingId) {
        // UPDATE
        const idx = localCatalog.findIndex(p => p.id == editingId);
        if (idx > -1) {
            localCatalog[idx] = { ...localCatalog[idx], ...data };
        }
    } else {
        // CREATE NEW
        const newId = localCatalog.length > 0 ? Math.max(...localCatalog.map(p => p.id)) + 1 : 1;
        localCatalog.push({ id: newId, ...data });
    }

    renderTable();
    updateStats();
    closeModal();
    alert(editingId ? "Ürün güncellendi!" : "Yeni ürün eklendi!");
}

function deleteProduct(id) {
    if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
        localCatalog = localCatalog.filter(p => p.id != id);
        renderTable();
        updateStats();
    }
}

// 4. EXPORT / DOWNLOAD
function exportData() {
    // Helper function source code (needs to be included in the file)
    const helperCode = `
function getCatName(cat) {
    const map = {
        'face-youth': 'Yüz / Gençlik', 'face-hydra': 'Yüz / Nem', 'face-detox': 'Yüz / Detox',
        'face-men': 'Erkek Bakımı', 'body-slim': 'Vücut / İncelme', 'body-care': 'Vücut Bakımı',
        'sun-care': 'Güneş Serisi', 'organics': 'Organik Seri', 'home-textile': 'Santis Home',
        'home-aroma': 'Aromaterapi', 'home-gift': 'Hediye',
        'campaign': '🔥 Fırsat Köşesi', 'accessory': 'Aksesuar & Yan Ürünler'
    };
    return map[cat] || 'Koleksiyon';
}`;

    const fileContent = `
// SANTIS CLUB - PRODUCT CATALOG DATABASE
// Generated by Control Center at ${new Date().toLocaleString()}

const productCatalog = ${JSON.stringify(localCatalog, null, 4)};

${helperCode}
`;

    downloadFile(fileContent, "product-data.js");
}

/* --- SYSTEM SETTINGS LOGIC --- */

/* --- BLOG SYSTEM LOGIC --- */

let localBlog = [];

function initBlog() {
    if (typeof blogCatalog !== 'undefined') {
        localBlog = [...blogCatalog];
        renderBlogTable();
    } else {
        alert("Blog verisi bulunamadı! assets/js/blog-data.js dosyasını kontrol edin.");
    }
}

function renderBlogTable() {
    const tbody = document.getElementById('blog-table-body');
    tbody.innerHTML = '';

    // Sort Newest First
    const sorted = [...localBlog].sort((a, b) => b.id - a.id);

    sorted.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="../assets/img/blog/${p.img}" onerror="this.src='https://placehold.co/40x40?text=?'"></td>
            <td><strong>${p.title}</strong></td>
            <td>${p.category}</td>
            <td>${p.date}</td>
            <td>
                <button class="btn btn-outline" style="padding:4px 8px; font-size:11px" onclick="editBlog(${p.id})">✏️</button>
                <button class="btn btn-danger" style="padding:4px 8px; font-size:11px" onclick="deleteBlog(${p.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function switchTab(tabName) {
    // Hide all
    document.querySelectorAll('main.content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));

    // Show target
    if (tabName === 'products') {
        document.getElementById('view-products').classList.remove('hidden');
        document.getElementById('tab-products').classList.add('active');
    } else if (tabName === 'settings') {
        document.getElementById('view-settings').classList.remove('hidden');
        document.getElementById('tab-settings').classList.add('active');
        initSettings();
    } else if (tabName === 'services') {
        document.getElementById('view-services').classList.remove('hidden');
        document.getElementById('tab-services').classList.add('active');
        initServices();
    } else if (tabName === 'blog') {
        document.getElementById('view-blog').classList.remove('hidden');
        document.getElementById('tab-blog').classList.add('active');
        initBlog();
    }
}

// BLOG CRUD
let editingBlogId = null;

/* --- SERVICES SYSTEM LOGIC --- */
let localHammam = [];
let localMassages = [];
let localSkincare = [];

function initServices() {
    if (typeof NV_HAMMAM !== 'undefined') localHammam = [...NV_HAMMAM];
    if (typeof NV_MASSAGES !== 'undefined') localMassages = [...NV_MASSAGES];
    if (typeof NV_SKINCARE !== 'undefined') localSkincare = [...NV_SKINCARE];
    renderServiceTable('all');
}

function renderServiceTable(filter) {
    const tbody = document.getElementById('service-table-body');
    tbody.innerHTML = '';

    let items = [];
    if (filter === 'all' || filter === 'hammam') items = items.concat(localHammam.map(i => ({ ...i, type: 'hammam' })));
    if (filter === 'all' || filter === 'massage') items = items.concat(localMassages.map(i => ({ ...i, type: 'massage' })));
    if (filter === 'all' || filter === 'skincare') items = items.concat(localSkincare.map(i => ({ ...i, type: 'skincare' })));

    items.forEach(svc => {
        const specialBadge = svc.isSpecial ? '<span style="background:orange; color:white; padding:2px 6px; border-radius:4px; font-size:10px;">🔥 FIRSAT</span>' : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge" style="background:#eee">${svc.type.toUpperCase()}</span></td>
            <td><strong>${svc.title}</strong></td>
            <td>${svc.duration} / ${svc.price}</td>
            <td>${specialBadge}</td>
            <td>
                <button class="btn btn-outline" style="padding:4px 8px;" onclick="editService('${svc.id}', '${svc.type}')">✏️</button>
                <button class="btn btn-danger" style="padding:4px 8px;" onclick="deleteService('${svc.id}', '${svc.type}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Service CRUD
let editingSvcId = null;
let editingSvcType = null;

function openServiceModal() {
    editingSvcId = null;
    document.getElementById('service-modal-title').innerText = "Yeni Hizmet Ekle";
    document.getElementById('service-modal').classList.add('active');
    // ... Clear logic ...
}

function editService(id, type) {
    editingSvcId = id;
    editingSvcType = type;

    let list = (type === 'hammam') ? localHammam : (type === 'massage') ? localMassages : localSkincare;
    const s = list.find(i => i.id == id);
    if (!s) return;

    document.getElementById('service-modal').classList.add('active');
    document.getElementById('svc-type').value = type;
    document.getElementById('svc-title').value = s.title;
    document.getElementById('svc-duration').value = s.duration;
    document.getElementById('svc-price').value = s.price;
    document.getElementById('svc-desc').value = s.desc;
    document.getElementById('svc-special').checked = s.isSpecial || false;
}

function closeServiceModal() {
    document.getElementById('service-modal').classList.remove('active');
}

function saveService() {
    const type = document.getElementById('svc-type').value;
    const data = {
        title: document.getElementById('svc-title').value,
        duration: document.getElementById('svc-duration').value,
        price: document.getElementById('svc-price').value,
        desc: document.getElementById('svc-desc').value,
        isSpecial: document.getElementById('svc-special').checked
    };

    let list = (type === 'hammam') ? localHammam : (type === 'massage') ? localMassages : localSkincare;

    if (editingSvcId) {
        // Update
        const idx = list.findIndex(i => i.id == editingSvcId);
        if (idx > -1) list[idx] = { ...list[idx], ...data };
    } else {
        // Create
        const newId = type.charAt(0) + (Math.floor(Math.random() * 1000));
        list.push({ id: newId, tier: 'NEW', img: 'default.jpg', category: type + 'New', ...data });
    }

    // Sync back to globals if needed, but we use local vars
    renderServiceTable('all');
    closeServiceModal();
    alert("Hizmet güncellendi!");
}

function exportServiceData() {
    const content = `// SANTIS CLUB - SERVICES DATABASE
// Generated by Control Center at ${new Date().toLocaleString()}

const NV_HAMMAM = ${JSON.stringify(localHammam, null, 4)};
const NV_HAMMAM_CATEGORY_LABELS = { "hammam": "Hamam Ritüelleri" };
const NV_HAMMAM_CATEGORY_ORDER = ["hammam"];

const NV_MASSAGES = ${JSON.stringify(localMassages, null, 4)};
const NV_MASSAGES_CATEGORY_LABELS = { "classicMassages": "Klasik Masajlar", "asianMassages": "Uzak Doğu", "sportsTherapy": "Spor & Terapi", "signatureCouples": "İmza & Çift" };
const NV_MASSAGES_CATEGORY_ORDER = ["classicMassages", "asianMassages", "sportsTherapy", "signatureCouples"];

const NV_SKINCARE = ${JSON.stringify(localSkincare, null, 4)};
const NV_SKINCARE_CATEGORY_LABELS = { "faceSothys": "Sothys Yüz Bakımları" };
const NV_SKINCARE_CATEGORY_ORDER = ["faceSothys"];
`;
    downloadFile(content, "services-data.js");
}


function openBlogModal() {
    editingBlogId = null;
    document.getElementById('blog-modal-title').innerText = "Yeni Yazı Ekle";
    document.getElementById('blog-modal').classList.add('active');

    // Clear
    document.getElementById('blog-title').value = '';
    document.getElementById('blog-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('blog-img').value = '';
    document.getElementById('blog-summary').value = '';
    document.getElementById('blog-content').value = '';
}

function editBlog(id) {
    editingBlogId = id;
    const p = localBlog.find(item => item.id == id);
    if (!p) return;

    document.getElementById('blog-modal-title').innerText = "Yazı Düzenle: #" + id;
    document.getElementById('blog-modal').classList.add('active');

    document.getElementById('blog-title').value = p.title;
    document.getElementById('blog-cat').value = p.category;
    document.getElementById('blog-date').value = p.date;
    document.getElementById('blog-img').value = p.img;
    document.getElementById('blog-summary').value = p.summary;
    document.getElementById('blog-content').value = p.content;
}

function closeBlogModal() {
    document.getElementById('blog-modal').classList.remove('active');
}

function saveBlog() {
    const data = {
        title: document.getElementById('blog-title').value,
        category: document.getElementById('blog-cat').value,
        date: document.getElementById('blog-date').value,
        img: document.getElementById('blog-img').value,
        summary: document.getElementById('blog-summary').value,
        content: document.getElementById('blog-content').value
    };

    if (!data.title) { alert("Başlık zorunludur!"); return; }

    if (editingBlogId) {
        // Update
        const idx = localBlog.findIndex(p => p.id == editingBlogId);
        if (idx > -1) {
            localBlog[idx] = { ...localBlog[idx], ...data };
        }
    } else {
        // Create
        const newId = localBlog.length > 0 ? Math.max(...localBlog.map(p => p.id)) + 1 : 1;
        localBlog.push({ id: newId, ...data });
    }

    renderBlogTable();
    closeBlogModal();
    alert("Yazı kaydedildi!");
}

function deleteBlog(id) {
    if (confirm("Bu yazıyı silmek istediğinize emin misiniz?")) {
        localBlog = localBlog.filter(p => p.id != id);
        renderBlogTable();
    }
}

function exportBlogData() {
    const content = `// SANTIS CLUB - BLOG & NEWS DATABASE
// Generated by Control Center at ${new Date().toLocaleString()}

const blogCatalog = ${JSON.stringify(localBlog, null, 4)};
`;
    downloadFile(content, "blog-data.js");
}

function initSettings() {
    if (typeof SITE_SETTINGS === 'undefined') {
        alert("Ayar dosyası (settings-data.js) bulunamadı!");
        return;
    }

    document.getElementById('set-whatsapp').value = SITE_SETTINGS.contact.whatsapp;
    document.getElementById('set-phone').value = SITE_SETTINGS.contact.phone;
    document.getElementById('set-email').value = SITE_SETTINGS.contact.email;
    document.getElementById('set-instagram').value = SITE_SETTINGS.social.instagram;
    document.getElementById('set-facebook').value = SITE_SETTINGS.social.facebook;

    document.getElementById('set-maintenance').checked = SITE_SETTINGS.features.maintenanceMode;
    document.getElementById('set-price').checked = SITE_SETTINGS.features.showPrice;
}

function saveSettings() {
    const newSettings = {
        contact: {
            whatsapp: document.getElementById('set-whatsapp').value,
            phone: document.getElementById('set-phone').value,
            email: document.getElementById('set-email').value,
            address: SITE_SETTINGS.contact.address // Keep existing
        },
        social: {
            instagram: document.getElementById('set-instagram').value,
            facebook: document.getElementById('set-facebook').value
        },
        features: {
            maintenanceMode: document.getElementById('set-maintenance').checked,
            showPrice: document.getElementById('set-price').checked,
            enableBooking: true
        },
        seo: SITE_SETTINGS.seo
    };

    const content = `// SANTIS CLUB - SYSTEM SETTINGS
// Generated by Control Center at ${new Date().toLocaleString()}

const SITE_SETTINGS = ${JSON.stringify(newSettings, null, 4)};
`;

    downloadFile(content, "settings-data.js");
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(filename + " indirildi!\n\nLütfen assets/js klasörüne kopyalayın.");
}
