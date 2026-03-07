/**
 * SANTIS CONTROL CENTER - CORE LOGIC
 * Manages product data and creates downloadable file.
 */

let localCatalog = [];
let isDarkMode = true;

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('light-mode');

    // Update Text
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (isDarkMode) {
        icon.innerText = '🌙';
        text.innerText = 'Karanlık Mod';
    } else {
        icon.innerText = '☀️';
        text.innerText = 'Aydınlık Mod';
    }
}

// 1. INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    if (typeof productCatalog !== 'undefined') {
        localCatalog = [...productCatalog]; // Clone Data
        renderTable();
        updateStats();
    } else {
        alert("Ürün verisi yüklenemedi! product-data.js dosyasını kontrol edin.");
    }

    // 🚀 CHECK BRIDGE STATUS
    checkBridgeStatus();

    // 🛎️ CONCIERGE INIT
    setTimeout(initConcierge, 1500); // Wait for bridge check
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
    alert("Kayıt BAŞARILI (Geçici Hafıza)!\n\nLütfen işleminiz bitince yukarıdaki 'Değişiklikleri İndir' butonuna basmayı UNUTMAYIN.");
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
        document.getElementById('view-blog').classList.remove('hidden');
        document.getElementById('tab-blog').classList.add('active');
        initBlog();
    } else if (tabName === 'social') {
        document.getElementById('view-social').classList.remove('hidden');
        document.getElementById('tab-social').classList.add('active');
        initSocial();
    } else if (tabName === 'gallery') {
        document.getElementById('view-gallery').classList.remove('hidden');
        document.getElementById('tab-gallery').classList.add('active');
        initGallery();
    } else if (tabName === 'home') {
        document.getElementById('view-home').classList.remove('hidden');
        document.getElementById('tab-home').classList.add('active');
        initHomepage();
    }
}

// BLOG CRUD
let editingBlogId = null;

/* --- SERVICES SYSTEM LOGIC (V2.0 - JSON ENGINE) --- */
let serviceCatalog = [];

async function initServices() {
    try {
        // Fetch from the new Single Source of Truth
        const response = await fetch('../data/services.json?t=' + Date.now());
        if (!response.ok) throw new Error("JSON Dosyası okunamadı");

        serviceCatalog = await response.json();
        console.log("✅ Services Loaded:", serviceCatalog.length);
        renderServiceTable('all');
    } catch (e) {
        console.error("Service Load Error:", e);
        // Fallback for demo if file missing logic could go here
        document.getElementById('service-table-body').innerHTML = `<tr><td colspan="5" style="color:red">Veri Yükleme Hatası: ${e.message}</td></tr>`;
    }
}

