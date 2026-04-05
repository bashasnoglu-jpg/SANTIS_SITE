const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:\\Users\\tourg\\Desktop\\SANTIS_SITE';

// Kurallar (Safe Autofix Protocol)
const REPLACEMENTS = [
    { target: /https:\/\/santis-club\.com\//g, replacement: '/' },
    { target: /href=["']\/masajlar\/klasik-masaj\.html["']/g, replacement: 'href="/masaj.html"' },
    { target: /href=["']\/masajlar\/aromaterapi-masaji\.html["']/g, replacement: 'href="/masaj.html"' },
    { target: /href=["']\/masajlar\.html["']/g, replacement: 'href="/masaj.html"' },
    { target: /href=["']\/command-center\.html["']/g, replacement: 'href="/admin/command-center.html"' },
    { target: /href=["']\/god-mode\.html["']/g, replacement: 'href="/admin/god-mode.html"' },
    { target: /href=["']\/black-room\.html["']/g, replacement: 'href="/admin/boardroom.html"' },
    { target: /href=["']\/sovereign-os\/audit\.html\?target=santisclub\.com["']/g, replacement: 'href="/admin/boardroom.html"' }
];

function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('dist') && !filePath.includes('_archive') && !filePath.includes('_legacy_archive')) {
                walkDir(filePath, fileList);
            }
        } else {
            if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

console.log('🦅 [Sovereign Auto-Fix] Başlatılıyor...');
const files = walkDir(ROOT_DIR);
let changesCount = 0;

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    for (let rule of REPLACEMENTS) {
        content = content.replace(rule.target, rule.replacement);
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed links in: ${file.replace(ROOT_DIR, '')}`);
        changesCount++;
    }
}

console.log(`\n🎉 Operasyon Tamamlandı. Toplam ${changesCount} dosyada kırık linkler Sovereign standartlarına büküldü.`);
