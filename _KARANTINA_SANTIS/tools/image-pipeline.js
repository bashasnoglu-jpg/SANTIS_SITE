/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🖼️  SANTIS IMAGE PIPELINE v1.0                            ║
 * ║  sharp · AVIF + WebP · Srcset · Focal-Point korumalı      ║
 * ║  Çalıştır: node tools/image-pipeline.js                    ║
 * ║  Watch:    node tools/image-pipeline.js --watch            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Ne yapar?
 *  1. assets/img/src/ altındaki ham görselleri okur
 *  2. Her görsel için 4 boyut üretir: 400w · 800w · 1200w · 1600w
 *  3. Her boyutu WebP (q:82) + AVIF (q:65) formatında kaydeder
 *  4. Focal-point verilerini korumak için EXIF'i temizlemez (sadece sıkıştırır)
 *  5. srcset manifestini JSON olarak üretir → HTML template'i okur
 *  6. LCP görselleri için <link rel="preload"> snippet'i üretir
 *
 * Kurulum (projeye ekle):
 *  npm install --save-dev sharp glob
 *
 * Klasör yapısı:
 *  assets/img/src/          ← ham görsel kaynaklar buraya atılır
 *  assets/img/cards/        ← bento grid karları (output)
 *  assets/img/gallery/      ← galeri görselleri (output)
 *  assets/img/hero/         ← hero görseller (output - LCP öncelikli)
 *  dist/img-manifest.json   ← srcset & preload bilgileri
 */

import sharp   from 'sharp';
import { glob } from 'glob';
import fs       from 'fs';
import path     from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

// ── KONFİGÜRASYON ────────────────────────────────────────────────────────────
const CONFIG = {
    // Kaynak: ham yüksek-çözünürlüklü JPG/PNG/HEIC görseller
    srcDir:  path.join(ROOT, 'assets/img/src'),

    // Hedef klasörler (kategori → alt klasör)
    outDirs: {
        cards:   path.join(ROOT, 'assets/img/cards'),
        gallery: path.join(ROOT, 'assets/img/gallery'),
        hero:    path.join(ROOT, 'assets/img/hero'),
        default: path.join(ROOT, 'assets/img/optimized'),
    },

    // Üretilecek genişlikler (px) — 4K kaynaklardan aşağı scale
    widths: [400, 800, 1200, 1600],

    // LCP (hero) görseller yalnızca daha büyük boyutlarda
    heroWidths: [800, 1200, 1600, 2400],

    // Format kaliteleri
    webp: {
        quality:     82,     // 75-85 arası: görsel fark yok, dosya %40 küçük
        smartSubsample: true,
        effort:      5,      // 0-6: 5 = iyi denge (6 çok yavaş)
    },
    avif: {
        quality:     65,     // AVIF WebP'den ~%30 daha verimli
        effort:      4,
        chromaSubsampling: '4:2:0',
    },
    jpeg: {
        quality:     85,     // Fallback (eski tarayıcılar için)
        progressive: true,
        mozjpeg:     true,
    },

    // Manifest çıktısı
    manifestPath: path.join(ROOT, 'dist/img-manifest.json'),

    // Sadece bu uzantıları işle
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff', 'heic'],

    // Aşırı büyük dosya uyarı eşiği (MB)
    warnSizeThresholdMB: 2,
};

