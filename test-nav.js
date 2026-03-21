const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Yüklenme hatalarını yoksay ve bekle
    await page.goto('http://localhost:8080/cilt-bakimi.html', { waitUntil: 'networkidle0' });
    
    // Navbarı bulalım
    await page.waitForSelector('.sovereign-brand-bar', { timeout: 5000 });
    
    const style = await page.evaluate(() => {
        const bar = document.querySelector('.sovereign-brand-bar');
        const comp = window.getComputedStyle(bar);
        
        const nav = document.querySelector('nav.sovereign-nav');
        const navComp = window.getComputedStyle(nav);

        const container = document.getElementById('navbar-container');
        const containerComp = window.getComputedStyle(container);

        const hero = document.querySelector('.santis-hero-video');
        const heroComp = window.getComputedStyle(hero);
        
        return {
            bar: {
                bg: comp.backgroundColor,
                opacity: comp.opacity,
                display: comp.display,
                zIndex: comp.zIndex,
                height: comp.height
            },
            nav: {
                display: navComp.display,
                zIndex: navComp.zIndex,
                top: navComp.top,
                position: navComp.position,
                transform: navComp.transform
            },
            container: {
                zIndex: containerComp.zIndex,
                position: containerComp.position
            },
            hero: {
                zIndex: heroComp.zIndex,
                position: heroComp.position
            }
        };
    });
    
    console.log(JSON.stringify(style, null, 2));
    await browser.close();
})();
