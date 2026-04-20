const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ADMIN_DIR = path.join(ROOT, 'admin');
const ARCHIVE_DIR = path.join(ADMIN_DIR, '_archive', 'prototypes');

// Klasör yarat
if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

let movedCount = 0;

function safeMove(folder, item, destFolder) {
    const src = path.join(folder, item);
    const dest = path.join(destFolder, item);
    if (fs.existsSync(src)) {
        try {
            fs.renameSync(src, dest);
            console.log(`[QUARANTINE] Arşivlendi: ${item} -> _archive/prototypes/`);
            movedCount++;
        } catch (e) {
            console.error(`[HATA] ${item} taşınamadı:`, e.message);
        }
    }
}

const mockFiles = [
    'mock-revenue-dashboard.html',
    'resilience-simulator.html',
    'semantic-simulator.htm',
    'semantic-simulator.html',
    'pulse-simulator.html',
    'sdcr-demo.html'
];

mockFiles.forEach(file => {
    safeMove(ADMIN_DIR, file, ARCHIVE_DIR);
});

console.log(`\n✅ Patch 3 (Mock Retirement) Tamamlandı! Toplam ${movedCount} adet mock dosya arşive alındı.\n`);
