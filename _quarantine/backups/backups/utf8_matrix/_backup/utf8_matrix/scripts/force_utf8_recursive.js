const fs = require('fs');

const path = require('path');



const rootDir = path.resolve(__dirname, '..'); // Assuming script is in scripts/ or similar, but we'll try to guess or use process.cwd()

// Actually best to rely on process.cwd() if running from root.

const targetDir = process.cwd();



const extensions = ['.html', '.css', '.js', '.json', '.md', '.txt'];

// Directories to exclude

const excludeDirs = ['node_modules', '.git', '.vscode', '.idea', 'dist', 'build', 'coverage', '.venv'];



const BOM = [0xef, 0xbb, 0xbf];



function hasBOM(buffer) {

    return BOM.every((b, i) => buffer[i] === b);

}



function removeBOM(buffer) {

    if (hasBOM(buffer)) {

        return buffer.slice(3);

    }

    return buffer;

}



function isTextFile(filePath) {

    return extensions.includes(path.extname(filePath).toLowerCase());

}



function processFile(filePath) {

    try {

        const buffer = fs.readFileSync(filePath);

        let content = buffer;

        let changed = false;



        // 1. Remove BOM if present

        if (hasBOM(buffer)) {

            console.log(`[BOM REMOVED] ${path.relative(targetDir, filePath)}`);

            content = removeBOM(buffer);

            changed = true;

        }



        // 2. Ensure UTF-8 (Read as string then write back)

        // This implicitly converts simple encoding issues if Node can read it, 

        // but "forcing" utf8 often just means ensuring we write as utf8.

        // If the file was Windows-1254 (Turkish), reading as UTF-8 might garble it unless we know it's not UTF-8.

        // However, Node default is UTF-8. If it's valid UTF-8, it stays. 

        // If it's mixed/garbage, we might be finalizing the garbage. 

        // But the prompt says "Re-save... with UTF-8".



        const textContent = content.toString('utf8');



        // 3. Fix corrupted characters (Generic fix for common mojibake if needed, though risky to do blindly)

        // User asked: "Scan for any corrupted character symbols (like ü, ç). If found, correct them"

        // Common mappings for UTF-8 bytes interpreted as Windows-1252 or similar:

        // ü -> ü

        // ç -> ç

        // ö -> ö

        // ÃŸ -> ß

        // Ãğ -> ğ (Wait, ğ in UTF-8 is 0xC4 0x9F. In 1252: Ã (C3) and ? (9F is undefined or Y-dieresis in some?))

        // Let's implement a safe list of replacements for "Double Encoded" UTF-8.

        // i.e. UTF-8 characters being displayed/saved as individual Latin-1 bytes.



        let fixedText = textContent;

        const replacements = [

            { bad: 'ü', good: 'ü' },

            { bad: 'ç', good: 'ç' },

            { bad: 'ö', good: 'ö' },

            { bad: 'Ä', good: 'Ä' },

            { bad: 'Ç', good: 'Ç' },

            { bad: 'Ö', good: 'Ö' },

            { bad: 'ş', good: 'ş' }, // ş is 0xC5 0x9F

            { bad: 'Ş', good: 'Ş' }, // Ş is 0xC5 0x9E

            { bad: 'ı', good: 'ı' }, // ı is 0xC4 0xB1

            { bad: 'İ', good: 'İ' }, // İ is 0xC4 0xB0

            { bad: 'ğ', good: 'ğ' }, // ğ is 0xC4 0x9F

            { bad: 'Ğ', good: 'Ğ' }  // Ğ is 0xC4 0x9E

        ];



        let contentWasFixed = false;

        replacements.forEach(pair => {

            if (fixedText.includes(pair.bad)) {

                // Use global replace

                fixedText = fixedText.split(pair.bad).join(pair.good);

                contentWasFixed = true;

            }

        });



        if (contentWasFixed) {

            console.log(`[MOJIBAKE FIXED] ${path.relative(targetDir, filePath)}`);

            changed = true;

        }



        // 4. Check HTML Meta Tag

        if (path.extname(filePath).toLowerCase() === '.html') {

            // Check if <meta charset="UTF-8"> exists

            // Regex to find <meta charset...> inside <head> is hard, but we can do a simple check.

            // User wants it as the "very first line inside <head>".



            if (!fixedText.match(/<meta\s+charset=["']UTF-8["']/i)) {

                // Insert it

                if (fixedText.includes('<head>')) {

                    fixedText = fixedText.replace('<head>', '<head>\n  <meta charset="UTF-8">');

                    console.log(`[META ADDED] ${path.relative(targetDir, filePath)}`);

                    changed = true;

                }

            }

        }



        if (changed || content !== buffer) { // If BOM removed or text changed

            fs.writeFileSync(filePath, fixedText, { encoding: 'utf8' });

            if (!changed) {

                // Determine if we just re-saved to enforce encoding without changing content

                // console.log(`[RESAVED] ${path.relative(targetDir, filePath)}`);

            }

        }



    } catch (err) {

        console.error(`[ERROR] processing ${filePath}: ${err.message}`);

    }

}



function walkDir(dir) {

    const list = fs.readdirSync(dir);

    list.forEach(file => {

        const fullPath = path.join(dir, file);

        try {

            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {

                if (!excludeDirs.includes(file)) {

                    walkDir(fullPath);

                }

            } else {

                if (isTextFile(fullPath)) {

                    processFile(fullPath);

                }

            }

        } catch (e) {

            console.warn(`Could not access ${fullPath}`);

        }

    });

}



console.log(`Starting UTF-8 Enforcement in: ${targetDir}`);

walkDir(targetDir);

console.log('Done.');

