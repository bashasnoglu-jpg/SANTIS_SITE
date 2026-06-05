import fs from 'fs';
import path from 'path';

// Santis OS Sovereign Guard - "Zero Tolerance" Architectural Enforcer
// Bütün bağımlılık hataları, SSOT ihlalleri ve Legacy sızıntıları burada acımasızca kesilir.

const color = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gold: '\x1b[33m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const RULES = [
    {
        name: "Legacy Eradication (HQ Dashboard)",
        pattern: /(hq-dashboard\.html|\/hq-dashboard|hq-cyber-luxury\.css)/i,
        message: "Legacy HQ Dashboard referansları yasaktır. React Boardroom (/admin/) kullanın.",
        excludePath: /(_archive|docs|sovereign-guard\.mjs)/ // Ignore archives and self
    },
    {
        name: "Legacy Eradication (Admin Dashboard)",
        pattern: /(admin-dashboard\.html)/i,
        message: "Legacy Admin Dashboard referansları yasaktır. React Boardroom (/admin/) kullanın.",
        excludePath: /(_archive|docs|sovereign-guard\.mjs)/
    },
    {
        name: "CoreState SSOT Violation",
        pattern: /window\.SantisAdminState\s*=|RadarEngine\.init\(/g,
        message: "Global admin state manipülasyonu yasaktır. SSOT kuralı: Sadece SovereignSocketProvider state'i yönetebilir.",
        excludePath: /(_archive|docs|sovereign-guard\.mjs)/
    }
];

function scanFile(filePath) {
    if (!fs.existsSync(filePath)) return true;
    
    // Yalnızca okunabilir metin dosyalarını tara (Binary/Asset atla)
    if (filePath.match(/\.(png|jpg|jpeg|gif|ico|webp|svg|woff|woff2|ttf|eot|pdf|mp4|webm|zip|tar|gz)$/i)) {
        return true;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let hasViolation = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const rule of RULES) {
            // Check exclusion
            if (rule.excludePath && rule.excludePath.test(filePath.replace(/\\/g, '/'))) {
                continue;
            }

            if (rule.pattern.test(line)) {
                hasViolation = true;
                console.error(`\n${color.red}${color.bold}🛡️ [SOVEREIGN GUARD] KURAL İHLALİ TESPİT EDİLDİ!${color.reset}`);
                console.error(`${color.gold}Kural:    ${rule.name}${color.reset}`);
                console.error(`${color.gold}Dosya:    ${filePath}:${i + 1}${color.reset}`);
                console.error(`${color.cyan}Kod:      ${line.trim()}${color.reset}`);
                console.error(`${color.red}Sebep:    ${rule.message}${color.reset}`);
            }
        }
    }

    return !hasViolation;
}

// lint-staged tarafından pass edilen dosyaları al
const files = process.argv.slice(2);

if (files.length === 0) {
    console.log(`${color.cyan}🛡️ [SOVEREIGN GUARD] Taranacak dosya bulunamadı.${color.reset}`);
    process.exit(0);
}

console.log(`${color.cyan}🛡️ [SOVEREIGN GUARD] ${files.length} dosya üzerinde mimari denetim başlatılıyor...${color.reset}`);

let allClean = true;

for (const file of files) {
    const isClean = scanFile(file);
    if (!isClean) {
        allClean = false;
    }
}

if (!allClean) {
    console.error(`\n${color.red}${color.bold}❌ [FATAL] Mimari ihlaller nedeniyle işlem reddedildi. Lütfen hataları düzeltin.${color.reset}`);
    process.exit(1);
}

console.log(`${color.green}${color.bold}✅ [SOVEREIGN GUARD] Tüm dosyalar Santis OS mimari standartlarına uygun.${color.reset}`);
process.exit(0);
