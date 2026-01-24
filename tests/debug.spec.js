const { test, expect } = require('@playwright/test');
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5501';

test('debug: booking network', async ({ page }) => {
  test.setTimeout(60000);

  page.on('request', req => {
    const u = req.url();
    if (u.includes('navbar') || u.includes('footer') || u.includes('hotels.json'))
      console.log('REQ  :', req.method(), u);
  });

  page.on('response', res => {
    const u = res.url();
    if (u.includes('navbar') || u.includes('footer') || u.includes('hotels.json'))
      console.log('RESP :', res.status(), u);
  });

  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));

  await page.goto(baseURL + '/booking.html?hotel=alba-resort&lang=tr', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/Santis/i);
});