// ── YARDIMCI: Klasör garantisi ────────────────────────────────────────────────
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Klasör oluşturuldu: ${path.relative(ROOT, dirPath)}`);
    }
}

// ── YARDIMCI: Kategori tespiti ────────────────────────────────────────────────
function detectCategory(filePath) {
    const rel = path.relative(CONFIG.srcDir, filePath).toLowerCase();
    if (rel.includes('hero'))    return 'hero';
    if (rel.includes('card'))    return 'cards';
    if (rel.includes('gallery')) return 'gallery';
    return 'default';
}

// ── YARDIMCI: İnsan okunabilir boyut ─────────────────────────────────────────
function humanSize(bytes) {
    return bytes > 1_048_576
        ? `${(bytes / 1_048_576).toFixed(1)} MB`
        : `${(bytes / 1024).toFixed(0)} KB`;
}

// ── ANA: Tek görsel işle ──────────────────────────────────────────────────────
async function processImage(srcPath) {
    const filename  = path.parse(srcPath).name;
    const category  = detectCategory(srcPath);
    const outDir    = CONFIG.outDirs[category];
    const widths    = category === 'hero' ? CONFIG.heroWidths : CONFIG.widths;
    const srcStat   = fs.statSync(srcPath);
    const srcSizeMB = srcStat.size / 1_048_576;

    if (srcSizeMB > CONFIG.warnSizeThresholdMB) {
        console.warn(`⚠️  Büyük kaynak: ${filename} (${srcSizeMB.toFixed(1)} MB) — pipeline yükleniyor...`);
    }

    ensureDir(outDir);

    const image    = sharp(srcPath);
    const meta     = await image.metadata();
    const srcWidth = meta.width || 1600;

    const manifest = {
        src:      path.relative(ROOT, srcPath),
        category,
        original: { width: srcWidth, height: meta.height, size: humanSize(srcStat.size) },
        variants: [],
        srcset:   { webp: '', avif: '' },
        preload:  null,
    };

    // ── Her genişlik için üret ────────────────────────────────────────────────
    for (const w of widths) {
        // Kaynaktan büyük boyut üretme
        if (w > srcWidth * 1.2) continue;

        const resized = image.clone().resize(w, null, {
            withoutEnlargement: true,
            fit:   'inside',
            // Focal point CSS'te object-position ile yapılıyor,
            // resize sadece genişliği kırpar — yüksekliği oransal tutar
        });

        const webpFile = path.join(outDir, `${filename}-${w}w.webp`);
        const avifFile = path.join(outDir, `${filename}-${w}w.avif`);

        // WebP
        const webpInfo = await resized.clone().webp(CONFIG.webp).toFile(webpFile);
        // AVIF
        const avifInfo = await resized.clone().avif(CONFIG.avif).toFile(avifFile);

        const webpRel = path.relative(ROOT, webpFile).replace(/\\/g, '/');
        const avifRel = path.relative(ROOT, avifFile).replace(/\\/g, '/');

        manifest.variants.push({
            width:    w,
            webp:     { path: webpRel, size: humanSize(webpInfo.size) },
            avif:     { path: avifRel, size: humanSize(avifInfo.size) },
        });

        console.log(`  ✅ ${w}w → WebP ${humanSize(webpInfo.size)} | AVIF ${humanSize(avifInfo.size)}`);
    }

    // ── srcset oluştur ────────────────────────────────────────────────────────
    if (manifest.variants.length > 0) {
        manifest.srcset.webp = manifest.variants
            .map(v => `/${v.webp.path} ${v.width}w`).join(', ');
        manifest.srcset.avif = manifest.variants
            .map(v => `/${v.avif.path} ${v.width}w`).join(', ');

        // LCP preload: en büyük WebP (hero için)
        if (category === 'hero') {
            const largest = manifest.variants.at(-1);
            manifest.preload = `<link rel="preload" as="image" href="/${largest.webp.path}" imagesrcset="${manifest.srcset.webp}" imagesizes="100vw" fetchpriority="high"/>`;
        }
    }

    return manifest;
}

// ── HTML SNIPPET ÜRETİCİ ──────────────────────────────────────────────────────
function buildHtmlSnippet(manifest) {
    const {variants, srcset, category} = manifest;
    if (!variants.length) return '';

    const fallback = variants.find(v => v.width === 800) || variants.at(-1);
    const isHero   = category === 'hero';
    const sizes    = isHero
        ? '100vw'
        : '(max-width: 480px) 92vw, (max-width: 1100px) 45vw, 800px';

    return `<picture>
  <source type="image/avif"
    srcset="${srcset.avif}"
    sizes="${sizes}"/>
  <source type="image/webp"
    srcset="${srcset.webp}"
    sizes="${sizes}"/>
  <img
    src="/${fallback.webp.path}"
    alt="[AÇIKLAMA]"
    ${isHero ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}
    width="${manifest.original.width}"
    height="[YÜKSEKLİK]"
    data-focal="0.5 0.3"
  />
