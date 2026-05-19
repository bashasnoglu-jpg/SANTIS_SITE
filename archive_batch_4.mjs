/**
 * SANTIS OS - ARCHIVE BATCH 4: FRONTEND ROUTER DE-DUPLICATION
 * Rule #3 (Deletion Prohibition) compliant.
 */
import fs from 'fs';
import path from 'path';

const filesToArchive = [
    'assets/js/core/santis_router.js',
    'assets/js/core/santis-sovereign-router.js',
    'assets/js/core/sovereign-router.js',
    'assets/js/core/aurelia-router.js',
    'assets/js/core/santis-cognitive-router.js',
    'assets/js/core/santis-quantum-router.js',
    'assets/js/core/santis.bootstrap.js',
    'assets/js/core/santis-route-controller.js'
];

const targetDir = 'archive/js/core';

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

console.log('🚀 Batch 4: Frontend Router De-duplication başlatılıyor...');

filesToArchive.forEach(file => {
    if (fs.existsSync(file)) {
        const dest = path.join(targetDir, path.basename(file));
        fs.renameSync(file, dest);
        console.log(`✅ TAŞINDI: ${file} -> ${dest}`);
    } else {
        console.log(`⚠️ ATLANDI (Bulunamadı): ${file}`);
    }
});

console.log('✨ Batch 4 operasyonu tamamlandı.');
