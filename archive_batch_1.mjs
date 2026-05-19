// archive_batch_1.mjs
// Santis OS - Antigravity Governance Protocol v2.0
// Batch 1: Docs & Governance Safe Archiving Script
// MIGRATION PHILOSOPHY: Deletion is forbidden. Move only.

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ortam yollarını belirleme
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hedef arşiv dizini
const TARGET_DIR = path.join(__dirname, 'archive', 'stale_reports');
const SCRIPTS_ARCHIVE_DIR = path.join(__dirname, 'archive', 'scripts');

// Taşınacak dosyaların listesi (Sınıflandırma Tablosuna Göre)
const filesToArchive = [
    { src: 'docs/archive/_card_fix_round2.py', destDir: SCRIPTS_ARCHIVE_DIR },
    { src: 'docs/archive/_test_cats.py', destDir: SCRIPTS_ARCHIVE_DIR },
    { src: 'docs/archive/_test_svc.py', destDir: SCRIPTS_ARCHIVE_DIR },
    { src: 'docs/reports/ADMIN_PANEL_DURUM_RAPORU.md', destDir: TARGET_DIR },
    { src: 'docs/reports/AUTOMATION_STRATEGY.md', destDir: TARGET_DIR },
    { src: 'docs/reports/FUTURE_SCALE_STRATEGY.md', destDir: TARGET_DIR },
    { src: 'docs/reports/HATA_ANALIZ_RAPORU.md', destDir: TARGET_DIR },
    { src: 'docs/reports/PLANNING_ADMIN.md', destDir: TARGET_DIR },
    { src: 'docs/reports/PLANNING_COMMERCE.md', destDir: TARGET_DIR },
    { src: 'docs/reports/PROJECT_AUDIT_REPORT.md', destDir: TARGET_DIR },
    { src: 'docs/reports/SAGLIK_RAPORU.md', destDir: TARGET_DIR },
    { src: 'docs/reports/SOCIAL_MEDIA_MEGA_PLAN.md', destDir: TARGET_DIR },
    { src: 'docs/reports/URUN_YONETIMI_RAPORU.md', destDir: TARGET_DIR }
];

async function executeSafeArchive() {
    console.log('🌌 Antigravity Batch 1 Archiving Protocol Initiated...\n');

    try {
        // Hedef dizinlerin var olduğundan emin ol
        await fs.mkdir(TARGET_DIR, { recursive: true });
        await fs.mkdir(SCRIPTS_ARCHIVE_DIR, { recursive: true });
        
        console.log(`✅ Arşiv dizinleri doğrulandı.`);

        // 2. Dosyaları sırayla taşı
        for (const fileObj of filesToArchive) {
            const sourcePath = path.join(__dirname, fileObj.src);
            const fileName = path.basename(sourcePath);
            const destinationPath = path.join(fileObj.destDir, fileName);

            try {
                // Dosyanın kaynakta var olup olmadığını kontrol et
                await fs.access(sourcePath);
                
                // Güvenli taşıma
                await fs.rename(sourcePath, destinationPath);
                console.log(`📦 TAŞINDI: ${fileObj.src} -> ${path.relative(__dirname, fileObj.destDir)}`);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    console.log(`⚠️ ATLANDI: ${fileObj.src} (Dosya bulunamadı)`);
                } else {
                    console.error(`❌ HATA: ${fileObj.src} taşınırken bir sorun oluştu:`, err.message);
                }
            }
        }

        console.log('\n✅ Batch 1 Taşıma İşlemi Güvenle Tamamlandı.');
    } catch (error) {
        console.error('Kritik Sistem Hatası:', error);
    }
}

// Scripti çalıştır
executeSafeArchive();
