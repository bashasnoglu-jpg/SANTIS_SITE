/**
 * Ultra Mega Site Navigation + Recent Updates Scanner (No-Dep Edition)
 * Kullanım: node site-audit.js [dizin]
 * Örnek:    node site-audit.js tr
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(process.argv[2] || '.');
const SEVEN_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const navigationItems = new Map(); // dedup ile
const recentUpdates = [];

// --- HELPERS ---
function relativeSitePath(fullPath) {
    return '/' + path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');
}

// Regex ile href ve text çıkartıcı (jsdom'suz)
function extractLinksFromHtml(html, sourceFile) {
    // <a href="...">label</a>
    const linkRe = /<a[^>]+href="([^"#?]{2,})"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = linkRe.exec(html)) !== null) {
        const url = m[1].trim();
        const label = m[2].replace(/<[^>]+>/g, '').trim() || '(no label)';
        if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) continue;
        if (url.length < 2) continue;
        const key = url;
        if (!navigationItems.has(key)) {
            navigationItems.set(key, {
                label,
                url,
                parent: null,
                depth: url.split('/').filter(Boolean).length - 1,
                foundIn: sourceFile,
                broken: null
            });
        }
    }
}

// Dizin recursive tarayıcı
function scanDir(dir) {
    let entries;
    try { entries = fs.readdirSync(dir); } catch { return; }

    for (const entry of entries) {
        const full = path.join(dir, entry);
        const stats = fs.statSync(full);

        // Skip archive/venv/node_modules
        if (/(_dev_archives|venv|node_modules|\.git)/.test(full)) continue;

        if (stats.isDirectory()) {
            scanDir(full);
        } else {
            const ext = path.extname(entry).toLowerCase();
            const type = ext.replace('.', '').toUpperCase() || 'FILE';

            // Son 7 gün kontrolü
            if (stats.mtime > SEVEN_AGO) {
                recentUpdates.push({
                    file: entry,
                    url: relativeSitePath(full),
                    lastModified: stats.mtime.toISOString().replace('T', ' ').slice(0, 16),
                    type
                });
            }

            // HTML'lerde link çıkar
            if (ext === '.html') {
                try {
                    const content = fs.readFileSync(full, 'utf8');
                    extractLinksFromHtml(content, relativeSitePath(full));
                } catch { /* skip */ }
            }
        }
    }
}

// --- MAIN ---
console.log(`\n🔍 Taranıyor: ${ROOT_DIR}`);
console.log(`📅 7 gün eşiği: ${SEVEN_AGO.toISOString().slice(0, 10)}\n`);

scanDir(ROOT_DIR);

// Kırık link kontrolü
for (const [url, nav] of navigationItems) {
    if (url.startsWith('http') || url.startsWith('//')) { nav.broken = null; continue; }
    const localPath = path.join(ROOT_DIR, url.replace(/^\//, ''));
    nav.broken = !fs.existsSync(localPath);
}

// ---- RAPOR ----
const navArr = [...navigationItems.values()];
const navBroken = navArr.filter(n => n.broken === true);
const navOk = navArr.filter(n => n.broken === false);
const navExt = navArr.filter(n => n.broken === null);

const sortedUpdates = recentUpdates.sort((a, b) => b.lastModified.localeCompare(a.lastModified));

// JSON rapor
const report = {
    generatedAt: new Date().toISOString(),
    rootDir: ROOT_DIR,
    navigation: navArr,
    recentUpdates: sortedUpdates,
    summary: {
        totalNavItems: navArr.length,
        brokenLinks: navBroken.length,
        okLinks: navOk.length,
        externalLinks: navExt.length,
        recentFileCount: sortedUpdates.length
    }
};

fs.writeFileSync('site-audit-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('💾 site-audit-report.json kaydedildi.\n');

// Console tablo — KIRRIK LİNKLER
if (navBroken.length) {
    console.log(`\n❌ KIRRIK LİNKLER (${navBroken.length} adet):`);
    console.table(navBroken.map(n => ({ Label: n.label, URL: n.url, Bulundu: n.foundIn })));
} else {
    console.log('✅ Kırık link bulunamadı.');
}

// Console tablo — SON 7 GÜN HTML
const recentHtml = sortedUpdates.filter(u => u.type === 'HTML');
const recentJs = sortedUpdates.filter(u => u.type === 'JS');

console.log(`\n📄 SON 7 GÜN HTML (${recentHtml.length} dosya):`);
console.table(recentHtml.map(u => ({ Dosya: u.file, URL: u.url, Tarih: u.lastModified })));

console.log(`\n⚡ SON 7 GÜN JS (${recentJs.length} dosya):`);
console.table(recentJs.slice(0, 25).map(u => ({ Dosya: u.file, Tarih: u.lastModified })));
if (recentJs.length > 25) console.log(`  ... ve ${recentJs.length - 25} dosya daha. Tam liste JSON'da.`);

console.log('\n📊 ÖZET:');
console.table(report.summary);

// ── 🛍️ BOUTIQUE UX AUDİT ─────────────────────────────────────────────────────
console.log('\n\n🛍️ BOUTIQUE UX AUDİT:');

const boutiquePage = path.join(ROOT_DIR, 'tr/urunler/index.html');
if (fs.existsSync(boutiquePage)) {
    const html = fs.readFileSync(boutiquePage, 'utf8');

    // 1. data-filter değerleri
    const filterRe = /data-filter="([^"]+)"/g;
    const filters = [];
    let fm;
    while ((fm = filterRe.exec(html)) !== null) filters.push(fm[1]);

    // 2. services.json gerçek kategoriler + eksik URL'ler
    const svcPath = path.join(ROOT_DIR, 'assets/data/services.json');
    const realCats = new Set();
    const missingUrls = [];
    if (fs.existsSync(svcPath)) {
        const svc = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
        svc.forEach(item => {
            const cat = (item.category || item.categoryId || '').toString().trim().toLowerCase();
            if (cat) realCats.add(cat);
            if (!item.url && !item.detailUrl) missingUrls.push(item.id || '?');
        });
    }

    const mismatches = filters.filter(f => f !== 'all' && !realCats.has(f.toLowerCase()));
    console.log(`\n  📌 Filter butonları: ${JSON.stringify(filters)}`);
    console.log(`  📌 Engine kategorileri (ilk 5): ${[...realCats].slice(0, 5).join(', ')}...`);
    if (mismatches.length) {
        console.log(`  ❌ EŞLEŞMİYEN FİLTRELER: ${JSON.stringify(mismatches)}`);
    } else {
        console.log(`  ✅ Tüm filtreler engine kategorileriyle eşleşiyor.`);
    }
    console.log(`  ${missingUrls.length ? '⚠️ ' : '✅'} URL eksik kayıt: ${missingUrls.length} adet`);

    // 3. Script etiketleri
    console.log('\n  📌 Script Kontrol (tr/urunler/index.html):');
    ['boutique-quickview.js', 'boutique-prefetch.js', 'santis-checkout-vault.js', 'santis-boutique-engine.js']
        .forEach(s => console.log(`    ${html.includes(s) ? '✅' : '❌'} ${s}`));
} else {
    console.log('  ⚠️  tr/urunler/index.html bulunamadı.');
}

console.log('\n🦅 Tarama tamamlandı. Komutanım!');
