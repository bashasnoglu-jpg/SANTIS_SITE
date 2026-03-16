const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        page.on('requestfailed', request => {
            console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
        });

        console.log("Navigating to local file...");
        await page.goto(`file://${__dirname}/admin/gods-eye-vision.html`, { waitUntil: 'networkidle0' });
        
        console.log("Clicking a button...");
        await page.click('[data-target="ray"]').catch(e => console.log("Click failed:", e.message));

        await new Promise(r => setTimeout(r, 1000));
        await browser.close();
    } catch (e) {
        console.error("Runner Error:", e);
    }
})();