function renderServiceTable(filter, btn) {
    // 1. Update Buttons
    if (btn) {
        document.querySelectorAll('.filter-bar .btn').forEach(b => {
            b.classList.remove('btn-primary'); b.classList.add('btn-outline');
        });
        btn.classList.remove('btn-outline'); btn.classList.add('btn-primary');
    }

    const tbody = document.getElementById('service-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 2. Filter Logic
    // Mappings: "hammam" -> "massage-classic" in the old UI? No, new schema uses:
    // "massage-classic", "massage-thai", "massage-spa", "care-sothys"

    let items = serviceCatalog;

    if (filter === 'hammam') {
        items = serviceCatalog.filter(i => i.categoryId.includes('hamam') || i.categoryId === 'ritual-hammam');
    } else if (filter === 'massage') {
        items = serviceCatalog.filter(i => i.categoryId.includes('massage'));
    } else if (filter === 'skincare') {
        items = serviceCatalog.filter(i => i.categoryId.includes('face') || i.categoryId.includes('body'));
    }

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Bu kategoride hizmet bulunamadı.</td></tr>';
        return;
    }

    // 3. Render
    items.forEach(svc => {
        const isSpecial = svc.tags && svc.tags.includes('SPECIAL');
        const specialBadge = isSpecial ? '<span style="background:orange; color:white; padding:2px 6px; border-radius:4px; font-size:10px;">🔥 FIRSAT</span>' : '';

        // Safe access for multi-lang title (Use TR as default)
        const title = svc.content.tr.title || "Adsız Hizmet";
        const price = svc.price ? (svc.price.amount + ' ' + svc.price.currency) : "Bilgi Al";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge" style="background:#333; color:#ccc">${svc.categoryId}</span></td>
            <td><strong>${title}</strong></td>
            <td>${svc.duration} dk / ${price}</td>
            <td>${specialBadge}</td>
            <td>
                <button class="btn btn-outline" style="padding:4px 8px;" onclick="editService('${svc.id}')">✏️</button>
                <button class="btn btn-danger" style="padding:4px 8px;" onclick="deleteService('${svc.id}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Service CRUD
let editingSvcId = null;

function openServiceModal() {
    editingSvcId = null;
    document.getElementById('service-modal-title').innerText = "Yeni Hizmet Ekle";
    document.getElementById('service-modal').classList.add('active');

    // Clear Form
    document.getElementById('svc-title').value = '';
    document.getElementById('svc-duration').value = '';
    document.getElementById('svc-price').value = '';
    document.getElementById('svc-desc').value = '';
    document.getElementById('svc-img').value = '';
    // Reset Type to default safely
    const sel = document.getElementById('svc-type');
    if (sel.options.length > 0) sel.selectedIndex = 0;

    document.getElementById('svc-special').checked = false;
}

function editService(id) {
    editingSvcId = id;
    const s = serviceCatalog.find(i => i.id == id);
    if (!s) return;

    document.getElementById('service-modal').classList.add('active');

    // Attempt to map categoryId back to simple UI type selector if possible
    // For now we assume the user picks from the list or we add a hidden field for raw categoryId
    // We will simulate it for now.

    document.getElementById('svc-title').value = s.content.tr.title;
    document.getElementById('svc-duration').value = s.duration;
    document.getElementById('svc-price').value = s.price ? s.price.amount : '';
    document.getElementById('svc-desc').value = s.content.tr.shortDesc; // Using shortDesc as main for edit
    document.getElementById('svc-img').value = s.media.hero || '';
    document.getElementById('svc-special').checked = s.tags && s.tags.includes('SPECIAL');
}

function closeServiceModal() {
    document.getElementById('service-modal').classList.remove('active');
}

function saveService() {
    const rawType = document.getElementById('svc-type').value;
    let finalCatId = 'massage-classic'; // Default
    if (rawType === 'hammam') finalCatId = 'massage-classic'; // TODO: Fix mappings in UI
    if (rawType === 'massage') finalCatId = 'massage-classic';
    if (rawType === 'skincare') finalCatId = 'care-sothys';

    const title = document.getElementById('svc-title').value;
    const desc = document.getElementById('svc-desc').value;

    const dataModel = {
        categoryId: finalCatId, // Simplification for MVP
        duration: parseInt(document.getElementById('svc-duration').value) || 60,
        price: {
            amount: parseInt(document.getElementById('svc-price').value) || 0,
            currency: "€"
        },
        media: {
            hero: document.getElementById('svc-img').value || 'default.jpg',
            gallery: []
        },
        content: {
            tr: { title: title, shortDesc: desc, fullDesc: desc, benefits: [], usage: [] },
            en: { title: title, shortDesc: desc, fullDesc: desc, benefits: [], usage: [] }, // Placeholder copy
            ru: { title: title, shortDesc: desc, fullDesc: desc, benefits: [], usage: [] }  // Placeholder copy
        },
        slug: {
            tr: slugify(title),
            en: slugify(title), // TODO: Real Translation
            ru: slugify(title)
        },
        tags: document.getElementById('svc-special').checked ? ['SPECIAL'] : []
    };

    if (editingSvcId) {
        // Update Existing
        const idx = serviceCatalog.findIndex(i => i.id == editingSvcId);
        if (idx > -1) {
            // Merge deep? For now replace core fields, keep ID
            serviceCatalog[idx] = { ...serviceCatalog[idx], ...dataModel, id: editingSvcId };
        }
    } else {
        // Create New
        const newId = slugify(title); // Simple ID gen
        serviceCatalog.push({ id: newId, order: serviceCatalog.length + 1, ...dataModel });
    }

    renderServiceTable('all');
    closeServiceModal();
    alert("Hizmet Listesi Güncellendi (Geçici)!\n\nLütfen 'Hizmet Verisini İndir' butonuna basarak servera kaydedin.");
}

function deleteService(id) {
    if (confirm("Bu hizmeti silmek istediğinize emin misiniz?")) {
        serviceCatalog = serviceCatalog.filter(s => s.id != id);
        renderServiceTable('all');
    }
}

function exportServiceData() {
    // Save to services.json format
    const content = JSON.stringify(serviceCatalog, null, 2);
    // Overwrite the logic to define filename
    // We reuse downloadFile but passing the specific path if bridge allows, or just filename
    downloadFile(content, "services.json");
}

/* --- UTILS --- */
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

/* --- BUILD TRIGGER --- */
async function triggerBuild() {
    if (!hasBridge) {
        alert("⚠️ Statik Moddasınız!\n\nDeğişikliklerin siteye yansıması için terminalden şu komutu çalıştırın:\nnode generator/generate.js");
        return;
    }

    if (!confirm("Siteyi yeniden oluşturmak (BUILD) istiyor musunuz?\nBu işlem tüm sayfaları yenileyecektir.")) return;

    try {
        const btn = document.querySelector('button[onclick="triggerBuild()"]');
        if (btn) btn.innerText = "⏳ İŞLENİYOR...";

        // Assuming Bridge has an exec endpoint or we start the process
        const res = await fetch(BRIDGE_API + "/exec", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: "node generator/generate.js" })
        });

        const json = await res.json();
        if (json.success) {
            alert("✅ SİTE GÜNCELLENDİ!\n\nLog: " + json.output);
        } else {
            alert("Hata: " + json.error);
        }
    } catch (e) {
        alert("Build çağrısı başarısız: " + e.message);
    } finally {
        const btn = document.querySelector('button[onclick="triggerBuild()"]');
        if (btn) btn.innerHTML = "🚀 YAYINLA (BUILD)";
    }
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
    alert("Yazı Kaydedildi (Geçici)!\n\nLütfen 'Blog Verisini İndir' ile dosyayı alıp assets/js klasörüne atın.");
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

/* --- OTOMASYON (FILE SYSTEM API) --- */
let dirHandle = null;

async function connectProjectFolder() {
    try {
        alert("Lütfen projenizin 'assets/js' klasörünü seçin.");
        dirHandle = await window.showDirectoryPicker();

        // UI Update
        const btn = document.getElementById('btn-connect');
        if (btn) {
            btn.innerHTML = "✅ Klasör Bağlandı (Otomatik Mod)";
            btn.style.color = "#4caf50"; // Green
            btn.onclick = null; // Disable click
        }
        alert("Bağlantı Başarılı!\n\nArtık 'İndir' butonlarına bastığınızda dosyalar otomatik olarak klasöre yazılacaktır.");
    } catch (err) {
        console.error(err);
        alert("Klasör seçimi iptal edildi veya tarayıcı desteklemiyor.");
    }
}

async function downloadFile(content, filename) {
    // 1. OTOMATİK MOD (Eğer klasör bağlıysa)
    if (dirHandle) {
        try {
            const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            // Başarılı
            alert(`✅ ${filename} BAŞARIYLA GÜNCELLENDİ!\n\nDosya 'assets/js' klasörüne otomatik yazıldı.\nSadece sayfayı yenilemeniz yeterli.`);
            return;
        } catch (err) {
            console.error("Otomatik yazma hatası:", err);
            alert("⚠️ Otomatik yazma başarısız oldu (İzin veya Klasör Hatası).\nManuel indirme başlatılıyor...");
        }
    }

    // 2. MANUEL MOD (Klasik İndirme)
    const blob = new Blob([content], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(filename + " İNDİRİLDİ!\n\n1. Bu dosyayı projenizin 'assets/js' klasörüne sürükleyin.\n2. Eskisinin üzerine yazın (Değiştir).\n3. Sitenizi yenileyerek kontrol edin.");
}

/* --- SANTIS BRIDGE (HYBRID AUTOMATION) --- */
let hasBridge = false;
const BRIDGE_API = "http://localhost:8000/api";

async function checkBridgeStatus() {
    console.log("🔌 Checking Santis Bridge connection...");
    try {
        const res = await fetch(BRIDGE_API + "/status");
        if (res.ok) {
            console.log("✅ Bridge Connected!");
            hasBridge = true;
            enableBridgeMode();
        }
    } catch (e) {
        console.warn("❌ Bridge check failed (Phase 1):", e);
        hasBridge = false;

        // RETRY MECHANISM
        setTimeout(async () => {
            console.log("🔄 Retrying Bridge Connection (Phase 2)...");
            try {
                const res2 = await fetch(BRIDGE_API + "/status");
                if (res2.ok) {
                    console.log("✅ Bridge Connected on Retry!");
                    hasBridge = true;
                    enableBridgeMode();
                }
            } catch (e2) { console.error("Still offline (Static Mode)."); }
        }, 2000);
    }
}

function enableBridgeMode() {
    // 1. Update Status Indicator
    const indicator = document.getElementById('bridge-status');
    if (indicator) {
        indicator.innerHTML = '<span class="icon">⚡</span><span class="text">Santis Köprüsü: ÇEVRİMİÇİ</span>';
        indicator.classList.add('connected');
    }

    // 2. Hide "Connect Folder" button (Not needed)
    const btnConnect = document.getElementById('btn-connect');
    if (btnConnect) btnConnect.style.display = 'none';

    // 3. Show Drop Zones
    document.querySelectorAll('.drop-zone').forEach(el => el.classList.remove('hidden'));

    // 4. Update Button Texts
    document.querySelectorAll('button[onclick^="export"]').forEach(btn => {
        btn.innerText = btn.innerText.replace('İndir', 'Kaydet (Otomatik)');
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary'); // Make them primary
    });

    // 5. Init Drag & Drop
    setupDragDrop();
}
/* --- HOMEPAGE ASSETS MANAGER (PHASE 16 & PHASE 4 ADVANCED) --- */
let homepageAssets = [];

async function initHomepage() {
    try {
        // Read Master Data (Admin Layer)
        const response = await fetch('data/generated_assets.json?t=' + Date.now());
        if (!response.ok) throw new Error("Asset dosyası bulunamadı");

        homepageAssets = await response.json();
        renderHomepage();
        checkBuildStatus();
    } catch (e) {
        console.warn("Homepage Assets Init Failed:", e);
        document.getElementById('slots-container').innerHTML = `<p style="color:red">Veri Yüklenemedi: ${e.message}</p>`;
    }
}

// --- PHASE 4: ADVANCED UI LOGIC ---

function updateHeroPreview() {
    const imgPath = "../" + document.getElementById('hero-img').value;
    document.getElementById('hero-preview-img').src = imgPath;
    document.getElementById('hero-preview-title').innerText = document.getElementById('hero-title').value;
    document.getElementById('hero-preview-sub').innerText = document.getElementById('hero-subtitle').value;
}

function renderHomepage() {
    const hero = homepageAssets.find(x => x.id === 'hero_main');
    const slots = homepageAssets.filter(x => x.id !== 'hero_main');

    // 1. Render Hero UI
    if (hero) {
        document.getElementById('hero-img').value = hero.image;
        document.getElementById('hero-title').value = hero.title;
        document.getElementById('hero-subtitle').value = hero.alt || "";
        document.getElementById('hero-link').value = hero.link || "";
        document.getElementById('hero-mood').value = hero.mood || "hero";

        // Trigger visual update
        // updateHeroPreview(); // Safe to call only if elements exist, but render runs on tab switch so elements are there.
        // Direct DOM update safely:
        if (document.getElementById('hero-preview-img')) updateHeroPreview();
    }

    // 2. Render Slots Grid (Visual Cards)
    const container = document.getElementById('slots-container');
    if (!container) return;
    container.innerHTML = "";

    slots.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = "settings-card visual-card";
        card.style.padding = "0";
        card.style.overflow = "hidden";
        card.style.cursor = "pointer";
        card.style.transition = "transform 0.2s";
        card.style.border = "1px solid #333";
        card.style.position = "relative";

        // Hover Effect in JS as fallback or inline
        card.onmouseover = () => card.style.transform = "translateY(-5px)";
        card.onmouseout = () => card.style.transform = "translateY(0)";
        card.onclick = () => openSlotModal(item.id);

        // Mood Color Indicator
        let moodColor = '#444';
        if (item.mood === 'warm') moodColor = '#d4af37';
        if (item.mood === 'calm') moodColor = '#4a90e2';
        if (item.mood === 'premium') moodColor = '#fff';

        // Layout Icon
        let layoutIcon = '';
        if (item.layout === 'overlap-left') layoutIcon = '↖️';
        if (item.layout === 'overlap-right') layoutIcon = '↘️';

        card.innerHTML = `
            <div style="height:140px; position:relative; background:#000;">
                <img src="../${item.image}" style="width:100%; height:100%; object-fit:cover; opacity:0.9;" onerror="this.src='https://placehold.co/300x200?text=?'">
                <!-- Mood Dot -->
                <div style="position:absolute; top:10px; right:10px; width:12px; height:12px; border-radius:50%; background:${moodColor}; box-shadow:0 0 5px rgba(0,0,0,0.8); border:1px solid #000;"></div>
                
                <!-- Badge -->
                ${item.badge ? `<span style="position:absolute; top:10px; left:10px; background:#d4af37; color:#000; font-size:10px; padding:2px 6px; font-weight:bold; border-radius:2px;">${item.badge}</span>` : ''}
                
                <!-- Layout Indicator -->
                ${layoutIcon ? `<div style="position:absolute; bottom:5px; right:5px; font-size:16px; text-shadow:0 1px 3px #000;">${layoutIcon}</div>` : ''}
            </div>
            <div style="padding:15px; background:#151515;">
                <div style="font-size:10px; color:#666; text-transform:uppercase; margin-bottom:5px;">SLOT #${index + 1}</div>
                <h4 style="margin:0; font-size:14px; color:#eee; font-weight:500;">${item.title}</h4>
                <div style="font-size:11px; color:#888; margin-top:3px;">/${item.link}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// SLOT EDIT MODAL
let editingSlotId = null;

function openSlotModal(id) {
    editingSlotId = id;
    const item = homepageAssets.find(x => x.id === id);
    if (!item) return;

    document.getElementById('slot-modal').classList.add('active');

    // Fill Form
    document.getElementById('slot-id').value = item.id;
    document.getElementById('slot-img-inp').value = item.image;
    document.getElementById('slot-title').value = item.title;
    document.getElementById('slot-link').value = item.link;
    document.getElementById('slot-subtitle').value = item.alt || ""; // Mapping
    document.getElementById('slot-badge').value = item.badge || "";
    document.getElementById('slot-mood').value = item.mood || "standard";

    // Radio Handling
    const layout = item.layout || 'normal';
    const radios = document.getElementsByName('slot-layout');
    radios.forEach(r => {
        r.checked = (r.value === layout);
    });

    updateSlotPreview();
}

function updateSlotPreview() {
    document.getElementById('slot-preview-img').src = "../" + document.getElementById('slot-img-inp').value;
}

function closeSlotModal() {
    document.getElementById('slot-modal').classList.remove('active');
}

function saveSlot() {
    const id = document.getElementById('slot-id').value;
    const idx = homepageAssets.findIndex(x => x.id === id);

    if (idx > -1) {
        // Collect Data
        homepageAssets[idx].image = document.getElementById('slot-img-inp').value;
        homepageAssets[idx].title = document.getElementById('slot-title').value;
        homepageAssets[idx].link = document.getElementById('slot-link').value;
        homepageAssets[idx].alt = document.getElementById('slot-subtitle').value;
        homepageAssets[idx].badge = document.getElementById('slot-badge').value;
        homepageAssets[idx].mood = document.getElementById('slot-mood').value;

        // Radio
        const radios = document.getElementsByName('slot-layout');
        let selectedLayout = 'normal';
        radios.forEach(r => { if (r.checked) selectedLayout = r.value; });
        homepageAssets[idx].layout = selectedLayout;

        renderHomepage();
        closeSlotModal();
    }
}

function addNewSlot() {
    const slots = homepageAssets.filter(x => x.id !== 'hero_main');
    if (slots.length >= 8) {
        alert("Maksimum 8 kart limitine ulaştınız. Yeni eklemek için birini silmelisiniz.");
        return;
    }

    const newId = "slot_" + Date.now();
    const newSlot = {
        id: newId,
        image: "assets/img/cards/default.webp",
        title: "Yeni Kart",
        link: "tr/yeni",
        mood: "standard",
        layout: "normal",
        alt: ""
    };

    homepageAssets.push(newSlot);
    renderHomepage();
    // Open modal immediately to edit
    setTimeout(() => openSlotModal(newId), 100);
}

function deleteSlot() {
    if (!editingSlotId) return;
    if (!confirm("Bu kartı silmek istediğinize emin misiniz?")) return;

    homepageAssets = homepageAssets.filter(x => x.id !== editingSlotId);
    renderHomepage();
    closeSlotModal();
}

async function saveHomepageData() {
    const btn = document.querySelector('button[onclick="saveHomepageData()"]');
    if (btn) {
        btn.innerText = "⏳ İŞLENİYOR...";
        btn.disabled = true;
    }

    // GATHER HERO DATA
    const heroIdx = homepageAssets.findIndex(x => x.id === 'hero_main');
    if (heroIdx > -1) {
        const hImg = document.getElementById('hero-img');
        const hTitle = document.getElementById('hero-title');
        const hSub = document.getElementById('hero-subtitle');
        const hLink = document.getElementById('hero-link');
        const hMood = document.getElementById('hero-mood');

        if (hImg) homepageAssets[heroIdx].image = hImg.value;
        if (hTitle) homepageAssets[heroIdx].title = hTitle.value;
        if (hSub) homepageAssets[heroIdx].alt = hSub.value;
        if (hLink) homepageAssets[heroIdx].link = hLink.value;
        if (hMood) homepageAssets[heroIdx].mood = hMood.value;
    }

    try {
        // 2. SAVE MASTER COPY (Admin Layer)
        const masterContent = JSON.stringify(homepageAssets, null, 4);

        if (!hasBridge) throw new Error("Statik Modda Kayıt Yapılamaz! (Bridge Gerekli)");

        await bridgeSave("admin/data/generated_assets.json", masterContent);

        // 3. TRANSFORM & SAVE PUBLIC COPY (The Brain Logic)
        const transformer = (assets) => {
            const getItems = (filterFn) => assets.filter(filterFn).map(item => {
                // Layout Class Logic (Phase 4 & 5 Bento Update)
                let finalClass = "gallery-item"; // Default
                if (item.layout === "overlap-left") finalClass = "g-overlap-left";
                if (item.layout === "overlap-right") finalClass = "g-overlap-right";
                if (item.layout === "span-2") finalClass = "g-span-2";
                if (item.layout === "focus") finalClass = "g-focus";

                return {
                    image: item.image, // Path is already relative 'assets/...'
                    title: item.title,
                    link: item.link,
                    badge: item.badge || "",
                    subtitle: item.alt || "", // Mapping alt to subtitle
                    layout_class: finalClass
                };
            });

            return {
                sections: {
                    // Smart Categorization based on Link Slug
                    "grid-hammam": { items: getItems(x => x.link.includes('hamam')) },
                    "grid-massages": { items: getItems(x => x.link.includes('masaj')) },
                    "grid-skincare": { items: getItems(x => x.link.includes('cilt') || x.link.includes('vucut') || x.link.includes('face') || x.link.includes('bakim')) },

                    "hero": {
                        items: getItems(x => x.id === 'hero_main').map(h => ({ ...h, layout_class: 'g-wide' })) // Hero always wide
                    }
                }
            };
        };

        const publicData = transformer(homepageAssets);
        const publicContent = JSON.stringify(publicData, null, 4);

        // Save Public
        await bridgeSave("assets/data/home_data.json", publicContent);

        alert("✅ YAYINLANDI!\n\n1. Master Data güncellendi.\n2. Public Data dönüştürüldü ve yazıldı.\n3. Siteyi yenileyebilirsiniz.");

    } catch (e) {
        alert("HATA: " + e.message);
    } finally {
        if (btn) {
            btn.innerText = "💾 YAYINLA (Sahneye Koy)";
            btn.disabled = false;
        }
    }
}

function checkBuildStatus() {
    if (hasBridge) {
        const el = document.getElementById('home-status');
        if (el) el.innerText = "🟢 Bridge Bağlı (Hazır)";
    }
}

// 4. UPLOAD HELPER (Generic)
function triggerUpload(type) {
    alert("Bu özellik FAZ 3'te aktif olacak (Sürükle bırak zaten çalışıyor).");
}




/* --- CONCIERGE SYSTEM (PHASE 3: CORE OS INTERFACE) --- */
function initConcierge() {
    console.log("🛎️ Concierge: Analyzing system...");

    // 1. Check Backup Status
    const lastBackup = localStorage.getItem('lastBackup');
    let backupMsg = "⚠️ Hiç yedek alınmamış!";
    let backupStatus = "warning";

    if (lastBackup) {
        const date = new Date(lastBackup);
        const diffHours = (new Date() - date) / (1000 * 60 * 60);

        if (diffHours < 24) {
            backupMsg = "✅ Sistem Güvende (Son Yedek: Bugün)";
            backupStatus = "success";
        } else {
            backupMsg = "⚠️ Yedekleme Eski (Son: " + date.toLocaleDateString() + ")";
        }
    }

    // 2. Check Drafts
    let draftCount = 0;
    if (typeof SOCIAL_DATA !== 'undefined' && SOCIAL_DATA.posts) {
        draftCount = SOCIAL_DATA.posts.filter(p => p.status === 'draft').length;
    }

    // 3. Construct Briefing
    const message = `
        <div style="font-size:14px; font-weight:bold; margin-bottom:5px; color:#d4af37;">Santis Concierge Raporu</div>
        <div style="font-size:12px; margin-bottom:3px;">${hasBridge ? '🟢 Sunucu Aktif' : '🔴 Sunucu Kapalı'}</div>
        <div style="font-size:12px; margin-bottom:3px; color:${backupStatus === 'success' ? '#fff' : '#ff9800'}">${backupMsg}</div>
        <div style="font-size:12px; margin-bottom:3px;">📢 Yayınlanmayı Bekleyen: ${draftCount} Taslak</div>
    `;

    showToast(message, 6000);
}

function showToast(html, duration = 3000) {
    // Create Toast Container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.background = '#1a1a1a';
    toast.style.border = '1px solid #d4af37';
    toast.style.color = '#eee';
    toast.style.padding = '15px';
    toast.style.marginTop = '10px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
    toast.style.minWidth = '250px';
    toast.style.animation = 'fadeIn 0.5s';
    toast.innerHTML = html;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, duration);
}

/* --- IMAGE UPLOAD LOGIC --- */
function triggerUpload(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = (type === 'social') ? 'image/*,video/mp4,video/quicktime' : 'image/*';
    input.onchange = (e) => {
        if (e.target.files.length > 0) {
            uploadFile(e.target.files[0], type);
        }
    };
    input.click();
}

/* --- AI CURATOR SIMULATION (PHASE 7) --- */
function simulateAIAnalysis(filename) {
    // 1. Simulate "Thinking" Delay is handled by the UI feedback in real app, 
    // but here we just return the result instanty or could be async.

    // 2. Keyword Analysis (Fake Computer Vision)
    const name = filename.toLowerCase();
    let mood = 'calm'; // Default
    let caption = "Sessizliğin ve huzurun sanatsal yansıması."; // Default

    const keywords = {
        'energetic': ['sport', 'fit', 'gym', 'run', 'power', 'sun', 'bright', 'gold'],
        'mystic': ['dark', 'night', 'candle', 'aroma', 'steam', 'shadow', 'purple', 'black'],
        'calm': ['water', 'blue', 'sea', 'pool', 'relax', 'sleep', 'white', 'soft']
    };

    // Detect Mood
    for (const m in keywords) {
        if (keywords[m].some(k => name.includes(k))) {
            mood = m;
            break;
        }
    }

    // 3. Generative Captioning (Template Based)
    const templates = {
        'calm': [
            "Suyun iyileştirici gücüne teslim olun.",
            "Zamanın durduğu, ruhun dinlendiği an.",
            "Sessiz lüksün en saf hali.",
            "Derin bir nefes ve mutlak huzur."
        ],
        'mystic': [
            "Gölge ve ışığın mistik dansı.",
            "Ruhunuzun derinliklerine bir yolculuk.",
            "Antik ritüellerin modern yorumu.",
            "Gizemli, büyüleyici ve size özel."
        ],
        'energetic': [
            "Bedeninizi uyandırın, enerjinizi keşfedin.",
            "Güç, denge ve yenilenme.",
            "Hayatın ritmini yakalayın.",
            "Işıltılı bir başlangıç için."
        ]
    };

    const options = templates[mood];
    caption = options[Math.floor(Math.random() * options.length)];

    return { mood, caption };
}

async function uploadFile(file, type) {
    if (!hasBridge) return;

    const formData = new FormData();
    formData.append('file', file);

    // Determine folder
    let folder = 'cards'; // Default for slots/products
    if (type === 'blog') folder = 'blog';
    if (type === 'social') folder = 'social';
    if (type === 'gallery') folder = 'gallery';
    if (type === 'hero') folder = 'hero'; // Special folder for hero

    formData.append('folder', folder);

    // Resolve UI Elements for Feedback
    // Legacy support: 'drop-zone-{type}' vs New UI 'drop-{type}' or buttons
    let dropZone = document.getElementById(`drop-zone-${type}`) || document.getElementById(`drop-${type}`);
    // If specific buttons triggered it (like slot modal), we might not have a static drop zone.
    // In that case, we can try to find the button if we had passed it, but for now let's safeguard.

    let originalText = "";
    if (dropZone) {
        originalText = dropZone.innerText;
        dropZone.innerText = "⏳ Yükleniyor...";
    }

    try {
        const res = await fetch(BRIDGE_API + "/upload", {
            method: 'POST',
            body: formData
        });

        const json = await res.json();

        if (json.success) {
            if (type === 'social') {
                addSocialDraft(json.filename);
                if (dropZone) {
                    dropZone.innerText = "✅ Eklendi!";
                    setTimeout(() => dropZone.innerText = originalText, 3000);
                }
            } else if (type === 'gallery') {
                if (dropZone) dropZone.innerText = "🧠 AI Analiz Ediyor...";
                setTimeout(() => {
                    const aiResult = simulateAIAnalysis(json.filename);
                    localGallery.push({
                        file: json.filename,
                        category: 'general',
                        caption: aiResult.caption,
                        mood: aiResult.mood
                    });
                    renderGallery();
                    if (dropZone) {
                        dropZone.innerText = `✨ ${aiResult.mood.toUpperCase()} Olarak Etiketlendi!`;
                        setTimeout(() => dropZone.innerText = originalText, 3000);
                    }
                }, 800);

            } else {
                // STANDARD INPUT FILLING
                let inputId = 'inp-img'; // Default product
                if (type === 'blog') inputId = 'blog-img';
                else if (type === 'service') inputId = 'svc-img';
                else if (type === 'hero') {
                    inputId = 'hero-img';
                    // Also trigger preview update for hero
                    setTimeout(() => updateHeroPreview(), 100);
                }
                else if (type === 'slot') {
                    inputId = 'slot-img-inp';
                    // Also trigger preview update for slot
                    setTimeout(() => updateSlotPreview(), 100);
                }

                const inp = document.getElementById(inputId);
                if (inp) {
                    // Start path with folder if needed, but backend usually returns filename.
                    // Our system expects specific paths.
                    // Server returns just filename usually? Let's assume standard behavior.
                    // If folder is hero, path is assets/img/hero/filename
                    // If folder is cards, path is assets/img/cards/filename

                    let finalPath = json.filename;
                    // Auto-prefix if backend returns just filename
                    if (!json.filename.includes('/')) {
                        if (type === 'hero') finalPath = `assets/img/hero/${json.filename}`;
                        else if (type === 'blog') finalPath = `assets/img/blog/${json.filename}`;
                        else if (type === 'social') finalPath = `assets/img/social/${json.filename}`; // though social logic handled above
                        else finalPath = `assets/img/cards/${json.filename}`; // default cards
                    }

                    inp.value = finalPath;
                }

                if (dropZone) {
                    dropZone.innerText = "✅ Yüklendi";
                    setTimeout(() => dropZone.innerText = originalText, 3000);
                } else {
                    // If no dropzone, show generic alert or toast
                    // alert("Dosya yüklendi: " + json.filename);
                    // Or update the button text if we could identify it
                }
            }
        } else {
            alert("Yükleme Hatası: " + json.error);
            if (dropZone) dropZone.innerText = "❌ Hata!";
        }
    } catch (e) {
        console.error(e);
        alert("Bağlantı Hatası!");
        if (dropZone) dropZone.innerText = originalText;
    }
}

/* --- GLOBAL TREND RADAR (PHASE 9: ULTRA RESEARCH) --- */
function initGlobalRadar() {
    const radarContainer = document.getElementById('global-radar');
    if (!radarContainer) return;

    radarContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">📡 Global Luxury Network Taranıyor...</div>';

    setTimeout(() => {
        const trends = [
            { city: 'Tokyo', trend: 'Wabi-Sabi Aesthetics', icon: '🇯🇵' },
            { city: 'Copenhagen', trend: 'Hygge & Soft Lighting', icon: '🇩🇰' },
            { city: 'Milan', trend: 'Travertine Stone Textures', icon: '🇮🇹' },
            { city: 'Bali', trend: 'Tropical Brutalism', icon: '🇮🇩' }
        ];

        let html = '<h3 style="margin-bottom:15px; color:#d4af37;">🌍 Ultra Trend Radarı</h3><div style="display:flex; gap:10px; flex-wrap:wrap;">';

        trends.forEach(t => {
            html += `
                <div style="flex:1; min-width:140px; background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">
                    <div style="font-size:24px; margin-bottom:5px;">${t.icon}</div>
                    <div style="font-size:11px; color:#888; text-transform:uppercase;">${t.city}</div>
                    <div style="font-size:13px; font-weight:bold; color:#eee;">${t.trend}</div>
                </div>
            `;
        });
        html += '</div>';

        radarContainer.innerHTML = html;
        playSound('success'); // Phygital completion sound
    }, 1500);
}

function setupDragDrop() {
    ['product', 'blog', 'service', 'social', 'gallery'].forEach(type => {
        const zone = document.getElementById(`drop-zone-${type}`);
        if (!zone) return;

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                uploadFile(e.dataTransfer.files[0], type);
            }
        });
    });
}

/* --- SOCIAL MEDIA MANAGER (PHASE 1) --- */
let localSocial = {};

function initSocial() {
    renderSocialGrid();

    // Init charts if needed (omitted for now)
    document.getElementById('social-reach').innerText = "15.4K";
    document.getElementById('social-eng').innerText = "4.2%";
    document.getElementById('social-growth').innerText = "+22%";

    // Auto-trigger Radar
    initGlobalRadar();
}

function renderSocialGrid() {
    const grid = document.getElementById('social-grid');
    grid.innerHTML = '';

    // Load from Data File or Fallback
    let posts = [];
    if (typeof SOCIAL_DATA !== 'undefined' && SOCIAL_DATA.posts) {
        posts = SOCIAL_DATA.posts;
    } else {
        posts = [
            { date: '14 Şubat', type: 'Reels', title: 'Sevgililer Günü Özel', status: 'ready', img: 'post1.jpg' },
            { date: '16 Şubat', type: 'Post', title: 'Hamam Ritüeli', status: 'draft', img: 'post2.jpg' }
        ];
    }

    posts.forEach(p => {
        const div = document.createElement('div');
        div.className = 'social-card';
        div.innerHTML = `
            <div style="height:100px; background:#222; margin-bottom:10px; border-radius:4px; overflow:hidden;">
                <!-- Placeholder Image -->
                <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#555;">${p.type}</div>
            </div>
            <div style="font-size:12px; color:#d4af37;">${p.date}</div>
            <div style="font-weight:bold; font-size:13px; margin-bottom:5px;">${p.title}</div>
            <div class="badge" style="background:${p.status === 'ready' ? '#4caf50' : '#ff9800'}">${p.status.toUpperCase()}</div>
        `;
        grid.appendChild(div);
    });
}

function addSocialDraft(filename) {
    const grid = document.getElementById('social-grid');
    const div = document.createElement('div');
    div.className = 'social-card';
    div.style.border = '1px solid #d4af37'; // Highlight new
    div.innerHTML = `
        <div style="height:100px; background:#222; margin-bottom:10px; border-radius:4px; overflow:hidden;">
            <img src="../assets/img/social/${filename}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div style="font-size:12px; color:#d4af37;">Taslak</div>
        <div style="font-weight:bold; font-size:13px; margin-bottom:5px;">Yeni Gönderi</div>
        <div class="badge" style="background:#2196f3">YENİ</div>
    `;
    grid.prepend(div); // Add to top
}

/* --- GALLERY MANAGER (PHASE 2) --- */
let localGallery = [];

function initGallery() {
    if (typeof galleryData !== 'undefined') {
        localGallery = [...galleryData];
        renderGallery();
    } else {
        // Fallback or Empty
        localGallery = [];
        renderGallery();
    }
}

function renderGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';

    localGallery.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-card';
        div.style.background = '#1a1a1a';
        div.style.borderRadius = '8px';
        div.style.overflow = 'hidden';
        div.style.position = 'relative';

        const moodBadge = item.mood ? `<span style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.7); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px;">${item.mood.toUpperCase()}</span>` : '';

        div.innerHTML = `
            <div style="height:120px; background:#000;">
                <img src="../assets/img/gallery/${item.file}" style="width:100%; height:100%; object-fit:cover; opacity:0.8;">
                ${moodBadge}
            </div>
            <div style="padding:10px;">
                <div style="font-size:11px; color:#666; margin-bottom:4px;">${item.category}</div>
                <div style="font-size:12px; color:#ccc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.caption || 'Başlıksız'}</div>
            </div>
        `;
        galleryGrid.appendChild(div);
    });

    document.getElementById('gallery-count').innerText = localGallery.length + " öğe";
}

