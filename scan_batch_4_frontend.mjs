/**
 * Santis OS - Batch 4: Frontend Dependency Mapping
 * Bu script, HTML dosyalarını tarayarak JS ve CSS referanslarını bulur.
 * Rule #4 (Runtime Truth) ve Rule #7 (Monolith Split Safety) prensiplerini uygular.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_DIR = path.join(__dirname, '.antigravity-reports');

// Taranacak HTML dosyalarını bulmak için özyineli fonksiyon
async function findHtmlFiles(dir, fileList = []) {
    const files = await fs.readdir(dir);
    for (const file of files) {
        // node_modules ve archive klasörlerini atla
        if (file === 'node_modules' || file === 'archive' || file === '.git') continue;
        
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
            await findHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

async function executeFrontendScan() {
    console.log('🌌 Batch 4: Frontend Reality Mapping Başlatılıyor...\n');
    
    const htmlFiles = await findHtmlFiles(__dirname);
    console.log(`🔍 Toplam ${htmlFiles.length} HTML dosyası taranıyor...\n`);

    const scriptReferences = {};
    
    // JS Router'ları izlemek için özel hedefler
    let oldRouterCount = 0;
    let sovereignRouterCount = 0;

    for (const file of htmlFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(__dirname, file);
        
        // sants_router.js kullanımını say
        if (content.includes('santis_router.js')) {
            oldRouterCount++;
            if (!scriptReferences['santis_router.js']) scriptReferences['santis_router.js'] = [];
            scriptReferences['santis_router.js'].push(relativePath);
        }
        
        // santis-sovereign-router.js kullanımını say
        if (content.includes('santis-sovereign-router.js')) {
            sovereignRouterCount++;
            if (!scriptReferences['santis-sovereign-router.js']) scriptReferences['santis-sovereign-router.js'] = [];
            scriptReferences['santis-sovereign-router.js'].push(relativePath);
        }
    }

    // Raporu Oluştur
    let mdContent = `# Santis OS - Frontend Dependency Map (Router Analysis)\nGenerated: ${new Date().toISOString()}\n\n`;
    mdContent += `## Router Kullanım Analizi (Runtime Truth)\n\n`;
    mdContent += `- **santis_router.js (Eski):** ${oldRouterCount} dosyada kullanılıyor.\n`;
    mdContent += `- **santis-sovereign-router.js (Yeni):** ${sovereignRouterCount} dosyada kullanılıyor.\n\n`;
    
    mdContent += `## Detaylı Referans Haritası\n\n`;
    for (const [script, files] of Object.entries(scriptReferences)) {
        mdContent += `### \`${script}\` kullanan HTML dosyaları:\n`;
        files.forEach(f => mdContent += `- \`${f}\`\n`);
        mdContent += `\n`;
    }

    const reportPath = path.join(REPORTS_DIR, 'frontend-dependency-map.md');
    await fs.writeFile(reportPath, mdContent);

    console.log(`✅ Tarama tamamlandı.`);
    console.log(`📊 Sonuç: Eski Router: ${oldRouterCount} kullanım | Sovereign Router: ${sovereignRouterCount} kullanım`);
    console.log(`📄 Detaylı rapor oluşturuldu: ${reportPath}`);
}

executeFrontendScan().catch(console.error);
