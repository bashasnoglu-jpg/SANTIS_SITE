const { chromium } = require('playwright');
const fs = require('fs');

async function runSantisDiagnostic(targetUrl) {
    console.log(`🦅 [Sovereign Diagnostik] Kuantum X-Ray Başlatılıyor: ${targetUrl}`);

    const browser = await chromium.launch();
    const isBotMode = process.argv.includes('--bot');
    const userAgent = isBotMode
        ? "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.94 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        : undefined;

    const context = await browser.newContext({
        recordHar: { path: './logs/network-trace.har' },
        userAgent: userAgent
    });
    const page = await context.newPage();

    const incidentData = {
        timestamp: new Date().toISOString(),
        url: targetUrl,
        mode: isBotMode ? 'Googlebot' : 'Human',
        consoleLogs: [],
        networkErrors: [],
        santisMetrics: {},
        seoMetrics: {},
        performanceMarks: []
    };

    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }

    // 1. DINLEME: Konsol Hataları ve XHR İstekleri
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            incidentData.consoleLogs.push({ type: msg.type(), text: msg.text() });
        }
    });

    page.on('response', resp => {
        if (resp.status() >= 400) {
            incidentData.networkErrors.push({ url: resp.url(), status: resp.status() });
        }
    });

    // 2. YÜKLEME: Lüks bir şekilde bağlantı bekle (networkidle)
    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });

        // 🧨 2.5 CHAOS ENGINEERING: Otonom Sabotaj (Kill-Switch Testi)
        console.log("🧨 [Chaos Engineering] Sovereign Rail motoruna suni sabotaj enjekte ediliyor...");
        await page.evaluate(() => {
            const tracks = document.querySelectorAll('.rail-track');
            tracks.forEach(track => {
                // 1. Rayın genişliğini sıfıra indirerek (Kuantum Çökmesi simülasyonu)
                track.style.width = '0px';
                track.style.display = 'none';

                // 2. Sistemin (MutationObserver) bu çöküşü anında fark etmesi için Dom Tree'yi sarsıyoruz
                const dummyGhostCard = document.createElement('div');
                dummyGhostCard.className = 'nv-rail-card ghost-sabotage';
                track.appendChild(dummyGhostCard);
            });
        });

        // Sistemin kendi kendine toparlaması (Safe Mode Fallback) için kısa bir süre bekle (150ms yeterli)
        await page.waitForTimeout(500);

        // KANIT: Ekranı fotoğrafla
        const snapPath = `./logs/incident-snapshot-${Date.now()}.png`;
        await page.screenshot({ path: snapPath, fullPage: true });
        incidentData.snapshotPath = snapPath;

        // 3. X-RAY (Zero-Side-Effect page.evaluate)
        incidentData.santisMetrics = await page.evaluate(() => {
            return {
                tenantId: window.SANTIS_TENANT_ID || 'Bilinmiyor',
                catalogSize: window.productCatalog ? window.productCatalog.length : 0,
                skincareCount: window.NV_SKINCARE ? window.NV_SKINCARE.length : 0,
                domRailsActive: document.querySelectorAll('[data-rail-active="true"]').length,
                domCardsInjected: document.querySelectorAll('.nv-rail-card').length,
                isKillSwitchEngaged: !!document.querySelector('.kill-switch-active'),
                isSafeMode: !!document.querySelector('.rail-safe')
            };
        });

        // 4. PERFORMANS (Kuantum Geçiş Cihazları)
        incidentData.performanceMarks = await page.evaluate(() => {
            if (typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function') {
                return performance.getEntriesByType("mark").map(entry => ({
                    name: entry.name,
                    time: entry.startTime.toFixed(2) + 'ms'
                }));
            }
            return [];
        });

        // 5. SEO & DISCOVERY METRICS (Edge SSR Testi İçin)
        incidentData.seoMetrics = await page.evaluate(() => {
            const getMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || null;
            const getLdJson = () => {
                const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                try { return scripts.map(s => JSON.parse(s.innerHTML)); } catch (e) { return []; }
            };
            return {
                title: document.title,
                description: getMeta('description'),
                canonical: document.querySelector('link[rel="canonical"]')?.href || null,
                h1Count: document.querySelectorAll('h1').length,
                jsonLdSchemas: getLdJson().map(schema => schema['@type'] || 'Unknown')
            };
        });

        // 6. KANIT (Fotoğraf) - Eğer Sistem Patladıysa
        if (incidentData.santisMetrics.isKillSwitchEngaged || incidentData.networkErrors.length > 0) {
            const snapPath = `./logs/incident-snapshot-${Date.now()}-${isBotMode ? 'Googlebot' : 'Sovereign'}.png`;
            await page.screenshot({ path: snapPath, fullPage: true });
            incidentData.snapshotPath = snapPath;
            console.log(`📸 [Sovereign Diagnostik] Kritik arıza tespit edildi. Olay yeri fotoğrafı çekildi: ${snapPath}`);
        }

    } catch (err) {
        incidentData.fatalError = err.message;
    } finally {
        // 6. RAPORU ÇIKART
        fs.writeFileSync('./logs/sovereign-incident-payload.json', JSON.stringify(incidentData, null, 2));
        await browser.close();
        console.log("✅ [Sovereign Diagnostik] Tamamlandı. JSON Raporu ./logs dizininde hazır.");
    }
}

// Örnek Kullanım:
const target = process.argv[2] || `file://${__dirname.replace(/\\/g, '/')}/../tr/rituals/index.html`;
runSantisDiagnostic(target);