function exportGallery() {
    const content = `// SANTIS CLUB - GALLERY DATABASE
// Generated by Control Center at ${new Date().toLocaleString()}

const galleryData = ${JSON.stringify(localGallery, null, 4)};
`;
    downloadFile(content, "gallery-data.js");
}

/* --- SANTIS AI WRITER -- */
async function generateDescription() {
    const name = document.getElementById('inp-name').value;
    const cat = document.getElementById('inp-cat').value;
    if (!name) {
        alert("Lütfen önce bir ürün adı yazın!");
        return;
    }

    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "✨ Yazılıyor...";
    btn.disabled = true;

    try {
        const response = await fetch(BRIDGE_API + "/generate-text", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Write a luxurious, spa-quality product description for "${name}" (Category: ${cat}). Use a calm, premium tone (Turkish language). Max 2 sentences.`
            })
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('inp-desc').value = data.text;
        } else {
            alert("AI Hatası: " + data.error);
        }

    } catch (e) {
        alert("Bağlantı Hatası: " + e);
        console.error(e);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

/* --- SANTIS GLOBAL TRANSLATOR (PHASE 4) --- */
async function startGlobalTranslation() {
    if (!confirm("Tüm ürün açıklamaları İngilizceye çevrilip veritabanına eklenecek. Bu işlem birkaç dakika sürebilir. Başlatılsın mı?")) return;

    const progressBox = document.getElementById('translation-progress');
    const bar = document.getElementById('trans-bar');
    const currentEl = document.getElementById('trans-current');
    const totalEl = document.getElementById('trans-total');
    const percentEl = document.getElementById('trans-percent');

    // Filter items relying on translation
    const items = localCatalog;
    let count = 0;

    progressBox.style.display = 'block';
    totalEl.innerText = items.length;

    for (let item of items) {
        count++;
        currentEl.innerText = count;
        percentEl.innerText = Math.round((count / items.length) * 100) + "%";
        bar.style.width = (count / items.length) * 100 + "%";

        // Skip if already has english
        if (item.desc_en) continue;

        try {
            const prompt = `
            Translate the following product description to English. 
            Keep the tone luxurious, calm, and premium (Spa/Wellness context).
            Return ONLY the JSON format: {"desc": "translated text..."}

            Original Text: "${item.desc}"
            Product Name: "${item.name}"
            `;

            const response = await fetch(BRIDGE_API + "/generate-text", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            const data = await response.json();
            if (data.success) {
                let jsonText = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
                try {
                    const enData = JSON.parse(jsonText);
                    item.desc_en = enData.desc;
                } catch (e) {
                    console.error("JSON Parse Hatası:", e);
                    item.desc_en = data.text; // Fallback to raw text
                }
            }
        } catch (e) {
            console.error("Translation failed for " + item.name, e);
        }

        // Small delay to be nice to API
        await new Promise(r => setTimeout(r, 1000));
    }

    alert("✅ Global Çeviri Tamamlandı! Veritabanını indirmeyi unutmayın.");
    progressBox.style.display = 'none';
    renderTable(); // Update table if we show flags or something
}

// Helpers
function playSound(type) {
    // Optional: Add simple beep or click sound
    console.log("🔊 Sound:", type);
}

/* --- SYSTEM CONTROL FUNCTIONS (Recovered) --- */
async function triggerBackup() {
    if (!confirm("Tüm site dosyaları ve veritabanı yedeklenecek. Devam edilsin mi?")) return;

    try {
        // Try Bridge First
        if (hasBridge) {
            const res = await fetch(BRIDGE_API + "/backup", { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Yedekleme Başarılı!\nKonum: ${data.path}`);
                localStorage.setItem('lastBackup', new Date().toISOString());
                return;
            }
        }

        // Fallback: Client Side Download
        alert("⚠️ Bridge Bağlantısı Yok! Manuel yedekleme (ZIP) başlatılıyor...");
        window.location.href = "backup-download.zip"; // Mock or specific handler

    } catch (e) {
        alert("Bir hata oluştu: " + e.message);
    }
}

