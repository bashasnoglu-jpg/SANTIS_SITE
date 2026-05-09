const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    let errors = [];

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            errors.push(`${msg.type()}: ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        errors.push(`pageerror: ${error.message}`);
    });

    console.log("Navigating to http://localhost:8080/tr/index.html ...");
    await page.goto('http://localhost:8080/tr/index.html', { waitUntil: 'networkidle' });

    // Wait 2 seconds for all scripts to boot
    await page.waitForTimeout(2000);

    // evaluate whether cards have layout
    const stageData = await page.evaluate(() => {
        const stages = document.querySelectorAll('.santis-carousel-stage');
        let data = [];
        stages.forEach((stage, idx) => {
            const cards = stage.querySelectorAll('.santis-stack-card');
            const h = stage.offsetHeight;
            let visibleCards = 0;
            cards.forEach(c => {
               if (c.style.opacity !== '0' && c.style.opacity !== '' && c.offsetHeight > 0) visibleCards++;
            });
            data.push({
                index: idx,
                id: stage.id,
                stageHeight: h,
                totalCards: cards.length,
                visibleCards: visibleCards
            });
        });
        return { stages: data, initFnType: typeof window.initCoverFlowCarousel };
    });

    console.log("\n--- CONSOLE ERRORS & WARNINGS ---");
    errors.forEach(e => console.log(e));
    if(errors.length === 0) console.log("No critical JS errors found.");

    console.log("\n--- STAGE ANALYSIS ---");
    console.log(JSON.stringify(stageData, null, 2));

    await browser.close();
})();
