/**
 * Santis OS - Batch 3: Assets Reality Mapping
 * Bu script, Rule #2 (Scan-First) ve Rule #5 (Performance Integrity) kapsamında
 * projede yer alan ağır medya dosyalarını tespit eder ve raporlar.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Taranacak kaynak dizin ve raporların yazılacağı hedef dizin
const ASSETS_DIR = path.join(__dirname, 'assets');
const REPORTS_DIR = path.join(__dirname, '.antigravity-reports');

// Performans için kritik boyut eşikleri (Bytes cinsinden)
const THRESHOLDS = {
    IMAGE: 300 * 1024, // 300 KB
    VIDEO: 2 * 1024 * 1024, // 2 MB
};

// İncelenecek uzantılar
const TARGET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.mp4', '.webm', '.gif']);

// Özyineli (Recursive) dizin tarama fonksiyonu
async function walkDir(dir) {
    let results = [];
    try {
        const list = await fs.readdir(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(await walkDir(filePath));
            } else {
                results.push({ filePath, stat });
            }
        }
    } catch (err) {
        if (err.code !== 'ENOENT') console.error(`Okuma hatası: ${dir}`, err);
    }
    return results;
}

// Dosya boyutunu okunabilir formata çevirme
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function executeAssetMapping() {
    console.log('🌌 Batch 3: Assets Reality Mapping Başlatılıyor...\n');
    await fs.mkdir(REPORTS_DIR, { recursive: true });

    const allFiles = await walkDir(ASSETS_DIR);
    const heavyAssets = [];

    for (const { filePath, stat } of allFiles) {
        const ext = path.extname(filePath).toLowerCase();
        if (!TARGET_EXTENSIONS.has(ext)) continue;

        const isImage = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext);
        const isVideo = ['.mp4', '.webm'].includes(ext);
        const size = stat.size;

        let isHeavy = false;
        if (isImage && size > THRESHOLDS.IMAGE) isHeavy = true;
        if (isVideo && size > THRESHOLDS.VIDEO) isHeavy = true;

        if (isHeavy) {
            heavyAssets.push({
                file: path.relative(__dirname, filePath),
                type: isImage ? 'Image' : 'Video',
                sizeBytes: size,
                sizeFormatted: formatBytes(size)
            });
        }
    }

    // Boyuta göre büyükten küçüğe sırala
    heavyAssets.sort((a, b) => b.sizeBytes - a.sizeBytes);

    // Raporları oluştur
    const jsonReportPath = path.join(REPORTS_DIR, 'asset-reality-map.json');
    const mdReportPath = path.join(REPORTS_DIR, 'asset-reality-map.md');

    // JSON Çıktısı
    await fs.writeFile(jsonReportPath, JSON.stringify(heavyAssets, null, 2));

    // Markdown Çıktısı
    let mdContent = `# Santis OS - Heavy Assets Report\nGenerated: ${new Date().toISOString()}\n\n`;
    mdContent += `**Total Heavy Assets Detected:** ${heavyAssets.length}\n\n`;
    mdContent += `| File Path | Type | Size |\n| :--- | :--- | :--- |\n`;
    heavyAssets.forEach(asset => {
        mdContent += `| \`${asset.file}\` | ${asset.type} | **${asset.sizeFormatted}** |\n`;
    });

    await fs.writeFile(mdReportPath, mdContent);

    console.log(`✅ Tarama tamamlandı. ${heavyAssets.length} adet kritik dosya tespit edildi.`);
    console.log(`📄 Raporlar oluşturuldu:\n - ${jsonReportPath}\n - ${mdReportPath}`);
}

executeAssetMapping();
