const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT_DIR = 'C:\\Users\\tourg\\Desktop\\SANTIS_SITE';
const LOCAL_SERVER = 'http://localhost:8080';

// Find all HTML and JS files
function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('_dev_archives')) {
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

// Extract links using regex
function extractLinks(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /(href|src)=["']([^"']+)["']/g;
    const links = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        links.push(match[2]);
    }
    return links;
}

async function checkUrl(url, sourceFile) {
    let checkUrl = url;
    if (url.startsWith('/')) {
        checkUrl = LOCAL_SERVER + url;
    } else if (!url.startsWith('http')) {
        if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) return null;
        if (!url.includes('.html') && !url.includes('.js') && !url.includes('.css') && !url.includes('.webp') && !url.includes('.png') && !url.includes('.jpg')) {
            return null;
        }
        
        // Resolve relative URL based on source file's directory
        const relativeDir = path.dirname(sourceFile.replace(ROOT_DIR, '')).replace(/\\/g, '/');
        const baseUrl = new URL(LOCAL_SERVER + (relativeDir.startsWith('/') ? relativeDir : '/' + relativeDir) + '/');
        checkUrl = new URL(url, baseUrl).href;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(checkUrl, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        
        if (response.status === 404) {
            return { file: sourceFile.replace(ROOT_DIR, ''), url, status: 404 };
        }
        return null;
    } catch (err) {
        return { file: sourceFile.replace(ROOT_DIR, ''), url, status: err.name === 'AbortError' ? 'TIMEOUT' : 'ERROR' };
    }
}

async function runAudit() {
    console.log('🦅 [Sovereign Audit] Link Scanner Initiated...');
    const files = walkDir(ROOT_DIR);
    let allLinks = [];
    
    // Specifically filtering to admin directory as requested by the user, and root files
    const targetFiles = files.filter(f => f.includes('\\admin\\') || f.split('\\').length <= 6); 

    for (let file of targetFiles) {
        const links = extractLinks(file);
        for (let link of links) {
            allLinks.push({ url: link, file });
        }
    }
    
    console.log(`Found ${allLinks.length} total raw links. Testing...`);
    
    // Deduplicate exact matches to avoid pinging the same link 1000 times
    const uniqueChecks = new Map();
    for (let item of allLinks) {
        if (!uniqueChecks.has(item.url)) uniqueChecks.set(item.url, item);
    }
    
    const results = [];
    const urlsToTest = Array.from(uniqueChecks.values());
    
    // Batch processing
    const batchSize = 50;
    for (let i = 0; i < urlsToTest.length; i += batchSize) {
        process.stdout.write(`Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urlsToTest.length/batchSize)}...\r`);
        const batch = urlsToTest.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(item => checkUrl(item.url, item.file)));
        for (let res of batchResults) {
            if (res) results.push(res);
        }
    }
    
    console.log('\n\n✅ Scan Complete. Writing 404s to CSV...');
    
    const csvHeader = 'Status,URL,SourceFile\n';
    const csvContent = results.map(r => `${r.status},"${r.url}","${r.file}"`).join('\n');
    
    fs.writeFileSync(path.join(ROOT_DIR, 'admin_404s.csv'), csvHeader + csvContent);
    console.log(`❌ Found ${results.length} broken links. Saved to admin_404s.csv`);
}

runAudit();
