const fs = require('fs');
const path = require('path');

const TARGETS = [
    'assets/css/style.css',
    'assets/js/app.js',
    'assets/js/db.js',
    'assets/js/massage-data.js',
    'assets/js/hammam-data.js',
    'assets/js/skincare-data.js'
];

function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ')             // Collapse whitespace
        .replace(/\s*([{}:;,])\s*/g, '$1') // Remove space around chars
        .replace(/;}/g, '}')              // Remove last semicolon
        .trim();
}

function minifyJS(js) {
    return js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/^\s*\/\/.*$/gm, '')     // Remove single-line comments
        .replace(/\s+/g, ' ')             // Collapse whitespace (Risky for JS, be careful with strings)
        // Simple regex minification is dangerous for JS due to ASI and strings.
        // We will be very conservative: only strip comments and extra newlines.
        .replace(/;}/g, '}')
        .trim();
}

// Safer JS Minifier relying on tokenizing concepts is too complex for a regex script.
// We will focus on Stripping Comments and Newlines primarily for JS.
function safeMinifyJS(js) {
    let lines = js.split('\n');
    let out = [];
    for (let line of lines) {
        let trimmed = line.trim();
        // Remove simple comments
        if (trimmed.startsWith('//')) continue;
        if (!trimmed) continue;
        out.push(trimmed);
    }
    return out.join('\n'); // Keep newlines for safety but remove empty ones/comments
}

function run() {
    console.log("Starting Minification...");
    let savedTotal = 0;

    TARGETS.forEach(file => {
        const p = path.join(__dirname, '..', file);
        if (fs.existsSync(p)) {
            try {
                const original = fs.readFileSync(p, 'utf8');
                let minified = "";
                const ext = path.extname(p);

                if (ext === '.css') {
                    minified = minifyCSS(original);
                } else if (ext === '.js') {
                    minified = safeMinifyJS(original);
                }

                // Create .min file
                const minPath = p.replace(ext, '.min' + ext);
                fs.writeFileSync(minPath, minified);

                const origSize = original.length;
                const minSize = minified.length;
                const saved = origSize - minSize;
                savedTotal += saved;

                console.log(`[OK] ${file}: ${(origSize / 1024).toFixed(1)}KB -> ${(minSize / 1024).toFixed(1)}KB`);

            } catch (e) {
                console.error(`[ERR] ${file}: ${e.message}`);
            }
        }
    });

    console.log(`\nTotal Saved: ${(savedTotal / 1024).toFixed(2)} KB`);
}

run();