</picture>`;
}

// ── ANA ÇALIŞMA DÖNGÜSÜ ───────────────────────────────────────────────────────
async function run() {
    console.log('\n🖼️  Santis Image Pipeline v1.0 başlatılıyor...\n');

    ensureDir(CONFIG.srcDir);
    Object.values(CONFIG.outDirs).forEach(ensureDir);

    // Kaynak dosyaları topla
    const pattern = `${CONFIG.srcDir}/**/*.{${CONFIG.extensions.join(',')}}`;
    const files   = await glob(pattern, { absolute: true });

    if (files.length === 0) {
        console.log(`⚠️  Kaynak görsel bulunamadı: ${CONFIG.srcDir}`);
        console.log('   PNG/JPG/WEBP dosyalarınızı assets/img/src/ altına atın.\n');
        return;
    }

    console.log(`📦 ${files.length} görsel işlenecek\n`);

    const manifests = [];
    const snippets  = {};
    let totalSaved  = 0;

    for (const file of files) {
        const name = path.basename(file);
        console.log(`\n🔄 ${name}`);

        try {
            const manifest = await processImage(file);
            manifests.push(manifest);
            snippets[name]  = buildHtmlSnippet(manifest);
        } catch (err) {
            console.error(`  ❌ Hata: ${err.message}`);
        }
    }

    // ── Manifest kaydet ───────────────────────────────────────────────────────
    ensureDir(path.dirname(CONFIG.manifestPath));
    const output = {
        generated:  new Date().toISOString(),
        totalFiles: manifests.length,
        images:     manifests,
        htmlSnippets: snippets,
    };
    fs.writeFileSync(CONFIG.manifestPath, JSON.stringify(output, null, 2), 'utf-8');

    // ── Özet ──────────────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────────────');
    console.log(`✅ Pipeline tamamlandı!`);
    console.log(`📊 ${manifests.length} görsel × ${CONFIG.widths.length} boyut × 2 format`);
    console.log(`📄 Manifest: ${path.relative(ROOT, CONFIG.manifestPath)}`);
    console.log('─────────────────────────────────────────────\n');

    // LCP preload snippet'lerini bas
    const heroes = manifests.filter(m => m.preload);
    if (heroes.length) {
        console.log('🚀 LCP Preload Snippet\'leri (Hero görseller için <head>\'e ekleyin):');
        heroes.forEach(m => console.log('\n' + m.preload));
    }
}

// ── WATCH MODU ────────────────────────────────────────────────────────────────
async function watchMode() {
    console.log('👁️  Watch modu aktif — assets/img/src/ izleniyor...\n');
    const { watch } = await import('chokidar');
    const watcher = watch(CONFIG.srcDir, {
        ignored:        /node_modules/,
        persistent:     true,
        ignoreInitial:  false,
    });

    const handle = async (filePath) => {
        const ext = path.extname(filePath).slice(1).toLowerCase();
        if (!CONFIG.extensions.includes(ext)) return;
        console.log(`\n🔔 Değişiklik tespit edildi: ${path.basename(filePath)}`);
        try { await processImage(filePath); }
        catch (e) { console.error('  ❌', e.message); }
    };

    watcher.on('add', handle).on('change', handle);
}

// ── GİRİŞ ─────────────────────────────────────────────────────────────────────
const isWatch = process.argv.includes('--watch');
if (isWatch) {
    watchMode();
} else {
    run();
}
