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
    }
}

// BLOG CRUD
let editingBlogId = null;

/* --- SERVICES SYSTEM LOGIC --- */
let localHammam = [];
let localMassages = [];
let localSkincare = [];

function initServices() {
    // 1. Force Load Data
    if (typeof NV_HAMMAM !== 'undefined') localHammam = [...NV_HAMMAM];
    else console.warn("NV_HAMMAM tanımlı değil (services-data.js yüklenemedi?)");

    if (typeof NV_MASSAGES !== 'undefined') localMassages = [...NV_MASSAGES];
    else console.warn("NV_MASSAGES tanımlı değil");

    if (typeof NV_SKINCARE !== 'undefined') localSkincare = [...NV_SKINCARE];
    else console.warn("NV_SKINCARE tanımlı değil");

    // 2. Initial Render
    renderServiceTable('all');
}

function renderServiceTable(filter, btn) {
    // 0. Safety Check: If locals are empty (e.g. page refresh), try to re-fetch from globals
    if (localHammam.length === 0 && typeof NV_HAMMAM !== 'undefined') localHammam = [...NV_HAMMAM];
    if (localMassages.length === 0 && typeof NV_MASSAGES !== 'undefined') localMassages = [...NV_MASSAGES];
    if (localSkincare.length === 0 && typeof NV_SKINCARE !== 'undefined') localSkincare = [...NV_SKINCARE];

    // 1. Update Active Button State
    if (btn) {
        document.querySelectorAll('.filter-bar .btn').forEach(b => {
            b.classList.remove('btn-primary');
            b.classList.add('btn-outline');
        });

        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
    }

    const tbody = document.getElementById('service-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let items = [];
    if (filter === 'all' || filter === 'hammam') items = items.concat(localHammam.map(i => ({ ...i, type: 'hammam' })));
    if (filter === 'all' || filter === 'massage') items = items.concat(localMassages.map(i => ({ ...i, type: 'massage' })));
    if (filter === 'all' || filter === 'skincare') items = items.concat(localSkincare.map(i => ({ ...i, type: 'skincare' })));

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Görüntülenecek veri yok veya kategori boş.</td></tr>';
        return;
    }

    items.forEach(svc => {
        const specialBadge = svc.isSpecial ? '<span style="background:orange; color:white; padding:2px 6px; border-radius:4px; font-size:10px;">🔥 FIRSAT</span>' : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge" style="background:#eee">${svc.type ? svc.type.toUpperCase() : 'SERVİS'}</span></td>
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
    // Clear Form
    document.getElementById('svc-title').value = '';
    document.getElementById('svc-duration').value = '';
    document.getElementById('svc-price').value = '';
    document.getElementById('svc-desc').value = '';
    document.getElementById('svc-img').value = '';
    document.getElementById('svc-special').checked = false;
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
    document.getElementById('svc-img').value = s.img || 'santis_card_hammam_v1.png';
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
        img: document.getElementById('svc-img').value || 'santis_card_hammam_v1.png',
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
    alert("Hizmet Listesi Güncellendi (Geçici)!\n\nLütfen 'Hizmet Verisini İndir' butonuna basarak dosyayı güncelleyin.");
}

function deleteService(id, type) {
    if (confirm("Bu hizmeti silmek istediğinize emin misiniz?")) {
        if (type === 'hammam') {
            localHammam = localHammam.filter(s => s.id != id);
        } else if (type === 'massage') {
            localMassages = localMassages.filter(s => s.id != id);
        } else if (type === 'skincare') {
            localSkincare = localSkincare.filter(s => s.id != id);
        }
        renderServiceTable('all'); // Refresh view
        alert("Hizmet silindi! Değişiklikleri indirmeyi unutmayın.");
    }
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

// OVERRIDE DOWNLOAD FUNCTION
const originalDownload = downloadFile;
downloadFile = async function (content, filename) {
    if (hasBridge) {
        try {
            const res = await fetch(BRIDGE_API + "/save", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content })
            });

            const json = await res.json();
            if (json.success) {
                alert(`✅ ${filename} BAŞARIYLA KAYDEDİLDİ!\n(Otomatik Yedek Alındı)`);
            } else {
                throw new Error(json.error || "Unknown Error");
            }
        } catch (e) {
            alert("⚠️ Köprü Hatası: " + e.message + "\nManuel moda geçiliyor...");
            originalDownload(content, filename);
        }
    } else {
        originalDownload(content, filename);
    }
};

