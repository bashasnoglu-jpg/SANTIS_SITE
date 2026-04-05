const fs = require('fs');
const path = require('path');

// Taranacak kök dizinler ve dosya tipleri
const TARGET_DIRS = ['./', './assets']; 
const VALID_EXTENSIONS = ['.html', '.js'];
const IGNORE_DIRS = ['node_modules', '.git', 'scripts', '_dev_archives', '_quarantine', '_archive', '_backup', 'backup_assets', 'backups', 'quarantine_zone', 'Quarantine', 'visual_checkpoints', 'test-results', '_deploy_stage'];

let totalFilesScanned = 0;
let totalInlineTags = 0;
const ruleFrequency = {};

/**
 * Dosyaları özyinelemeli (recursive) olarak tarar.
 */
function scanDirectory(directory) {
    if (!fs.existsSync(directory)) return;

    const files = fs.readdirSync(directory);
    
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                scanDirectory(fullPath);
            }
        } else if (VALID_EXTENSIONS.includes(path.extname(fullPath))) {
            extractStylesFromFile(fullPath);
            totalFilesScanned++;
        }
    }
}

/**
 * Dosya içindeki style="..." niteliklerini bulur ve kuralları ayrıştırır.
 */
function extractStylesFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // HTML ve JS stringleri içindeki style="müdahalelerini" yakalayan regex
    const styleRegex = /style\s*=\s*(["'])(.*?)\1/gi;
    
    let match;
    while ((match = styleRegex.exec(content)) !== null) {
        totalInlineTags++;
        const rawStyle = match[2];
        
        // CSS kurallarını parçalara ayır (örn: "display:none; color:red;")
        const rules = rawStyle.split(';')
            .map(r => r.trim().toLowerCase())
            .filter(r => r.length > 0);

        rules.forEach(rule => {
            if (!ruleFrequency[rule]) {
                ruleFrequency[rule] = { count: 0, examples: new Set() };
            }
            ruleFrequency[rule].count++;
            if (ruleFrequency[rule].examples.size < 2) {
                ruleFrequency[rule].examples.add(filePath);
            }
        });
    }
}

// 1. Tarama İşlemini Başlat
console.log("🕵️‍♂️ AST CSS Extractor istihbarat toplamaya başlıyor...\n");
TARGET_DIRS.forEach(dir => scanDirectory(dir));

// 2. Verileri Derle ve Sırala
const sortedRules = Object.entries(ruleFrequency)
    .map(([rule, data]) => ({ rule, count: data.count, examples: Array.from(data.examples) }))
    .sort((a, b) => b.count - a.count);

// 3. Raporu Oluştur
console.log(`📊 TARAMA ÖZETİ`);
console.log(`-------------------------------------------------`);
console.log(`Taranan Dosya Sayısı : ${totalFilesScanned}`);
console.log(`Bulunan style="..."  : ${totalInlineTags}`);
console.log(`Farklı CSS Kuralı    : ${sortedRules.length}\n`);

console.log(`🎯 KOLAY KAZANIMLAR (En Çok Tekrar Eden 15 Kural)`);
console.log(`Bu kurallar otonom olarak Utility Class'lara (örn: Tailwind) dönüştürülebilir.`);
console.log(`-------------------------------------------------`);
sortedRules.slice(0, 15).forEach((item, index) => {
    console.log(`${index + 1}. [${item.count} kez] -> ${item.rule}`);
    console.log(`    Örnek Dosya: ${item.examples[0]}`);
});

console.log(`\n✅ İstihbarat raporu tamamlandı.`);
