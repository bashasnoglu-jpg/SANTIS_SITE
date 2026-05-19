const fs = require('fs');
const path = require('path');

// Hedef Dizinler ve Korunan Alanlar
const TARGET_DIRS = ['./admin', './assets']; // İlk ameliyat alanı güvenli bölgeler
const VALID_EXTENSIONS = ['.html', '.js'];
const IGNORE_DIRS = ['node_modules', '.git', 'scripts', '_dev_archives', '_quarantine', '_archive', '_backup', 'backup_assets', 'backups', 'quarantine_zone', 'Quarantine'];

let totalFilesModified = 0;
let totalInlineStylesStripped = 0;

/**
 * Dosya ağacında gezinir
 */
function scanDirectory(directory) {
    if (!fs.existsSync(directory)) return;

    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) scanDirectory(fullPath);
        } else if (VALID_EXTENSIONS.includes(path.extname(fullPath))) {
            transformStylesInFile(fullPath);
        }
    }
}

/**
 * AST mantığı ile Regex tabanlı güvenli satıriçi (inline) dönüşüm motoru
 */
function transformStylesInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // Etiket ve style attribute ayrıştırması
    const newContent = content.replace(/(<[a-z0-9-]+[^>]*?)(\s+style=["'])(.*?)(["'])([^>]*>)/gi, (match, beforeStyle, stylePrefix, styleContent, styleQuote, afterStyle) => {
        let styles = styleContent.split(';').map(s => s.trim()).filter(s => s);
        let classesToAdd = [];
        let remainingStyles = [];

        styles.forEach(s => {
            let parts = s.split(':').map(p => p.trim());
            if (parts.length === 2) {
                let k = parts[0].toLowerCase();
                let v = parts[1].toLowerCase().replace(/['"]/g, ''); // inter vb. tırnakları temizle

                // KOLAY KAZANIM DÖNÜŞÜM HARİTASI (Tailwind / Utility Standartları)
                if (k === 'display' && v === 'none') classesToAdd.push('hidden');
                else if (k === 'display' && v === 'flex') classesToAdd.push('flex');
                else if (k === 'width' && v === '100%') classesToAdd.push('w-full');
                else if (k === 'text-align' && v === 'center') classesToAdd.push('text-center');
                else if (k === 'cursor' && v === 'pointer') classesToAdd.push('cursor-pointer');
                else if (k === 'position' && v === 'relative') classesToAdd.push('relative');
                else if (k === 'position' && v === 'fixed') classesToAdd.push('fixed');
                else if (k === 'top' && v === '0') classesToAdd.push('top-0');
                else if (k === 'color' && v === '#d4af37') classesToAdd.push('text-[#d4af37]');
                else if (k === 'color' && v === '#fff') classesToAdd.push('text-white');
                else if (k === 'background' && (v === '#0b0d11' || v === 'rgb(11, 13, 17)')) classesToAdd.push('bg-[#0b0d11]');
                else remainingStyles.push(s); // Dokunma, olduğu gibi bırak
            } else {
                remainingStyles.push(s);
            }
        });

        // Eğer hiçbir kuralı çeviremediysek, dokunma
        if (classesToAdd.length === 0) return match;

        totalInlineStylesStripped += classesToAdd.length;
        hasChanges = true;

        // Kalan stiller varsa geri yaz, yoksa style niteliğini tamamen yok et
        let styleStr = remainingStyles.length > 0 ? `${stylePrefix}${remainingStyles.join('; ')};${styleQuote}` : '';
        let reconstructedTag = beforeStyle + styleStr + afterStyle;

        // Yeni sınıfları class="..." içine zerk et veya sıfırdan class yarat
        if (reconstructedTag.match(/class=["']/i)) {
            reconstructedTag = reconstructedTag.replace(/(class=["'])/i, `$1${classesToAdd.join(' ')} `);
        } else {
            reconstructedTag = reconstructedTag.replace(/^(<[a-z0-9-]+)/i, `$1 class="${classesToAdd.join(' ')}"`);
        }

        return reconstructedTag;
    });

    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        totalFilesModified++;
    }
}

console.log("⚔️ AST CSS Transformer: Cerrahi Müdahale Başlıyor...");
TARGET_DIRS.forEach(dir => scanDirectory(dir));

console.log(`\n🩺 OPERASYON TAMAMLANDI`);
console.log(`-------------------------------------------------`);
console.log(`Modifiye Edilen Dosya Sayısı : ${totalFilesModified}`);
console.log(`İmha Edilip Sınıfa Çevrilen Kural : ${totalInlineStylesStripped}`);
console.log(`\n✅ Sistem determinizmi artırıldı. Özgüllük (Specificity) riskleri düşürüldü.`);