async function shutdownSystem() {
    if (!confirm("⚠️ SİSTEMİ KAPATMAK İSTEDİĞİNİZE EMİN MİSİNİZ?\n\nBu işlem sunucuyu durduracak ve terminal penceresini kapatacaktır.\nSite 'Statik Mod'a döner.")) {
        return;
    }

    if (!hasBridge) {
        alert("HATA: Sunucu zaten kapalı veya bağlantı yok! (Statik Mod)");
        return;
    }

    try {
        const res = await fetch(BRIDGE_API + "/shutdown", { method: 'POST' });
        const json = await res.json();

        if (json.success) {
            document.body.innerHTML = `
                <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#111; color:#fff; font-family:sans-serif;">
                    <h1 style="color:#d4af37">SİSTEM KAPATILDI</h1>
                    <p>Sunucu güvenli bir şekilde durduruldu.</p>
                    <p style="color:#888;">Bu sayfayı kapatabilirsiniz.</p>
                </div>
            `;
        }
    } catch (e) {
        alert("Kapatma isteği gönderildi ancak yanıt alınamadı. (Sunucu zaten kapanmış olabilir)");
        window.close();
    }
}

async function triggerBackup() {
    const btn = event.target;
    const oldText = btn.innerText;
    btn.innerText = "⏳ Yedekleniyor...";
    btn.disabled = true;

    try {
        const res = await fetch(BRIDGE_API + "/backup", { method: 'POST' });
        const json = await res.json();

        if (json.success) {
            alert("✅ YEDEKLEME BAŞARILI!\n\nDosyalar 'backup' klasörüne kaydedildi.\n" + json.message);
        } else {
            alert("Hata: " + json.error);
        }
    } catch (e) {
        alert("Bağlantı Hatası: " + e);
    } finally {
        btn.innerText = oldText;
        btn.disabled = false;
    }
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
    let folder = 'cards';
    if (type === 'blog') folder = 'blog';
    if (type === 'social') folder = 'social';
    if (type === 'gallery') folder = 'gallery'; // New Folder
    formData.append('folder', folder);

    try {
        // Show loading state
        const dropZone = document.getElementById(`drop-zone-${type}`);
        const originalText = dropZone.innerText;
        dropZone.innerText = "⏳ Yükleniyor...";

        const res = await fetch(BRIDGE_API + "/upload", {
            method: 'POST',
            body: formData
        });

        const json = await res.json();

        if (json.success) {
            if (type === 'social') {
                // SPECIAL HANDLING FOR SOCIAL (ADD TO GRID)
                addSocialDraft(json.filename);
                dropZone.innerText = "✅ Eklendi!";
                setTimeout(() => dropZone.innerText = originalText, 3000);
            } else if (type === 'gallery') {
                // SPECIAL HANDLING FOR GALLERY + AI CURATOR
                dropZone.innerText = "🧠 AI Analiz Ediyor...";

                setTimeout(() => {
                    const aiResult = simulateAIAnalysis(json.filename);
                    localGallery.push({
                        file: json.filename,
                        category: 'general',
                        caption: aiResult.caption,
                        mood: aiResult.mood // AI Tag
                    });
                    renderGallery();

                    dropZone.innerText = `✨ ${aiResult.mood.toUpperCase()} Olarak Etiketlendi!`;
                    setTimeout(() => dropZone.innerText = originalText, 3000);
                }, 800);

            } else {
                // STANDARD INPUT FILLING
                let inputId = 'inp-img';
                if (type === 'blog') inputId = 'blog-img';
                else if (type === 'service') inputId = 'svc-img';

                document.getElementById(inputId).value = json.filename;
                dropZone.innerText = "✅ Yüklendi: " + json.filename;
                setTimeout(() => dropZone.innerText = originalText, 3000);
            }
        } else {
            alert("Yükleme Hatası: " + json.error);
            dropZone.innerText = "❌ Hata!";
        }
    } catch (e) {
        console.error(e);
        alert("Bağlantı Hatası!");
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
}
