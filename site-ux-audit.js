/**
 * Ultra Mega UX & Navigation Audit Script v2 (No-Dep Edition)
 * Kullanım: node site-ux-audit.js [dizin]
 * Örnek:    node site-ux-audit.js tr/urunler
 * Not: jsdom gerektirmez — saf Node.js built-in
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || '.');
const CUT = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const navItems = new Map();
const recent = [];
const uxIssues = [];

// ─── services.json kategorileri ───────────────────────────────────────────────
const svcPath = path.join(path.resolve('.'), 'assets/data/services.json');
const realCats = new Set();
let missingUrlCount = 0;

if (fs.existsSync(svcPath)) {
    JSON.parse(fs.readFileSync(svcPath, 'utf8')).forEach(item => {
        const cat = (item.category || item.categoryId || '').toString().trim().toLowerCase();
        if (cat) realCats.add(cat);
        if (!item.url && !item.detailUrl) missingUrlCount++;
    });
}

// ─── Tek HTML dosyası analizi ──────────────────────────────────────────────────
function analyseHtml(fullPath, rel) {
    const html = fs.readFileSync(fullPath, 'utf8');

    // Nav linkleri (href içeren a etiketleri)
    const linkRe = /<a[^>]+href="([^"#?]{2,})"[^>]*>([\s\S]*?)<\/a>/gi;
    let lm;
    while ((lm = linkRe.exec(html)) !== null) {
        const url = lm[1].trim();
        const label = lm[2].replace(/<[^>]+>/g, '').trim() || '(no label)';
        if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) continue;
        if (!navItems.has(url)) {
            navItems.set(url, {
                label, url,
                depth: url.split('/').filter(Boolean).length - 1,
                foundIn: rel,
                broken: !fs.existsSync(path.join(path.resolve('.'), url.replace(/^\//, '')))
            });
        }
    }

    // data-filter butonları vs gerçek kategoriler
    const filterRe = /data-filter="([^"]+)"/g;
    let fm;
    while ((fm = filterRe.exec(html)) !== null) {
        const f = fm[1];
        if (f === 'all') continue;
        if (!realCats.has(f.toLowerCase())) {
            uxIssues.push({
                tip: '❌ Kırık Filtre',
                detay: `data-filter="${f}" engine'de yok`,
                dosya: rel
            });
        } else {
            uxIssues.push({ tip: '✅ Filtre OK', detay: `data-filter="${f}"`, dosya: rel });
        }
    }

    // Detay sayfası kontrolü
    if (rel.includes('detay.html')) {
        const hasStaticH1 = /<h1[^>]*>Detay<\/h1>/i.test(html);
        const hasDynamic = html.includes('id="nv-dynamic-content"');
        const hasFactory = html.includes('PageFactory');

        if (hasStaticH1) uxIssues.push({ tip: '❌ Detay Sayfası', detay: '<h1>Detay</h1> statik — SEO/UX hatalı', dosya: rel });
        if (hasFactory) uxIssues.push({ tip: '❌ Detay JS', detay: 'PageFactory tanımsız — crash riski', dosya: rel });
        if (!hasDynamic) uxIssues.push({ tip: '⚠️  Detay Layout', detay: '#nv-dynamic-content eksik', dosya: rel });
    }

    // Quick View + script etiketleri (urunler index)
    if (rel.includes('urunler/index.html')) {
        ['boutique-quickview.js', 'boutique-prefetch.js', 'santis-checkout-vault.js', 'santis-boutique-engine.js'].forEach(s => {
            uxIssues.push({
                tip: html.includes(s) ? '✅ Script OK' : '❌ Script Eksik',
                detay: s,
                dosya: rel
            });
        });
    }
}

// ─── Dizin tarayıcı ───────────────────────────────────────────────────────────
function scan(dir) {
    let entries;
    try { entries = fs.readdirSync(dir); } catch { return; }
    for (const e of entries) {
        const full = path.join(dir, e);
        const stats = fs.statSync(full);
        if (/(_dev_archives|venv|node_modules|\.git|_backup)/.test(full)) continue;

        if (stats.mtime > CUT) {
            const rel = '/' + path.relative(ROOT, full).replace(/\\/g, '/');
            const type = path.extname(e).replace('.', '').toUpperCase() || 'DIR';
            recent.push({ file: e, url: rel, lastModified: stats.mtime.toISOString().slice(0, 16).replace('T', ' '), type });
        }

        if (stats.isDirectory()) {
            scan(full);
        } else if (path.extname(e).toLowerCase() === '.html') {
            try { analyseHtml(full, '/' + path.relative(ROOT, full).replace(/\\/g, '/')); }
            catch { /* skip */ }
        }
    }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
console.log(`\n🔍 Taranıyor: ${ROOT}\n`);
scan(ROOT);

const navArr = [...navItems.values()];
const broken = navArr.filter(n => n.broken);
const sortRecent = recent.sort((a, b) => b.lastModified.localeCompare(a.lastModified));

const report = {
    generatedAt: new Date().toISOString(),
    summary: {
        totalNavItems: navArr.length,
        brokenLinks: broken.length,
        recentFiles: sortRecent.length,
        uxIssues: uxIssues.length,
        servicesMissingUrl: missingUrlCount
    },
    navigation: navArr,
    recentUpdates: sortRecent,
    uxIssues
};

fs.writeFileSync('site-ux-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('💾 site-ux-report.json kaydedildi.\n');

// Konsol özet
console.log('📊 ÖZET:');
console.table(report.summary);

console.log('\n❌ KIRRIK LİNKLER (ilk 10):');
console.table(broken.slice(0, 10).map(n => ({ Label: n.label.slice(0, 30), URL: n.url, Kaynak: n.foundIn })));

console.log('\n🛍️ UX SORUNLARI:');
console.table(uxIssues.map(u => ({ Tip: u.tip, Detay: u.detay, Dosya: u.dosya.slice(-40) })));

const htmlNew = sortRecent.filter(u => u.type === 'HTML').slice(0, 10);
console.log('\n📄 SON 7 GÜN HTML (ilk 10):');
console.table(htmlNew.map(u => ({ Dosya: u.file, Tarih: u.lastModified })));

console.log('\n🦅 UX Tarama tamamlandı. Komutanım!');
