/*!
 * Heuristic Zombie Hunter v2.0 (Zero Dependencies)
 * Gelişmiş String/Regex analizörü. AST'nin kaçırdığı window binding'leri, event listener'ları ve inline handler'ları yakalar.
 * Bağımlılık gerektirmez. Doğrudan `node scripts/ast_zombie_scanner.js` ile çalıştırılabilir.
 */

const fs = require('fs');
const path = require('path');

const TARGET_JS_DIR = path.join(__dirname, '../assets/js');
const TARGET_PROJECT_DIR = path.join(__dirname, '../');

function getAllFiles(dir, extArray, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            // Ignore node_modules, .git, and quarantine folders
            const ignoreList = ['node_modules', '.git', '_dev_archives', 'dist', '.next'];
            if (!ignoreList.some(ig => filePath.includes(ig))) {
                getAllFiles(filePath, extArray, fileList);
            }
        } else {
            if (extArray.some(ext => file.endsWith(ext))) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

function scanDeclarations(jsFiles) {
    const definedFunctions = new Map();

    jsFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            
            // 1. function myFunc(...) 
            const funcRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
            let m;
            while ((m = funcRegex.exec(content)) !== null) {
                if (!definedFunctions.has(m[1])) definedFunctions.set(m[1], new Set());
                definedFunctions.get(m[1]).add(file);
            }
            
            // 2. const/let/var myFunc = function | () =>
            const arrowRegex = /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g;
            while ((m = arrowRegex.exec(content)) !== null) {
                if (!definedFunctions.has(m[1])) definedFunctions.set(m[1], new Set());
                definedFunctions.get(m[1]).add(file);
            }

        } catch (e) {
            console.error(`Okuma hatası: ${file}`, e);
        }
    });
    return definedFunctions;
}

function findUsages(allFiles, definedFunctions) {
    // Klonla
    const orphans = new Set(definedFunctions.keys());

    // Yanlış pozitiften kaçınmak için ignore edilecek genel kelimeler
    const ignoreWords = ['init', 'App', 'Main', 'start', 'loader', 'initApp', 'render', 'update'];
    ignoreWords.forEach(w => orphans.delete(w));

    allFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            
            for (const funcName of Array.from(orphans)) {
                // Eğer kelime olarak geçiyorsa
                const usageRegex = new RegExp(`\\b${funcName}\\b`, 'g');
                const matches = [...content.matchAll(usageRegex)];

                if (matches.length > 0) {
                    // Kendi declaration'ını saymaması için heuristics:
                    // Eğer dosya fonksiyonun tanımlandığı dosyaysa ve SADECE 1 KERE geçiyorsa (bu 1 deklare etmektir), 
                    // o zaman kullanılmamış sayılır (orphan olarak kalır).
                    const definedInThisFile = definedFunctions.get(funcName).has(file);
                    
                    if (definedInThisFile && matches.length === 1) {
                        // Sadece kendi declaration'ı
                        continue; 
                    }

                    // 1'den fazla geçiyorsa veya BAŞKA DOSYADA geçiyorsa: KULLANILIYOR DEMEKTİR.
                    // (Window scope, addEventListener, string ref, onclick = hepsi kelime bazlı olduğu için yakalanır!)
                    orphans.delete(funcName);
                }
            }
        } catch (e) {}
    });

    return orphans;
}

function main() {
    console.log("🕵️‍♂️ [Phase C] Heuristic Zombie Scanner Başlıyor... (Zero Dependency)");
    
    const jsFiles = getAllFiles(TARGET_JS_DIR, ['.js']);
    const definedFunctions = scanDeclarations(jsFiles);
    console.log(`[*] assets/js içinde toplam ${definedFunctions.size} benzersiz fonksiyon tanımlaması bulundu.`);

    const allFiles = getAllFiles(TARGET_PROJECT_DIR, ['.html', '.js', '.ts', '.tsx', '.md']);
    console.log(`[*] Tüm proje bazında referans kontrolü yapılıyor (${allFiles.length} dosya)...`);
    
    const orphans = findUsages(allFiles, definedFunctions);
    
    console.log("\n==================================================");
    console.log(`🚨 KESİN ÖKSÜZ (HARD DELETE ADAYI) FONKSİYONLAR: ${orphans.size} Adet`);
    console.log("==================================================");
    
    if (orphans.size === 0) {
        console.log("Tertemiz! Kullanılmayan fonksiyon kalıntısı bulunamadı.");
    } else {
        orphans.forEach(orp => {
            const files = Array.from(definedFunctions.get(orp)).map(f => path.basename(f)).join(', ');
            console.log(`- ${orp}  [Dosya: ${files}]`);
        });
    }
}

main();
