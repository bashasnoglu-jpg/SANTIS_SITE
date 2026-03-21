const { test, expect } = require('@playwright/test');

test('Debug overlap on tr/index.html', async ({ page }) => {
    const errors = [];
    const logs = [];

    // Dinle: Console hata ve logları
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
        logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', error => {
        errors.push(`Page Error: ${error.message}`);
    });

    console.log('Navigating to http://localhost:8080/ ...');
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
    
    // Tarayıcıya süre tanı
    await page.waitForTimeout(3000);

    console.log('--- CONSOLE ERRORS ---');
    errors.forEach(e => console.log(e));
    
    if (errors.length === 0) {
        console.log('No console errors detected!');
    }

    console.log('--- CONSOLE LOGS ---');
    logs.forEach(l => console.log(l));

    // Layout kontrolü: Eğer öğeler üst üste biniyorsa pozisyonları aynıdır.
    console.log('--- LAYOUT CHECK ---');
    const bboxes = await page.evaluate(() => {
        const header = document.querySelector('header').getBoundingClientRect();
        const main = document.querySelector('main').getBoundingClientRect();
        const firstSection = document.querySelector('section').getBoundingClientRect();
        const secondSection = document.querySelector('.santis-section') ? document.querySelector('.santis-section').getBoundingClientRect() : null;
        
        return {
            header: { y: header.y, height: header.height },
            main: { y: main.y, height: main.height },
            firstSection: { y: firstSection.y, height: firstSection.height },
            secondSection: secondSection ? { y: secondSection.y, height: secondSection.height } : null
        };
    });
    
    console.log('Bounding Boxes:', bboxes);
});
