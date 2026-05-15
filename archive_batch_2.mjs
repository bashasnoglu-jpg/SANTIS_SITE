/**
 * Santis OS - Batch 2: Scripts Safe Archiving
 * Bu script, Rule #3 (Silme Yasağı) kapsamında geçici scriptleri
 * legacy (eski) klasörüne güvenle taşır.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules ortamında kök dizini belirlemek için yolları yapılandırıyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kaynak ve hedef dizinlerimizi tanımlıyoruz
const SOURCE_DIR = path.join(__dirname, 'archive', 'scripts');
const TARGET_DIR = path.join(__dirname, 'archive', 'scripts', '_legacy_fixes');

async function executeBatch2Archive() {
    console.log('🌌 Batch 2 Taşıma İşlemi Başlatılıyor...\n');

    try {
        // 1. Adım: Hedef klasörün var olduğundan emin ol (yoksa otomatik oluşturulur)
        await fs.mkdir(TARGET_DIR, { recursive: true });
        console.log(`✅ Hedef arşiv dizini hazır: ${TARGET_DIR}`);

        // 2. Adım: Kaynak dizindeki dosyaları oku
        let files;
        try {
            files = await fs.readdir(SOURCE_DIR);
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.error(`❌ Kaynak dizin bulunamadı: ${SOURCE_DIR}`);
                return;
            }
            throw err; // Başka bir hata varsa fırlat
        }

        // 3. Adım: Yalnızca "tmp_" ile başlayan .py ve .js dosyalarını filtrele
        const tmpFiles = files.filter(file => 
            file.startsWith('tmp_') && (file.endsWith('.py') || file.endsWith('.js'))
        );

        if (tmpFiles.length === 0) {
            console.log('ℹ️ Taşınacak "tmp_" ön ekli dosya bulunamadı.');
            return;
        }

        console.log(`🔍 Toplam ${tmpFiles.length} adet dosya tespit edildi. Taşıma başlıyor...`);

        // 4. Adım: Filtrelenen dosyaları döngüye sok ve güvenle taşı
        for (const fileName of tmpFiles) {
            const sourcePath = path.join(SOURCE_DIR, fileName);
            const destinationPath = path.join(TARGET_DIR, fileName);

            try {
                // fs.rename ile dosyayı yeni konumuna taşıyoruz
                await fs.rename(sourcePath, destinationPath);
                console.log(`📦 TAŞINDI: ${fileName} -> _legacy_fixes/`);
            } catch (err) {
                console.error(`❌ HATA: ${fileName} taşınırken bir sorun oluştu:`, err.message);
            }
        }

        console.log('\n✅ Batch 2 Taşıma İşlemi Güvenle Tamamlandı.');
    } catch (error) {
        console.error('❌ Kritik Sistem Hatası:', error);
    }
}

// Hazırladığımız fonksiyonu çalıştırıyoruz
executeBatch2Archive();
