/**
 * Santis OS - Batch 5: Backend & Infrastructure Safe Archiving
 * Bu script, kullanılmayan sunucu klasörlerini kalıcı olarak silmeden
 * güvenli bir şekilde arşiv dizinine taşır (Rule #3: Silme Yasağı).
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules ortamında mevcut dizini belirliyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Taşınacak eski (legacy) klasörlerin ve dosyaların listesi
const ITEMS_TO_ARCHIVE = [
    'alembic', 
    'backend', 
    'infrastructure',
    'alembic.ini',
    'requirements.txt'
];

// Hedef arşiv klasörünün yolu
const TARGET_BASE_DIR = path.join(__dirname, 'archive', 'backend_legacy');

async function executeBatch5Archive() {
    console.log('🌌 Batch 5: Legacy Backend Archival Başlatılıyor...\n');

    try {
        // 1. Hedef arşiv klasörünü oluştur (eğer yoksa)
        if (!existsSync(TARGET_BASE_DIR)) {
            await fs.mkdir(TARGET_BASE_DIR, { recursive: true });
            console.log(`✅ Arşiv dizini hazırlandı: archive/backend_legacy/`);
        }

        // 2. Öğeleri sırayla taşı
        for (const item of ITEMS_TO_ARCHIVE) {
            const sourcePath = path.join(__dirname, item);
            const destPath = path.join(TARGET_BASE_DIR, item);

            // Öğe projede gerçekten varsa taşıma işlemini yap
            if (existsSync(sourcePath)) {
                try {
                    // fs.rename, dosyaları/klasörleri taşımak için en güvenli yoldur
                    await fs.rename(sourcePath, destPath);
                    console.log(`📦 TAŞINDI: ${item} -> archive/backend_legacy/${item}`);
                } catch (error) {
                    console.error(`❌ HATA: ${item} taşınırken bir sorun oluştu.`, error.message);
                }
            } else {
                console.log(`⚠️ ATLANDI: ${item} (Sistemde bulunmuyor veya zaten taşınmış)`);
            }
        }

        console.log('\n✨ Batch 5 operasyonu başarıyla tamamlandı.');
    } catch (error) {
        console.error('❌ Beklenmeyen bir sistem hatası oluştu:', error);
    }
}

// Hazırladığımız fonksiyonu çalıştırıyoruz
executeBatch5Archive();
