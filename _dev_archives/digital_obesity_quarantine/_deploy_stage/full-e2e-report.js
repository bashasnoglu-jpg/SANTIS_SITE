const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:8000';
const ADMIN_URL = 'http://localhost:8000';
const TEST_PAGES = [
    '/tr/masajlar/kombine-masaj.html'
];

const results = [];

(async () => {
    // Launch headless Chromium
    const browser = await puppeteer.launch({ headless: 'new', defaultViewport: null });
    const page = await browser.newPage();

    console.log('🔹 Santis OS V5.5 Tam E2E Test Başlatılıyor...');

    // -------------------------------
    // 1️⃣ Blok C → F: DOM Hydrator Testi
    // -------------------------------
    console.log('1️⃣ Blok C → F: DOM Hydrator / data-santis-bind Testi');

    // We already injected data via Python script earlier, so we will use the existing mock
    for (const p of TEST_PAGES) {
        try {
            await page.goto(FRONTEND_URL + p, { waitUntil: 'networkidle0' });

            const binds = await page.$$eval('[data-santis-bind]', els => els.map(e => e.textContent.trim()));
            const success = binds.some(text => text.includes('Kombine') || text.includes('Recovered'));

            results.push({ page: p, step: 'DOM Hydrator (Blok F3)', status: success ? 'Başarı' : 'Hata', details: binds.join(' | ') });
        } catch (err) {
            results.push({ page: p, step: 'DOM Hydrator', status: 'Hata', error: err.message });
        }
    }

    // -------------------------------
    // 2️⃣ Blok E: ETag & Edge Resolver Testi
    // -------------------------------
    console.log('2️⃣ Blok E: ETag / Edge Resolver Testi');
    try {
        const resp = await page.goto(FRONTEND_URL + '/api/v1/content/resolve/kombine-masaj?region=tr');
        const headers = resp.headers();
        const etag = headers['etag'];
        results.push({ step: 'Edge Content Delivery (Blok E)', status: etag ? 'Başarı' : 'Hata (Etag Yok)' });
    } catch (err) {
        results.push({ step: 'Edge Content Delivery (Blok E)', status: 'Hata', error: err.message });
    }

    // -------------------------------
    // 3️⃣ Blok F: Skeleton Loader & Fetch Bridge
    // -------------------------------
    console.log('3️⃣ Blok F: Skeleton Loader & Fetch Interceptor Testi');
    try {
        await page.goto(FRONTEND_URL + TEST_PAGES[0]);
        // Evaluate JavaScript directly in the browser context mapped by Puppeteer
        const sfResult = await page.evaluate(async () => {
            let interceptorActive = false;
            try {
                const res = await fetch('/assets/data/content/services/kombine-masaj.json');
                interceptorActive = res.ok || res.status === 200 || res.status === 404;
            } catch (e) { }
            return {
                storeDefined: typeof window.SantisStore !== 'undefined',
                hydratorScan: typeof window.SantisHydrator !== 'undefined',
                interceptorActive: typeof window._santisBridgeActive !== 'undefined'
            };
        });

        results.push({
            step: 'L2 Interceptor & Store (Blok F1 & F2)',
            status: (sfResult.storeDefined && sfResult.interceptorActive && sfResult.hydratorScan) ? 'Başarı' : 'Hata',
            details: `Store: ${sfResult.storeDefined}, Bridge: ${sfResult.interceptorActive}, Hydrator API: ${sfResult.hydratorScan}`
        });

    } catch (err) {
        results.push({ step: 'L2 Interceptor & Store (Blok F1 & F2)', status: 'Hata', error: err.message });
    }

    // -------------------------------
    // 4️⃣ Blok D: Security & Integrity Audit
    // -------------------------------
    console.log('4️⃣ Blok D: Security & Integrity Audit API Testi');
    try {
        const integrityResp = await page.goto(ADMIN_URL + '/api/admin/content/integrity-scan');
        results.push({ step: 'Content Integrity Engine (Blok D2)', status: integrityResp.status() === 401 ? 'Başarı (Korumalı JWT)' : 'Hata' });

        const healthResp = await page.goto(ADMIN_URL + '/api/health');
        const hData = await healthResp.json();
        results.push({ step: 'Metrics & Observability (Blok D3)', status: hData.status === 'healthy' ? 'Başarı (Aktif)' : 'Hata' });

    } catch (err) {
        results.push({ step: 'Security & Integrity Audit', status: 'Hata', error: err.message });
    }

    // -------------------------------
    // Final Rapor JSON olarak kaydet
    // -------------------------------
    const reportFile = 'santis-e2e-report-v2.json';
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2), 'utf-8');

    console.log(`\n🔹 Tüm testler tamamlandı! Rapor: ${reportFile}`);
    console.table(results.map(r => ({
        Step: r.step,
        Status: r.status,
        Details: r.details || ''
    })));

    await browser.close();
})();
