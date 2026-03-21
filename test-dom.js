const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
        });
        page.on('pageerror', err => {
            console.error(`[BROWSER ERROR] ${err.toString()}`);
        });

        console.log("Navigating...");
        await page.goto('http://localhost:8080/', { waitUntil: 'networkidle2', timeout: 15000 });
        
        console.log("Waiting 3s for animations/loading...");
        await new Promise(r => setTimeout(r, 3000));
        
        const boxes = await page.evaluate(() => {
            const results = {};
            const elements = [
                'header#santis-header',
                'main#santis-main',
                'section.santis-hero',
                'section#ritual-stack',
                'div#global-trends',
                'section.santis-experience',
                'div#footer-container'
            ];
            
            elements.forEach(sel => {
                const el = document.querySelector(sel);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const computed = window.getComputedStyle(el);
                    results[sel] = {
                        y: rect.y,
                        height: rect.height,
                        position: computed.position,
                        opacity: computed.opacity,
                        visibility: computed.visibility,
                        display: computed.display
                    };
                } else {
                    results[sel] = "NOT_FOUND";
                }
            });
            return results;
        });
        
        console.log("\n--- LAYOUT STRUCTURE ---");
        console.log(JSON.stringify(boxes, null, 2));

        await browser.close();
    } catch (e) {
        console.error("Puppeteer Script Error:", e);
        process.exit(1);
    }
})();
