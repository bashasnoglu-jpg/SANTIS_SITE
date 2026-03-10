/**
 * 🦅 SANTIS ULTRA MEGA AUDIT v3.0 (Konsolide Edition)
 * Kullanım: node ultra-audit.js [dizin]
 * Örnek:    node ultra-audit.js .
 * Not:      jsdom gerekmez — saf Node.js built-in
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || '.');
const CUT = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const navItems = new Map();
const recent = [];
const uxIssues = [];

// ─── services.json kategorileri + URL kontrolü ────────────────────────────────
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

// ─── Tek HTML analizi ──────────────────────────────────────────────────────────
function analyseHtml(fullPath, rel) {
    const html = fs.readFileSync(fullPath, 'utf8');

    // 1. Nav linkleri
    const linkRe = /<a[^>]+href="([^"#?]{2,})"[^>]*>([\s\S]*?)<\/a>/gi;
    let lm;
    while ((lm = linkRe.exec(html)) !== null) {
        const url = lm[1].trim();
        const label = lm[2].replace(/<[^>]+>/g, '').trim() || '(no label)';
        if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) continue;
        if (url.length < 2) continue;
        if (!navItems.has(url)) {
            navItems.set(url, {
                label, url,
                depth: url.split('/').filter(Boolean).length - 1,
                foundIn: rel,
                broken: !fs.existsSync(path.join(path.resolve('.'), url.replace(/^\//, '')))
            });
        }
    }

    // 2. Filtre butonu vs engine kategori kontrolü (prefix-aware)
    const filterRe = /data-filter="([^"]+)"/g;
    let fm;
    while ((fm = filterRe.exec(html)) !== null) {
        const f = fm[1];
        if (f === 'all') continue;
        // Prefix eşleşmesi: "skincare" → skincare-purify ✅
        const prefixMatch = [...realCats].some(cat => cat.startsWith(f) || cat === f);
        uxIssues.push({
            tip: prefixMatch ? '✅ Filtre OK' : '❌ Kırık Filtre',
            detay: `data-filter="${f}" ${prefixMatch ? '→ prefix eşleşti' : '→ engine\'de bulunamadı'}`,
            dosya: rel
        });
    }

    // 3. Detay sayfası kontrolleri
    if (rel.includes('detay.html')) {
        if (/<h1[^>]*>Detay<\/h1>/i.test(html))
            uxIssues.push({ tip: '❌ Detay Sayfası', detay: '<h1>Detay</h1> statik kalmış', dosya: rel });
        if (html.includes('PageFactory'))
            uxIssues.push({ tip: '❌ Detay JS', detay: 'PageFactory tanımsız — crash riski', dosya: rel });
        if (!html.includes('id="nv-dynamic-content"'))
            uxIssues.push({ tip: '⚠️  Detay Layout', detay: '#nv-dynamic-content eksik', dosya: rel });
    }

    // 4. Mağaza script kontrolleri
    if (rel.endsWith('urunler/index.html')) {
        ['boutique-quickview.js', 'boutique-prefetch.js', 'santis-checkout-vault.js', 'santis-boutique-engine.js']
            .forEach(s => uxIssues.push({
                tip: html.includes(s) ? '✅ Script OK' : '❌ Script Eksik',
                detay: s, dosya: rel
            }));
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
            const type = path.extname(e).replace('.', '').toUpperCase() || 'DIR';
            recent.push({
                file: e,
                url: '/' + path.relative(ROOT, full).replace(/\\/g, '/'),
                lastModified: stats.mtime.toISOString().slice(0, 16).replace('T', ' '),
                type
            });
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
console.log(`\n🦅 SANTIS ULTRA AUDIT v3.0`);
console.log(`📂 Kök: ${ROOT}`);
console.log(`📅 7 gün eşiği: ${CUT.toISOString().slice(0, 10)}\n`);

scan(ROOT);

const navArr = [...navItems.values()];
const broken = navArr.filter(n => n.broken);
const sortRec = recent.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
const htmlRec = sortRec.filter(u => u.type === 'HTML');
const jsRec = sortRec.filter(u => u.type === 'JS');
const uxErrors = uxIssues.filter(u => u.tip.includes('❌'));
const uxOk = uxIssues.filter(u => u.tip.includes('✅'));

// JSON rapor
const report = {
    generatedAt: new Date().toISOString(),
    rootDir: ROOT,
    summary: {
        totalNavItems: navArr.length,
        brokenLinks: broken.length,
        okLinks: navArr.length - broken.length,
        recentFileCount: sortRec.length,
        uxErrors: uxErrors.length,
        uxOk: uxOk.length,
        servicesMissingUrl: missingUrlCount
    },
    navigation: navArr,
    brokenLinks: broken,
    recentUpdates: sortRec,
    uxIssues
};

fs.writeFileSync('ultra-audit-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('💾 ultra-audit-report.json kaydedildi.\n');

// ─── KONSOL RAPORU ────────────────────────────────────────────────────────────
console.log('📊 ÖZET:');
console.table(report.summary);

console.log(`\n❌ KIRRIK LİNKLER (${broken.length} adet — ilk 15):`);
console.table(broken.slice(0, 15).map(n => ({
    Label: n.label.slice(0, 35),
    URL: n.url,
    Kaynak: n.foundIn.slice(-45),
    Depth: n.depth
})));

console.log('\n🛍️ UX KONTROLLER:');
console.table(uxIssues.map(u => ({ Durum: u.tip, Detay: u.detay, Dosya: u.dosya.slice(-40) })));

console.log(`\n📄 SON 7 GÜN HTML (${htmlRec.length} dosya — ilk 15):`);
console.table(htmlRec.slice(0, 15).map(u => ({ Dosya: u.file, URL: u.url.slice(-50), Tarih: u.lastModified })));

console.log(`\n⚡ SON 7 GÜN JS (${jsRec.length} dosya — ilk 20):`);
console.table(jsRec.slice(0, 20).map(u => ({ Dosya: u.file, Tarih: u.lastModified })));
if (jsRec.length > 20) console.log(`  ... ve ${jsRec.length - 20} dosya daha. Tam liste JSON'da.`);

console.log(`\n📦 Services.json eksik URL: ${missingUrlCount === 0 ? '✅ 0 (Temiz!)' : `⚠️  ${missingUrlCount}`}`);
console.log('\n🦅 Ultra Mega Audit tamamlandı. Komutanım!');
