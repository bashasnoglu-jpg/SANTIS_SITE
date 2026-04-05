const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        await page.goto('http://localhost:3003/', {waitUntil: 'networkidle2'});

        await page.hover('.service-link[data-menu="hamam"]'); // Hover hamam
        await page.waitForTimeout(500); // give it time to add class
        
        const metrics = await page.evaluate(() => {
            const container = document.getElementById('santis-liquid-menu');
            const content = document.getElementById('liquid-menu-content');
            const nav = document.getElementById('santis-main-nav');
            
            return {
                nav: nav ? nav.getBoundingClientRect() : null,
                container: container ? container.getBoundingClientRect() : null,
                content: content ? content.getBoundingClientRect() : null,
                containerStyles: container ? {
                    top: window.getComputedStyle(container).top,
                    position: window.getComputedStyle(container).position,
                    transform: window.getComputedStyle(container).transform,
                } : null
            };
        });
        
        console.log(JSON.stringify(metrics, null, 2));
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
