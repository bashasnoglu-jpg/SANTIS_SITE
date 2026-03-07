const puppeteer = require('puppeteer');
const fs = require('fs');
const fetch = require('node-fetch');
const { Parser } = require('json2csv');

const START_URL = 'http://127.0.0.1:8000'; // Changed to 8000 based on user's setup
const visited = new Set();
const queue = [START_URL];
const broken_links = [];
let assets_checked = 0;

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    console.log('🕵️‍♂️ Ultra-Crawler başlatıldı...');

    while (queue.length > 0) {
        const url = queue.shift();
        if (visited.has(url)) continue;
        visited.add(url);

        try {
            const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 }); // increased timeout
            const status = response ? response.status() : 0;
            console.log(`✅ ${url} [${status}]`);

            if (status >= 400) {
                broken_links.push(`${url} (${status}) - Found on: ${url} [Internal]`);
            }

            // Sayfadaki tüm linkleri al
            const links = await page.evaluate(() =>
                Array.from(document.querySelectorAll('a')).map(a => a.href).filter(Boolean)
            );

            for (const link of links) {
                if (!link.startsWith('http')) continue;

                // Internal link
                if (link.includes('127.0.0.1:8000') || link.includes('localhost:8000')) {
                    // Normalize internal link (remove hash, trailing slash)
                    const cleanLink = link.split('#')[0].replace(/\/$/, "");
                    if (!visited.has(cleanLink) && !queue.includes(cleanLink)) queue.push(cleanLink);
                } else {
                    // External link: HEAD request ile status kontrolü
                    let extStatus = 0;
                    try {
                        const res = await fetch(link, { method: 'HEAD', timeout: 10000 });
                        extStatus = res.status;
                    } catch (err) {
                        extStatus = 0;
                    }

                    if (extStatus === 0) {
                        broken_links.push(`${link} (0 - External / CORS / Unreachable) - Found on: ${url}`);
                    } else if (extStatus >= 400) {
                        broken_links.push(`${link} (${extStatus} - External) - Found on: ${url}`);
                    }
                }
            }

            // Assets kontrolü
            const assets = await page.evaluate(() => {
                const imgs = Array.from(document.querySelectorAll('img')).map(img => img.src);
                const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
                const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
                return [...imgs, ...scripts, ...links].filter(Boolean);
            });

            for (const asset of assets) {
                assets_checked++;

                // Skip common external trackers
                if (asset.includes('google.com') || asset.includes('analytics') || asset.includes('facebook')) continue;

                try {
                    // Check asset using page context to handle relative paths correctly if any remained, 
                    // but page.goto is for navigation. Better to use fetch inside page or node-fetch if absolute.
                    // Since we have absolute URLs from page.evaluate, we can use fetch.
                    // However, page.goto is heavy. Let's use fetch.

                    let assetStatus = 0;
                    try {
                        const res = await fetch(asset, { method: 'HEAD', timeout: 5000 });
                        assetStatus = res.status;
                    } catch (e) { assetStatus = 0; }

                    if (assetStatus >= 400) {
                        broken_links.push(`${asset} (${assetStatus} - Asset) - Found on: ${url}`);
                    }
                } catch (err) {
                    broken_links.push(`${asset} (0 - Asset / CORS / Unreachable) - Found on: ${url}`);
                }
            }

        } catch (err) {
            broken_links.push(`${url} (0 - Internal / Hata) - Found on: ${url} | Error: ${err.message}`);
            console.log(`❌ ${url} - Hata: ${err.message}`);
        }
    }

    await browser.close();

    // JSON çıktı - Adapter for Admin Panel
    // Admin panel expects: pages_scanned, assets_checked, broken_links (array of strings)
    const auditReport = {
        pages_scanned: visited.size,
        assets_checked,
        broken_links: broken_links
    };
    fs.writeFileSync('admin/audit_report.json', JSON.stringify(auditReport, null, 2));

    // CSV export
    if (broken_links.length > 0) {
        const csvData = broken_links.map(b => {
            // Parse "URL (Status) - Found on: Source"
            const parts = b.split(' - Found on: ');
            const left = parts[0];
            const source = parts[1] || 'Unknown';

            const statusMatch = left.match(/\((.*?)\)/);
            const status = statusMatch ? statusMatch[1] : 'Unknown';
            const url = left.split(' (')[0];

            return {
                Source: source,
                Target: url,
                Type: left.includes('Asset') ? 'Asset' : 'Link',
                Status: status
            };
        });

        const parser = new Parser({ fields: ['Source', 'Target', 'Type', 'Status'] });
        const csv = parser.parse(csvData);
        fs.writeFileSync('admin/audit_full_export.csv', csv);
    } else {
        fs.writeFileSync('admin/audit_full_export.csv', "Source,Target,Type,Status\nSystem,No Broken Links,Info,OK");
    }

    console.log('✅ Tarama tamamlandı. JSON ve CSV kaydedildi.');
})();
