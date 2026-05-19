import fs from 'fs';
import path from 'path';

const CORE_DIR = 'assets/js/core';
const JS_DIRS = ['assets/js/core', 'assets/js/modules', 'assets/js/boot'];
const HTML_DIR = '.';

const routerFiles = [
    'santis_router.js',
    'santis-sovereign-router.js',
    'sovereign-router.js',
    'aurelia-router.js',
    'santis-cognitive-router.js',
    'santis-quantum-router.js',
    'santis-image-router.js'
];

const results = {};

routerFiles.forEach(file => {
    results[file] = {
        htmlRefs: 0,
        jsRefs: 0,
        refFiles: []
    };
});

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    routerFiles.forEach(router => {
        // Check for direct filename reference (script src or import)
        if (content.includes(router)) {
            results[router].jsRefs++;
            results[router].refFiles.push(filePath);
        }
    });
}

function walk(dir, extension, callback) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'archive' && !file.startsWith('.')) {
                walk(fullPath, extension, callback);
            }
        } else if (file.endsWith(extension)) {
            callback(fullPath);
        }
    });
}

console.log('Scanning JS files...');
JS_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) walk(dir, '.js', scanFile);
});

console.log('Scanning HTML files...');
walk(HTML_DIR, '.html', (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    routerFiles.forEach(router => {
        if (content.includes(router)) {
            results[router].htmlRefs++;
            results[router].refFiles.push(filePath);
        }
    });
});

console.log('\n--- ROUTER USAGE REPORT ---');
Object.keys(results).forEach(router => {
    const r = results[router];
    console.log(`\n[${router}]`);
    console.log(`- HTML References: ${r.htmlRefs}`);
    console.log(`- JS References: ${r.jsRefs}`);
    if (r.refFiles.length > 0) {
        console.log(`- Top References: ${[...new Set(r.refFiles)].slice(0, 5).join(', ')}`);
    } else {
        console.log('- STATUS: POSSIBLY DEAD / ORPHANED');
    }
});
