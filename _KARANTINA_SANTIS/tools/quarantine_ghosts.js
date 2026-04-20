const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARCHIVE_DIR = path.join(ROOT, '_dev_archives');
const QUARANTINE_DIR = path.join(ROOT, '_quarantine');

// Klasörleri yarat
[
    path.join(ARCHIVE_DIR, 'python_scripts'),
    path.join(ARCHIVE_DIR, 'js_tools'),
    path.join(ARCHIVE_DIR, 'reports'),
    path.join(QUARANTINE_DIR, 'backups'),
    path.join(QUARANTINE_DIR, 'html_prototypes')
].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

let movedCount = 0;

function safeMove(item, destFolder) {
    const src = path.join(ROOT, item);
    const dest = path.join(destFolder, item);
    if (fs.existsSync(src)) {
        try {
            fs.renameSync(src, dest);
            console.log(`[QUARANTINE] Mühürlendi: ${item} -> ${path.basename(destFolder)}/`);
            movedCount++;
        } catch (e) {
            console.error(`[HATA] ${item} taşınamadı:`, e.message);
        }
    }
}

// 1. PYTHON BETİKLERİ VE KÖK DOSYALARI
const items = fs.readdirSync(ROOT);

items.forEach(item => {
    // Klasörleri geç (Backup haric)
    const isDir = fs.lstatSync(path.join(ROOT, item)).isDirectory();
    
    if (isDir) {
        if (item.toLowerCase().includes('backup')) {
            safeMove(item, path.join(QUARANTINE_DIR, 'backups'));
        }
        return;
    }

    // Python test dosyaları
    if (item.endsWith('.py')) {
        safeMove(item, path.join(ARCHIVE_DIR, 'python_scripts'));
    }
    // CSV Raporları
    else if (item.endsWith('.csv') || item.includes('audit_report')) {
        safeMove(item, path.join(ARCHIVE_DIR, 'reports'));
    }
    // Geliştirici test JS betikleri (server.js, vs. hariç)
    else if (item.match(/^(tmp_|fix_|test_|debug_|build_|translate_|_|add_|check_|implement_).*\.js$/i)) {
        safeMove(item, path.join(ARCHIVE_DIR, 'js_tools'));
    }
    // Geliştirici mockup/test html sayfaları
    else if (item.match(/^(test|demo|spaos-.*-demo|test-dashboard|sdcr-.*|3d-lab|santis-oracle|santis-matrix-simulator)\.html$/i) || item === 'index_backup.html') {
        safeMove(item, path.join(QUARANTINE_DIR, 'html_prototypes'));
    }
});

console.log(`\n✅ Sovereign Hygiene Tamamlandı! Toplam ${movedCount} adet hayalet dosya / klasör karantinaya alındı.\n`);
