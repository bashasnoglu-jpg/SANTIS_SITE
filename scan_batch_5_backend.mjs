/**
 * Santis OS - Batch 5: Backend Runtime Reality Mapping
 * Bu script, arka uç (backend) ve altyapı klasörlerinin mevcut sistem 
 * ayar dosyalarında referansı olup olmadığını tarar.
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_DIR = path.join(__dirname, '.antigravity-reports');

// Taranacak potansiyel backend klasörleri
const BACKEND_DIRS = ['alembic', 'backend', 'server', 'infrastructure'];

// Sunucu/Edge davranışını belirleyen kritik ayar dosyaları
const CONFIG_FILES = [
    'vercel.json', 
    'wrangler.toml', 
    'netlify.toml', 
    'docker-compose.yml', 
    'package.json', 
    'pnpm-workspace.yaml'
];

async function executeBackendScan() {
    console.log('🌌 Batch 5: Backend Reality Mapping Başlatılıyor...\n');
    
    let report = `# Santis OS - Backend & Infrastructure Reality Map\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    report += `## 📁 1. Klasör Varlık Analizi\n\n`;
    
    // Klasörlerin var olup olmadığını kontrol edelim
    for (const dir of BACKEND_DIRS) {
        const dirPath = path.join(__dirname, dir);
        if (existsSync(dirPath)) {
            const files = await fs.readdir(dirPath);
            report += `- **${dir}/** : Mevcut (İçerisinde ${files.length} dosya/klasör var)\n`;
        } else {
            report += `- **${dir}/** : Bulunamadı (Sistemde yok)\n`;
        }
    }

    report += `\n## ⚙️ 2. Konfigürasyon ve Bağımlılık Analizi (Runtime Truth)\n\n`;
    
    // Ayar dosyalarının içeriklerini tarayalım
    for (const file of CONFIG_FILES) {
        const filePath = path.join(__dirname, file);
        if (existsSync(filePath)) {
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Ayar dosyasında backend klasörlerinin adı geçiyor mu?
            const foundReferences = BACKEND_DIRS.filter(dir => content.includes(dir));
            
            if (foundReferences.length > 0) {
                report += `- **${file}**: ⚠️ DİKKAT! Şunlara referans içeriyor: \`${foundReferences.join(', ')}\` (Durum: RUNTIME_POSSIBLE)\n`;
            } else {
                report += `- **${file}**: Temiz. Backend referansı yok.\n`;
            }
        }
    }

    // Raporu dosyaya yazalım
    const reportPath = path.join(REPORTS_DIR, 'backend-reality-map.md');
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    await fs.writeFile(reportPath, report);
    
    console.log(`✅ Backend taraması tamamlandı.`);
    console.log(`📄 Rapor oluşturuldu: ${reportPath}`);
}

// Scripti çalıştırıyoruz
executeBackendScan().catch(console.error);
