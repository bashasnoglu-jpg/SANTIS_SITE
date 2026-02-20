const fs = require('fs');

const path = require('path');



const ROOT_DIR = path.resolve(__dirname, '..');

const IGNORE_DIRS = ['.git', 'node_modules', '.gemini', 'tickets', 'backup_legacy'];

const IGNORE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.css', '.js', '.json', '.md', '.txt']; // We only scan HTML for *source* links



let errorCount = 0;

let checkedFiles = 0;



function getAllFiles(dirPath, arrayOfFiles) {

    const files = fs.readdirSync(dirPath);



    arrayOfFiles = arrayOfFiles || [];



    files.forEach(function (file) {

        const fullPath = path.join(dirPath, file);

        if (fs.statSync(fullPath).isDirectory()) {

            if (!IGNORE_DIRS.includes(file)) {

                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);

            }

        } else {

            if (file.endsWith('.html')) {

                arrayOfFiles.push(fullPath);

            }

        }

    });



    return arrayOfFiles;

}



function checkFile(filePath) {

    const content = fs.readFileSync(filePath, 'utf8');

    const relativePath = path.relative(ROOT_DIR, filePath);



    // Regex to find src and href

    // Captures group 2: the URL

    const regex = /(src|href)=["']([^"']+)["']/g;

    let match;



    while ((match = regex.exec(content)) !== null) {

        const attr = match[1];

        const link = match[2];



        // Ignore Empty, Anchors, Cloudflare, Google Fonts, External

        if (!link || link.startsWith('#') || link.startsWith('http') || link.startsWith('//') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('javascript:')) {

            continue;

        }



        // Ignore Template strings

        if (link.includes('{{') || link.includes('${')) {

            continue;

        }



        let targetPath;

        // Absolute path from root (starts with /)

        if (link.startsWith('/')) {

            targetPath = path.join(ROOT_DIR, link);

        } else {

            // Relative path

            targetPath = path.resolve(path.dirname(filePath), link);

        }



        // Clean query params ?v=...

        if (targetPath.includes('?')) {

            targetPath = targetPath.split('?')[0];

        }



        // Clean anchor #...

        if (targetPath.includes('#')) {

            targetPath = targetPath.split('#')[0];

        }



        if (!fs.existsSync(targetPath)) {

            console.log(`❌ [404] File: ${relativePath}\n   Link: ${link}\n   Resolved: ${targetPath}\n`);

            errorCount++;

        }

    }

    checkedFiles++;

}



console.log(`🔍 Starting Audit in ${ROOT_DIR}...`);

const htmlFiles = getAllFiles(ROOT_DIR);

console.log(`📄 Found ${htmlFiles.length} HTML files.`);



let report = `AUDIT REPORT - ${new Date().toISOString()}\n`;

report += `Scanned Files: ${htmlFiles.length}\n----------------------------------------\n`;



htmlFiles.forEach(file => {

    // checkFile logic needs to append to report logic inside checkFile scope, 

    // but easiest way is simply redo the loop structure or append to a global string

    // Let's redefine checkFile or wrap it. 

    // Actually, simpler to just rewrite the main Logic here.

    checkFile(file);

});



function checkFile(filePath) {

    const content = fs.readFileSync(filePath, 'utf8');

    const relativePath = path.relative(ROOT_DIR, filePath);

    const regex = /(src|href)=["']([^"']+)["']/g;

    let match;



    while ((match = regex.exec(content)) !== null) {

        const attr = match[1];

        const link = match[2];



        if (!link || link.startsWith('#') || link.startsWith('http') || link.startsWith('//') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('javascript:')) continue;

        if (link.includes('{{') || link.includes('${')) continue;



        let targetPath;

        if (link.startsWith('/')) {

            targetPath = path.join(ROOT_DIR, link);

        } else {

            targetPath = path.resolve(path.dirname(filePath), link);

        }



        if (targetPath.includes('?')) targetPath = targetPath.split('?')[0];

        if (targetPath.includes('#')) targetPath = targetPath.split('#')[0];



        if (!fs.existsSync(targetPath)) {

            const msg = `❌ [404] File: ${relativePath}\n   Link: ${link}\n   Resolved: ${targetPath}\n`;

            console.log(msg);

            report += msg + "\n";

            errorCount++;

        }

    }

    checkedFiles++;

}



console.log(`\n🏁 Audit Complete.`);

console.log(`📂 Scanned: ${checkedFiles} files.`);

console.log(`🚨 Errors: ${errorCount}`);



report += `\nTotal Errors: ${errorCount}\n`;

fs.writeFileSync('audit_results_latest.txt', report, 'utf8');

console.log("📝 Report saved to audit_results_latest.txt");