async function triggerBuild() {
    const btn = document.querySelector('button[onclick="triggerBuild()"]');
    const originalText = btn.innerText;

    btn.innerText = "🚀 DERLENİYOR...";
    btn.disabled = true;

    try {
        if (!hasBridge) throw new Error("Build işlemi için Bridge (Python Server) gereklidir.");

        const res = await fetch(BRIDGE_API + "/build", { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            alert("✅ SİTE YAYINLANDI!\nIndex.html ve tüm sayfalar yeniden oluşturuldu.");
        } else {
            throw new Error(data.error || "Bilinmeyen hata");
        }

    } catch (e) {
        console.error(e);
        alert("Build Hatası: " + e.message + "\n\nLütfen sunucunun açık olduğundan emin olun.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function shutdownSystem() {
    if (!confirm("🔴 SİSTEM KAPATILACAK!\nSunucu durdurulacak ve yönetim paneli kapanacak. Emin misiniz?")) return;

    try {
        if (hasBridge) {
            await fetch(BRIDGE_API + "/shutdown", { method: 'POST' });
            document.body.innerHTML = "<div style='color:#fff; text-align:center; padding-top:20%; font-family:sans-serif;'><h1>🛑 SİSTEM KAPATILDI</h1><p>Sunucu güvenli bir şekilde durduruldu. Pencereyi kapatabilirsiniz.</p></div>";
        } else {
            alert("Statik modda kapatma yapılamaz. Pencereyi manuel kapatın.");
        }
    } catch (e) {
        console.error(e);
    }
}
